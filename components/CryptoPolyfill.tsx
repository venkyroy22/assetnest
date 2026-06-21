"use client";

import { useEffect } from "react";

export default function CryptoPolyfill() {
    useEffect(() => {
        if (typeof window !== "undefined") {
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
        }
    }, []);

    return null;
}
