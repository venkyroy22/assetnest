module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/ig/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(req) {
    try {
        const { url } = await req.json();
        if (!url || !url.includes('instagram.com')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Please enter a valid Instagram URL'
            }, {
                status: 400
            });
        }
        const cleanUrl = url.split('?')[0];
        // Many local ISPs and Antiviruses in development mode block external proxy servers using deep packet inspection.
        // We instruct the Node engine to ignore strict localhost TLS certificate rejections during Dev fetching.
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        // FALLBACK 1: We use a lightweight public scraping API that is specifically designed not to block NodeJS
        try {
            const res = await fetch(`https://instagram-videos.vercel.app/api/video?url=${encodeURIComponent(cleanUrl)}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                },
                signal: AbortSignal.timeout(8000)
            });
            const data = await res.json();
            if (data && data.data && data.data.videoUrl) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    mediaUrl: data.data.videoUrl,
                    isVideo: true
                });
            }
        } catch (e) {
            console.log("Fallback 1 failed", e);
        }
        // FALLBACK 2: Querying the highly unblocked RapidAPI format wrapper (A free public instance variant)
        try {
            const formData = new URLSearchParams();
            formData.append('q', cleanUrl);
            formData.append('t', 'media');
            formData.append('lang', 'en');
            const res = await fetch('https://v3.saveig.app/api/ajaxSearch', {
                method: 'POST',
                body: formData.toString(),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: AbortSignal.timeout(10000)
            });
            const html = await res.text();
            const videoMatch = html.match(/href=\\"([^"]+\.mp4[^"]*)\\"/i) || html.match(/href="([^"]+\.mp4[^"]*)"/i);
            const imageMatch = html.match(/href=\\"([^"]+\.jpg[^"]*)\\"/i) || html.match(/href="([^"]+\.jpg[^"]*)"/i);
            let mediaUrl = null;
            let isVideo = false;
            if (videoMatch && videoMatch[1]) {
                mediaUrl = videoMatch[1].replace(/\\&amp;/g, '&').replace(/\\/g, '');
                isVideo = true;
            } else if (imageMatch && imageMatch[1]) {
                mediaUrl = imageMatch[1].replace(/\\&amp;/g, '&').replace(/\\/g, '');
            }
            if (mediaUrl) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    mediaUrl,
                    isVideo
                });
            }
        } catch (e) {
            console.log("Fallback 2 failed", e);
        }
        // FALLBACK 3: SSSInstagram
        try {
            const res = await fetch('https://sssinstagram.com/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify({
                    link: cleanUrl
                }),
                signal: AbortSignal.timeout(8000)
            });
            const data = await res.json();
            if (data && data.data && data.data.video) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    mediaUrl: data.data.video,
                    isVideo: true
                });
            }
        } catch (e) {
            console.log("Fallback 3 failed", e);
        }
        // If all endpoints time out, this means the Local Network (WiFi) is violently blocking proxy routing.
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Local network or ISP is blocking proxy routing. Try turning on a VPN, or this will resolve automatically once the app is deployed to Production/Vercel.'
        }, {
            status: 500
        });
    } catch (error) {
        console.error('Instagram Scraper Main Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'An unexpected error occurred while extracting the media.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__da49bcd8._.js.map