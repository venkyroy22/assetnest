(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/data/mockData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "assetFilters",
    ()=>assetFilters,
    "assets",
    ()=>assets,
    "pinterestKeywords",
    ()=>pinterestKeywords,
    "tools",
    ()=>tools
]);
const assets = [
    {
        id: "1",
        title: "Minimal UI Kit",
        description: "A clean, black and white UI kit for mobile applications.",
        category: "UI Kits",
        previewUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=2070&auto=format&fit=crop",
        downloadUrl: "https://drive.google.com/drive/folders/placeholder1",
        license: "Free"
    },
    {
        id: "2",
        title: "Cinematic LUTs Pack",
        description: "Professional color grading presets for video editors.",
        category: "LUTs",
        previewUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop",
        downloadUrl: "https://drive.google.com/drive/folders/placeholder2",
        license: "Free"
    },
    {
        id: "3",
        title: "YouTube Thumbnail Pack",
        description: "High-click-through rate templates for creators.",
        category: "Thumbnails",
        previewUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop",
        downloadUrl: "https://drive.google.com/drive/folders/placeholder3",
        license: "Free"
    },
    {
        id: "4",
        title: "Instagram Story Templates",
        description: "Minimalist social media assets for brand building.",
        category: "Social Media Templates",
        previewUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1974&auto=format&fit=crop",
        downloadUrl: "https://drive.google.com/drive/folders/placeholder4",
        license: "Free"
    },
    {
        id: "5",
        title: "Retro VHS Overlays",
        description: "Add a nostalgic feel to your video projects.",
        category: "Overlays",
        previewUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
        downloadUrl: "https://drive.google.com/drive/folders/placeholder5",
        license: "Free"
    }
];
const tools = [
    {
        id: "t1",
        name: "Figma",
        description: "The collaborative interface design tool.",
        category: "Design",
        link: "https://figma.com"
    },
    {
        id: "t2",
        name: "Adobe Premiere Pro",
        description: "Industry-leading video editing software.",
        category: "Video Editing",
        link: "https://adobe.com/products/premiere"
    },
    {
        id: "t3",
        name: "Midjourney",
        description: "Powerful AI image generation tool.",
        category: "AI Tools",
        link: "https://midjourney.com"
    },
    {
        id: "t4",
        name: "Behance",
        description: "Showcase and discover creative work.",
        category: "Resources",
        link: "https://behance.net"
    }
];
const pinterestKeywords = [
    {
        title: "Pinterest Keywords for Designers",
        slug: "designers",
        keywords: [
            "Graphic Design Inspiration",
            "Minimalist Logo Design",
            "Typography Trends 2024",
            "Brand Identity Design",
            "UX/UI Case Studies"
        ],
        tips: [
            "Use broad terms combined with specific niches.",
            "Update your keywords every season.",
            "Analyze your competitor's boards."
        ]
    },
    {
        title: "Pinterest Keywords for Video Editors",
        slug: "video-editors",
        keywords: [
            "Video Editing Transitions",
            "Color Grading Tips",
            "After Effects Templates",
            "Youtube SEO for Video",
            "Short Form Video Content Ideas"
        ],
        tips: [
            "Focus on 'How-to' content keywords.",
            "Visual terms like 'aesthetic' and 'cinematic' work well.",
            "Include software names in your searches."
        ]
    }
];
const assetFilters = [
    "Recommended",
    "New Assets",
    "Most Popular",
    "UI Kits",
    "Overlays",
    "LUTs",
    "Pinterest Tools"
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/AssetCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/heart.js [app-client] (ecmascript) <export default as Heart>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/plus.js [app-client] (ecmascript) <export default as Plus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize-2.js [app-client] (ecmascript) <export default as Maximize2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
const AssetCard = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(44);
    if ($[0] !== "134e47a0aa3975d72aa72be8075b0f57147013113950f29edeafa3cdb3043fdc") {
        for(let $i = 0; $i < 44; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "134e47a0aa3975d72aa72be8075b0f57147013113950f29edeafa3cdb3043fdc";
    }
    const { asset } = t0;
    const [isHovered, setIsHovered] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ()=>setIsHovered(true);
        t2 = ()=>setIsHovered(false);
        $[1] = t1;
        $[2] = t2;
    } else {
        t1 = $[1];
        t2 = $[2];
    }
    const t3 = `object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`;
    let t4;
    if ($[3] !== asset.previewUrl || $[4] !== asset.title || $[5] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            src: asset.previewUrl,
            alt: asset.title,
            fill: true,
            className: t3
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 38,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[3] = asset.previewUrl;
        $[4] = asset.title;
        $[5] = t3;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    const t5 = `text-[10px] font-black uppercase tracking-widest px-2 py-1 border transition-colors ${asset.license === "Premium" ? "bg-foreground text-background border-foreground" : "bg-background/80 backdrop-blur-md text-foreground border-border"}`;
    let t6;
    if ($[7] !== asset.license || $[8] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-3 left-3 z-20",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: t5,
                children: asset.license
            }, void 0, false, {
                fileName: "[project]/components/AssetCard.tsx",
                lineNumber: 49,
                columnNumber: 54
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 49,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[7] = asset.license;
        $[8] = t5;
        $[9] = t6;
    } else {
        t6 = $[9];
    }
    const t7 = `absolute inset-0 z-30 transition-opacity duration-300 flex flex-col justify-between p-4 ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"}`;
    let t8;
    let t9;
    if ($[10] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 60,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 61,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[10] = t8;
        $[11] = t9;
    } else {
        t8 = $[10];
        t9 = $[11];
    }
    const t10 = isHovered ? "none" : "currentColor";
    let t11;
    if ($[12] !== t10) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "w-9 h-9 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-sm hover:bg-foreground hover:text-background transition-colors shadow-sm",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$heart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Heart$3e$__["Heart"], {
                size: 18,
                fill: t10
            }, void 0, false, {
                fileName: "[project]/components/AssetCard.tsx",
                lineNumber: 71,
                columnNumber: 187
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 71,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[12] = t10;
        $[13] = t11;
    } else {
        t11 = $[13];
    }
    let t12;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "w-9 h-9 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-sm hover:bg-foreground hover:text-background transition-colors shadow-sm",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Plus$3e$__["Plus"], {
                size: 18
            }, void 0, false, {
                fileName: "[project]/components/AssetCard.tsx",
                lineNumber: 79,
                columnNumber: 187
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 79,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[14] = t12;
    } else {
        t12 = $[14];
    }
    let t13;
    if ($[15] !== t11) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative z-40 flex justify-end space-x-2",
            children: [
                t11,
                t12
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 86,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[15] = t11;
        $[16] = t13;
    } else {
        t13 = $[16];
    }
    let t14;
    if ($[17] !== asset.category) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1",
            children: asset.category
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 94,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[17] = asset.category;
        $[18] = t14;
    } else {
        t14 = $[18];
    }
    let t15;
    if ($[19] !== asset.title) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
            className: "text-white text-base font-bold leading-tight line-clamp-1",
            children: asset.title
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 102,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[19] = asset.title;
        $[20] = t15;
    } else {
        t15 = $[20];
    }
    let t16;
    if ($[21] !== t14 || $[22] !== t15) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-3",
            children: [
                t14,
                t15
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 110,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = t14;
        $[22] = t15;
        $[23] = t16;
    } else {
        t16 = $[23];
    }
    const t17 = `/assets/${asset.id}`;
    let t18;
    if ($[24] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize2$3e$__["Maximize2"], {
            size: 14
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 120,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[24] = t18;
    } else {
        t18 = $[24];
    }
    let t19;
    if ($[25] !== t17) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            href: t17,
            className: "flex-grow bg-white text-black py-2.5 px-4 text-[11px] font-black uppercase tracking-widest text-center rounded-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2",
            children: [
                t18,
                " VIEW DETAILS"
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 127,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[25] = t17;
        $[26] = t19;
    } else {
        t19 = $[26];
    }
    let t20;
    if ($[27] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
            size: 20
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 135,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[27] = t20;
    } else {
        t20 = $[27];
    }
    let t21;
    if ($[28] !== asset.downloadUrl) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
            href: asset.downloadUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "bg-foreground text-background w-11 h-11 flex items-center justify-center rounded-sm hover:scale-105 transition-transform",
            onClick: _temp,
            children: t20
        }, void 0, false, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 142,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[28] = asset.downloadUrl;
        $[29] = t21;
    } else {
        t21 = $[29];
    }
    let t22;
    if ($[30] !== t19 || $[31] !== t21) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2",
            children: [
                t19,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 150,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[30] = t19;
        $[31] = t21;
        $[32] = t22;
    } else {
        t22 = $[32];
    }
    let t23;
    if ($[33] !== t16 || $[34] !== t22) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative z-40",
            children: [
                t16,
                t22
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 159,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[33] = t16;
        $[34] = t22;
        $[35] = t23;
    } else {
        t23 = $[35];
    }
    let t24;
    if ($[36] !== t13 || $[37] !== t23 || $[38] !== t7) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t7,
            children: [
                t8,
                t9,
                t13,
                t23
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 168,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[36] = t13;
        $[37] = t23;
        $[38] = t7;
        $[39] = t24;
    } else {
        t24 = $[39];
    }
    let t25;
    if ($[40] !== t24 || $[41] !== t4 || $[42] !== t6) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative group overflow-hidden rounded-md border border-border aspect-[4/3] bg-zinc-900",
            onMouseEnter: t1,
            onMouseLeave: t2,
            children: [
                t4,
                t6,
                t24
            ]
        }, void 0, true, {
            fileName: "[project]/components/AssetCard.tsx",
            lineNumber: 178,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[40] = t24;
        $[41] = t4;
        $[42] = t6;
        $[43] = t25;
    } else {
        t25 = $[43];
    }
    return t25;
};
_s(AssetCard, "FPQn8a98tPjpohC7NUYORQR8GJE=");
_c = AssetCard;
const __TURBOPACK__default__export__ = AssetCard;
function _temp(e) {
    return e.stopPropagation();
}
var _c;
__turbopack_context__.k.register(_c, "AssetCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$mockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/data/mockData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AssetCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/AssetCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/search.js [app-client] (ecmascript) <export default as Search>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function Home() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(22);
    if ($[0] !== "50f2c07246f990c031ddf3e748cae51580bd1fe5c6b8337911d224ef24a44b90") {
        for(let $i = 0; $i < 22; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "50f2c07246f990c031ddf3e748cae51580bd1fe5c6b8337911d224ef24a44b90";
    }
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    let t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = ({
            "Home[useEffect()]": ()=>{
                setMounted(true);
            }
        })["Home[useEffect()]"];
        t1 = [];
        $[1] = t0;
        $[2] = t1;
    } else {
        t0 = $[1];
        t1 = $[2];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t0, t1);
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = [
            "Minimalist UI",
            "Cinematic LUTs",
            "Instagram Story",
            "Figma Design",
            "Overlays"
        ];
        $[3] = t2;
    } else {
        t2 = $[3];
    }
    const trendingTags = t2;
    if (!mounted) {
        let t3;
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen bg-background"
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 47,
                columnNumber: 12
            }, this);
            $[4] = t3;
        } else {
            t3 = $[4];
        }
        return t3;
    }
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-10",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "absolute w-full h-full",
                viewBox: "0 0 100 100",
                preserveAspectRatio: "none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M0,100 C30,50 70,50 100,0",
                    stroke: "currentColor",
                    strokeWidth: "0.05",
                    fill: "none",
                    className: "text-foreground"
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 56,
                    columnNumber: 184
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 56,
                columnNumber: 95
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 56,
            columnNumber: 10
        }, this);
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    let t4;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-3xl md:text-5xl font-black tracking-tight uppercase text-foreground mx-auto max-w-3xl leading-[0.9]",
                    children: [
                        "EVERYTHING ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "opacity-40",
                            children: "CREATORS"
                        }, void 0, false, {
                            fileName: "[project]/app/page.tsx",
                            lineNumber: 63,
                            columnNumber: 169
                        }, this),
                        " NEED."
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 63,
                    columnNumber: 37
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm md:text-base text-secondary font-medium max-w-lg mx-auto",
                    children: "Curated assets, strategic tools, and infinite inspiration."
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 63,
                    columnNumber: 224
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 63,
            columnNumber: 10
        }, this);
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "pl-4 text-secondary",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$search$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Search$3e$__["Search"], {
                size: 16
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 70,
                columnNumber: 47
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 70,
            columnNumber: 10
        }, this);
        $[7] = t5;
    } else {
        t5 = $[7];
    }
    let t6;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = ({
            "Home[<input>.onChange]": (e)=>setSearchQuery(e.target.value)
        })["Home[<input>.onChange]"];
        $[8] = t6;
    } else {
        t6 = $[8];
    }
    let t7;
    if ($[9] !== searchQuery) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
            type: "text",
            placeholder: "Search resources...",
            className: "w-full bg-transparent border-none focus:ring-0 py-3 px-3 text-sm font-semibold placeholder:text-secondary/40",
            value: searchQuery,
            onChange: t6
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 86,
            columnNumber: 10
        }, this);
        $[9] = searchQuery;
        $[10] = t7;
    } else {
        t7 = $[10];
    }
    let t8;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "bg-foreground text-background px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity",
            children: "Search"
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 94,
            columnNumber: 10
        }, this);
        $[11] = t8;
    } else {
        t8 = $[11];
    }
    let t9;
    if ($[12] !== t7) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative max-w-xl mx-auto w-full",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative flex items-center bg-zinc-900 border border-border hover:border-foreground transition-all duration-300",
                children: [
                    t5,
                    t7,
                    t8
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 101,
                columnNumber: 60
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 101,
            columnNumber: 10
        }, this);
        $[12] = t7;
        $[13] = t9;
    } else {
        t9 = $[13];
    }
    let t10;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap items-center justify-center gap-2 pt-2",
            children: trendingTags.slice(0, 3).map(_HomeAnonymous)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 109,
            columnNumber: 11
        }, this);
        $[14] = t10;
    } else {
        t10 = $[14];
    }
    let t11;
    if ($[15] !== t9) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "relative flex items-center justify-center pt-8 pb-8 overflow-hidden bg-background",
            children: [
                t3,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative z-10 w-full max-w-5xl mx-auto text-center px-10",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-8",
                        children: [
                            t4,
                            t9,
                            t10
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 116,
                        columnNumber: 192
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 116,
                    columnNumber: 118
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 116,
            columnNumber: 11
        }, this);
        $[15] = t9;
        $[16] = t11;
    } else {
        t11 = $[16];
    }
    let t12;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: "text-3xl font-black tracking-tighter uppercase text-foreground",
                    children: "Curated For You"
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 124,
                    columnNumber: 33
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-secondary text-sm font-medium",
                    children: "Original resources from AssetNest."
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 124,
                    columnNumber: 132
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 124,
            columnNumber: 11
        }, this);
        $[17] = t12;
    } else {
        t12 = $[17];
    }
    let t13;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "py-8 bg-zinc-950/20",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-10",
                children: [
                    t12,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$data$2f$mockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["assets"].slice(0, 1).map(_HomeAnonymous2)
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 131,
                        columnNumber: 80
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 131,
                columnNumber: 52
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 131,
            columnNumber: 11
        }, this);
        $[18] = t13;
    } else {
        t13 = $[18];
    }
    let t14;
    if ($[19] !== t11 || $[20] !== t13) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col",
            children: [
                t11,
                t13
            ]
        }, void 0, true, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 138,
            columnNumber: 11
        }, this);
        $[19] = t11;
        $[20] = t13;
        $[21] = t14;
    } else {
        t14 = $[21];
    }
    return t14;
}
_s(Home, "iWSoS9tWbuCgxMTTHnEYCS/M6KM=");
_c = Home;
function _HomeAnonymous2(asset, idx) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$AssetCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        asset: asset
    }, `${asset.id}-${idx}`, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 148,
        columnNumber: 10
    }, this);
}
function _HomeAnonymous(tag) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border border-border hover:border-foreground transition-all",
        children: tag
    }, tag, false, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 151,
        columnNumber: 10
    }, this);
}
var _c;
__turbopack_context__.k.register(_c, "Home");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_3349bd40._.js.map