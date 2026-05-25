/**
 * Polyfills for older mobile browsers that lack modern JS APIs
 * used by pdfjs-dist v5.x. Must run BEFORE pdfjs-dist is imported.
 */
if (typeof window !== "undefined") {

    // crypto.randomUUID (disabled in insecure HTTP contexts like local network IP testing on mobile)
    if (typeof window.crypto === "undefined") {
        (window as any).crypto = {} as any;
    }
    const wCrypto = window.crypto as any;
    if (!wCrypto.randomUUID) {
        Object.defineProperty(wCrypto, "randomUUID", {
            value: function() {
                if (typeof wCrypto.getRandomValues === "function") {
                    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
                        (c ^ wCrypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                    );
                }
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === "x" ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            writable: true,
            configurable: true
        });
    }

    // Promise.withResolvers (Chrome 119+, Safari 17.4+)
    if (typeof (Promise as any).withResolvers === "undefined") {
        (Promise as any).withResolvers = function <T>() {
            let resolve!: (v: T | PromiseLike<T>) => void;
            let reject!: (r?: any) => void;
            const promise = new Promise<T>((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    }

    // Map.prototype.getOrInsertComputed (Chrome 145+, Safari 26.2+)
    if (typeof Map !== "undefined" && typeof (Map.prototype as any).getOrInsertComputed !== "function") {
        (Map.prototype as any).getOrInsertComputed = function <K, V>(
            key: K,
            callbackfn: (key: K) => V
        ): V {
            if (this.has(key)) {
                return this.get(key)!;
            }
            const value = callbackfn(key);
            this.set(key, value);
            return value;
        };
    }

    // Map.prototype.getOrInsert (Chrome 145+, Safari 26.2+)
    if (typeof Map !== "undefined" && typeof (Map.prototype as any).getOrInsert !== "function") {
        (Map.prototype as any).getOrInsert = function <K, V>(key: K, defaultValue: V): V {
            if (this.has(key)) {
                return this.get(key)!;
            }
            this.set(key, defaultValue);
            return defaultValue;
        };
    }

    // WeakMap.prototype.getOrInsertComputed
    if (typeof WeakMap !== "undefined" && typeof (WeakMap.prototype as any).getOrInsertComputed !== "function") {
        (WeakMap.prototype as any).getOrInsertComputed = function <K extends WeakKey, V>(
            key: K,
            callbackfn: (key: K) => V
        ): V {
            if (this.has(key)) {
                return this.get(key)!;
            }
            const value = callbackfn(key);
            this.set(key, value);
            return value;
        };
    }

    // WeakMap.prototype.getOrInsert
    if (typeof WeakMap !== "undefined" && typeof (WeakMap.prototype as any).getOrInsert !== "function") {
        (WeakMap.prototype as any).getOrInsert = function <K extends WeakKey, V>(key: K, defaultValue: V): V {
            if (this.has(key)) {
                return this.get(key)!;
            }
            this.set(key, defaultValue);
            return defaultValue;
        };
    }
}
export {};
