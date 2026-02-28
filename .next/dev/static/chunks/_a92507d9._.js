(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/Container.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
;
;
const Container = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(5);
    if ($[0] !== "f1f903e85b67f24d989701e8c58adbe3cf835652467268f901e93064a2a35251") {
        for(let $i = 0; $i < 5; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "f1f903e85b67f24d989701e8c58adbe3cf835652467268f901e93064a2a35251";
    }
    const { children, className: t1, as: t2 } = t0;
    const className = t1 === undefined ? "" : t1;
    const Component = t2 === undefined ? "div" : t2;
    const t3 = `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`;
    let t4;
    if ($[1] !== Component || $[2] !== children || $[3] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
            className: t3,
            children: children
        }, void 0, false, {
            fileName: "[project]/components/Container.tsx",
            lineNumber: 26,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[1] = Component;
        $[2] = children;
        $[3] = t3;
        $[4] = t4;
    } else {
        t4 = $[4];
    }
    return t4;
};
_c = Container;
const __TURBOPACK__default__export__ = Container;
var _c;
__turbopack_context__.k.register(_c, "Container");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/tools/qr/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>QRGeneratorPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/qrcode/lib/browser.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Container$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Container.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/copy.js [app-client] (ecmascript) <export default as Copy>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/download.js [app-client] (ecmascript) <export default as Download>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$qr$2d$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__QrCode$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/qr-code.js [app-client] (ecmascript) <export default as QrCode>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-client] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wand$2d$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wand2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/wand-sparkles.js [app-client] (ecmascript) <export default as Wand2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/upload.js [app-client] (ecmascript) <export default as Upload>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image.js [app-client] (ecmascript) <export default as Image>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/smile.js [app-client] (ecmascript) <export default as Smile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/star.js [app-client] (ecmascript) <export default as Star>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/maximize.js [app-client] (ecmascript) <export default as Maximize>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image-plus.js [app-client] (ecmascript) <export default as ImagePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const FG_PRESETS = [
    '#000000',
    '#27272a',
    '#1e3a8a',
    '#4c1d95',
    '#be123c',
    '#047857'
];
const BG_PRESETS = [
    '#ffffff',
    '#f4f4f5',
    '#fffbeb',
    '#f0fdf4',
    '#eff6ff',
    '#faf5ff'
];
function QRGeneratorPage() {
    _s();
    const [url, setUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [fgColor, setFgColor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("#000000");
    const [bgColor, setBgColor] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("#ffffff");
    const [patternType, setPatternType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("square");
    const [cornerType, setCornerType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("square");
    const [openSection, setOpenSection] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("pattern");
    const [emojiChar, setEmojiChar] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("🔥");
    const [patternLogo, setPatternLogo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [cornerEmojiChar, setCornerEmojiChar] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("💎");
    const [cornerLogo, setCornerLogo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [centerLogo, setCenterLogo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const patternInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const cornerInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const centerInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const loadImage = (src)=>{
        return new Promise((resolve, reject)=>{
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = ()=>resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };
    const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius)=>{
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for(let i = 0; i < spikes; i++){
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    };
    const drawHeart = (ctx_0, x_0, y_0, w, h)=>{
        const d = Math.min(w, h);
        const k = x_0 + w / 2;
        ctx_0.beginPath();
        ctx_0.moveTo(k, y_0 + d / 4);
        ctx_0.quadraticCurveTo(k, y_0, x_0 + w / 4, y_0);
        ctx_0.quadraticCurveTo(x_0, y_0, x_0, y_0 + d / 2.25);
        ctx_0.quadraticCurveTo(x_0, y_0 + d * 0.65, k, y_0 + d);
        ctx_0.quadraticCurveTo(x_0 + w, y_0 + d * 0.65, x_0 + w, y_0 + d / 2.25);
        ctx_0.quadraticCurveTo(x_0 + w, y_0, x_0 + w * 0.75, y_0);
        ctx_0.quadraticCurveTo(k, y_0, k, y_0 + d / 4);
        ctx_0.fill();
    };
    const renderQR = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "QRGeneratorPage.useCallback[renderQR]": async (isDownload = false)=>{
            const canvas = isDownload ? document.createElement('canvas') : canvasRef.current;
            if (!canvas) return;
            const ctx_1 = canvas.getContext('2d');
            if (!ctx_1) return;
            // Force native high-res render; 2048 for download, 1024 for on-screen (CSS handles scale-down)
            const size = isDownload ? 2048 : 1024;
            canvas.width = size;
            canvas.height = size;
            let matrix;
            try {
                const qr = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$qrcode$2f$lib$2f$browser$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create(url || "https://assetnest.design", {
                    errorCorrectionLevel: 'H'
                });
                matrix = qr.modules;
            } catch (e) {
                return; // invalid URL data
            }
            const margin = size * 0.05; // 5% Quiet Zone minimum
            const innerSize = size - margin * 2;
            const moduleCount = matrix.size;
            const cellSize = innerSize / moduleCount;
            // Preload images if needed
            let pImg = null;
            if (patternType === 'logo' && patternLogo) {
                try {
                    pImg = await loadImage(patternLogo);
                } catch (e_0) {
                    console.error(e_0);
                }
            }
            let cImg = null;
            if (centerLogo) {
                try {
                    cImg = await loadImage(centerLogo);
                } catch (e_1) {
                    console.error(e_1);
                }
            }
            // Fill Base Background
            ctx_1.fillStyle = bgColor;
            ctx_1.fillRect(0, 0, size, size);
            // Prepare colors and fonts
            ctx_1.fillStyle = fgColor;
            ctx_1.textAlign = "center";
            ctx_1.textBaseline = "middle";
            const drawFinder = {
                "QRGeneratorPage.useCallback[renderQR].drawFinder": (startX, startY)=>{
                    const x_1 = margin + startX * cellSize;
                    const y_1 = margin + startY * cellSize;
                    const s7 = 7 * cellSize;
                    const s5 = 5 * cellSize;
                    const s3 = 3 * cellSize;
                    ctx_1.fillStyle = fgColor;
                    // STEP 1: Always draw a strictly scannable Outer Ring (7x7 Dark, 5x5 Light)
                    // This prevents custom shapes like hearts from breaking scanner bounds
                    ctx_1.fillStyle = fgColor;
                    if (cornerType === 'rounded') {
                        const r = cellSize * 2;
                        ctx_1.beginPath();
                        ctx_1.roundRect(x_1, y_1, s7, s7, r);
                        ctx_1.fill();
                        ctx_1.fillStyle = bgColor;
                        ctx_1.beginPath();
                        ctx_1.roundRect(x_1 + cellSize, y_1 + cellSize, s5, s5, r - cellSize);
                        ctx_1.fill();
                    } else if (cornerType === 'dots') {
                        const cx_0 = x_1 + s7 / 2;
                        const cy_0 = y_1 + s7 / 2;
                        ctx_1.beginPath();
                        ctx_1.arc(cx_0, cy_0, s7 / 2, 0, Math.PI * 2);
                        ctx_1.fill();
                        ctx_1.fillStyle = bgColor;
                        ctx_1.beginPath();
                        ctx_1.arc(cx_0, cy_0, s5 / 2, 0, Math.PI * 2);
                        ctx_1.fill();
                    } else {
                        // For square, heart, emoji, and logo -> Fallback to a safe standard frame
                        // We add a subtle rounding to custom shapes for aesthetics, but keep it sharp enough to scan reliably
                        const isCustom = cornerType === 'heart';
                        const r_0 = isCustom ? cellSize * 0.5 : 0;
                        ctx_1.beginPath();
                        ctx_1.roundRect(x_1, y_1, s7, s7, r_0);
                        ctx_1.fill();
                        ctx_1.fillStyle = bgColor;
                        ctx_1.beginPath();
                        ctx_1.roundRect(x_1 + cellSize, y_1 + cellSize, s5, s5, Math.max(0, r_0 - cellSize));
                        ctx_1.fill();
                    }
                    // STEP 2: Draw the Inner Core (3x3 area) with the custom styling
                    if (cornerType === 'rounded') {
                        ctx_1.fillStyle = fgColor;
                        ctx_1.beginPath();
                        ctx_1.roundRect(x_1 + cellSize * 2, y_1 + cellSize * 2, s3, s3, cellSize);
                        ctx_1.fill();
                    } else if (cornerType === 'dots') {
                        ctx_1.fillStyle = fgColor;
                        const cx_1 = x_1 + s7 / 2;
                        const cy_1 = y_1 + s7 / 2;
                        ctx_1.beginPath();
                        ctx_1.arc(cx_1, cy_1, s3 / 2, 0, Math.PI * 2);
                        ctx_1.fill();
                    } else if (cornerType === 'heart') {
                        ctx_1.fillStyle = fgColor;
                        // Expanded shape to act as a solid 3x3 dark-mass block for the scanner
                        drawHeart(ctx_1, x_1 + s7 / 2 - s3 * 1.15 / 2, y_1 + s7 / 2 - s3 * 1.15 / 2, s3 * 1.15, s3 * 1.15);
                    } else {
                        ctx_1.fillStyle = fgColor;
                        ctx_1.fillRect(x_1 + cellSize * 2, y_1 + cellSize * 2, s3, s3);
                    }
                }
            }["QRGeneratorPage.useCallback[renderQR].drawFinder"];
            // Calculate center logo bounds to avoid drawing modules underneath it
            let logoBounds = null;
            if (cImg) {
                const maxLogoSize = innerSize * 0.22;
                // Preserve Center Logo Aspect Ratio
                const cRatio = cImg.width / cImg.height;
                let cWidth = maxLogoSize;
                let cHeight = maxLogoSize;
                if (cRatio > 1) {
                    cHeight = maxLogoSize / cRatio;
                } else {
                    cWidth = maxLogoSize * cRatio;
                }
                const padding = margin * 0.6;
                const lx = (size - cWidth) / 2;
                const ly = (size - cHeight) / 2;
                logoBounds = {
                    xMin: lx - padding,
                    xMax: lx + cWidth + padding,
                    yMin: ly - padding,
                    yMax: ly + cHeight + padding,
                    cWidth,
                    cHeight,
                    isCircle: true,
                    cx: size / 2,
                    cy: size / 2,
                    radius: Math.max(cWidth, cHeight) / 2 + padding
                };
            }
            // Iterating over QR matrix
            for(let r_1 = 0; r_1 < moduleCount; r_1++){
                for(let c = 0; c < moduleCount; c++){
                    const isDark = matrix.data[r_1 * moduleCount + c];
                    if (!isDark) continue;
                    const cx_2 = margin + c * cellSize + cellSize / 2;
                    const cy_2 = margin + r_1 * cellSize + cellSize / 2;
                    const x_2 = margin + c * cellSize;
                    const y_2 = margin + r_1 * cellSize;
                    // Skip rendering individual finder modules, we draw them cleanly later
                    const inFinder = r_1 <= 6 && c <= 6 || r_1 <= 6 && c >= moduleCount - 7 || r_1 >= moduleCount - 7 && c <= 6;
                    if (inFinder) continue;
                    // Skip rendering modules that fall inside the center logo box
                    if (logoBounds) {
                        if (logoBounds.isCircle) {
                            // Calculate distance from center of QR to center of this module
                            const dist = Math.sqrt(Math.pow(cx_2 - logoBounds.cx, 2) + Math.pow(cy_2 - logoBounds.cy, 2));
                            // Give it a tiny bit of buffer based on cellSize so squares don't clip the pure circle
                            if (dist < logoBounds.radius + cellSize * 0.4) {
                                continue;
                            }
                        } else {
                            if (x_2 + cellSize > logoBounds.xMin && x_2 < logoBounds.xMax && y_2 + cellSize > logoBounds.yMin && y_2 < logoBounds.yMax) {
                                continue;
                            }
                        }
                    }
                    ctx_1.fillStyle = fgColor;
                    if (patternType === 'square') {
                        ctx_1.fillRect(Math.floor(x_2), Math.floor(y_2), Math.ceil(cellSize), Math.ceil(cellSize));
                    } else if (patternType === 'rounded') {
                        ctx_1.beginPath();
                        ctx_1.roundRect(x_2, y_2, cellSize, cellSize, cellSize * 0.4);
                        ctx_1.fill();
                    } else if (patternType === 'dots') {
                        ctx_1.beginPath();
                        ctx_1.arc(cx_2, cy_2, cellSize / 2 * 0.9, 0, Math.PI * 2);
                        ctx_1.fill();
                    } else if (patternType === 'star') {
                        drawStar(ctx_1, cx_2, cy_2, 5, cellSize / 1.8, cellSize / 3.8);
                    } else if (patternType === 'emoji') {
                        ctx_1.font = `${cellSize * 1.0}px Arial`;
                        ctx_1.fillText(emojiChar || "🔥", cx_2, cy_2 + cellSize * 0.1);
                    } else if (patternType === 'logo' && pImg) {
                        // Preserve Pattern Logo Aspect Ratio
                        const pRatio = pImg.width / pImg.height;
                        let pWidth = cellSize;
                        let pHeight = cellSize;
                        if (pRatio > 1) {
                            pHeight = cellSize / pRatio;
                        } else {
                            pWidth = cellSize * pRatio;
                        }
                        const px = x_2 + (cellSize - pWidth) / 2;
                        const py = y_2 + (cellSize - pHeight) / 2;
                        ctx_1.drawImage(pImg, px, py, pWidth, pHeight);
                    } else {
                        ctx_1.fillRect(Math.floor(x_2), Math.floor(y_2), Math.ceil(cellSize), Math.ceil(cellSize));
                    }
                }
            }
            // Draw the 3 Finders High-Res
            drawFinder(0, 0);
            drawFinder(moduleCount - 7, 0);
            drawFinder(0, moduleCount - 7);
            // Draw Center Logo over the QR Code
            if (cImg && logoBounds) {
                // Thick protective border around logo for clean scanning
                ctx_1.fillStyle = bgColor;
                ctx_1.beginPath();
                if (logoBounds.isCircle) {
                    ctx_1.arc(logoBounds.cx, logoBounds.cy, logoBounds.radius, 0, Math.PI * 2);
                } else {
                    ctx_1.roundRect(logoBounds.xMin, logoBounds.yMin, logoBounds.xMax - logoBounds.xMin, logoBounds.yMax - logoBounds.yMin, size * 0.02);
                }
                ctx_1.fill();
                const lx_0 = logoBounds.xMin + margin * 0.6;
                const ly_0 = logoBounds.yMin + margin * 0.6;
                ctx_1.drawImage(cImg, lx_0, ly_0, logoBounds.cWidth, logoBounds.cHeight);
            }
            if (isDownload) {
                const dataUrl = canvas.toDataURL("image/png");
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = "assetnest-custom-qr.png";
                a.click();
            }
        }
    }["QRGeneratorPage.useCallback[renderQR]"], [
        url,
        fgColor,
        bgColor,
        patternType,
        emojiChar,
        patternLogo,
        centerLogo,
        cornerType,
        cornerEmojiChar,
        cornerLogo
    ]);
    // Re-render when dependencies change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "QRGeneratorPage.useEffect": ()=>{
            renderQR(false);
        }
    }["QRGeneratorPage.useEffect"], [
        renderQR
    ]);
    const handleCopyUrl = ()=>{
        navigator.clipboard.writeText(url);
    };
    const handlePatternLogoUpload = (e_2)=>{
        const file = e_2.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event)=>setPatternLogo(event.target?.result);
            reader.readAsDataURL(file);
        }
    };
    const handleCornerLogoUpload = (e_3)=>{
        const file_0 = e_3.target.files?.[0];
        if (file_0) {
            const reader_0 = new FileReader();
            reader_0.onload = (event_0)=>setCornerLogo(event_0.target?.result);
            reader_0.readAsDataURL(file_0);
        }
    };
    const handleCenterLogoUpload = (e_4)=>{
        const file_1 = e_4.target.files?.[0];
        if (file_1) {
            const reader_1 = new FileReader();
            reader_1.onload = (event_1)=>setCenterLogo(event_1.target?.result);
            reader_1.readAsDataURL(file_1);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "py-8 lg:py-24 min-h-screen bg-black",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Container$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "mb-8 lg:mb-16 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$qr$2d$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__QrCode$3e$__["QrCode"], {
                                    size: 12,
                                    className: "text-zinc-500"
                                }, void 0, false, {
                                    fileName: "[project]/app/tools/qr/page.tsx",
                                    lineNumber: 356,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500",
                                    children: "Pro Utilities"
                                }, void 0, false, {
                                    fileName: "[project]/app/tools/qr/page.tsx",
                                    lineNumber: 357,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/tools/qr/page.tsx",
                            lineNumber: 355,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 text-white leading-none",
                            children: [
                                "Custom ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "italic text-zinc-700",
                                    children: "QR Engine"
                                }, void 0, false, {
                                    fileName: "[project]/app/tools/qr/page.tsx",
                                    lineNumber: 360,
                                    columnNumber: 32
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/tools/qr/page.tsx",
                            lineNumber: 359,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-zinc-500 max-w-xl mx-auto font-medium leading-relaxed",
                            children: "The fully unrestricted QR generator. Build QRs out of stars, emojis, embedded brand patterns, and custom overlays."
                        }, void 0, false, {
                            fileName: "[project]/app/tools/qr/page.tsx",
                            lineNumber: 362,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/tools/qr/page.tsx",
                    lineNumber: 354,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-7 space-y-4 lg:space-y-6 order-2 lg:order-1 flex-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-5 lg:p-8 bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] shadow-2xl backdrop-blur-sm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 lg:mb-6 flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$wand$2d$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Wand2$3e$__["Wand2"], {
                                                    size: 12
                                                }, void 0, false, {
                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                    lineNumber: 372,
                                                    columnNumber: 33
                                                }, this),
                                                " Configuration Options"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/tools/qr/page.tsx",
                                            lineNumber: 371,
                                            columnNumber: 29
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-5 lg:space-y-8",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                            className: "block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3",
                                                            children: "Destination URL"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                            lineNumber: 378,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "relative",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "text",
                                                                    value: url,
                                                                    onChange: (e_5)=>setUrl(e_5.target.value),
                                                                    className: "w-full bg-black border border-zinc-800 focus:border-white transition-all px-5 py-3 lg:py-4 rounded-2xl text-sm font-medium outline-none text-zinc-200",
                                                                    placeholder: "Enter your link here..."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 380,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: handleCopyUrl,
                                                                    className: "absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-white transition-colors",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$copy$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Copy$3e$__["Copy"], {
                                                                        size: 16
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                        lineNumber: 382,
                                                                        columnNumber: 45
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 381,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                            lineNumber: 379,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                    lineNumber: 377,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-4 pt-3 lg:pt-4 border-t border-zinc-800",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `bg-zinc-900 border ${openSection === 'pattern' ? 'border-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>setOpenSection(openSection === 'pattern' ? '' : 'pattern'),
                                                                    className: "w-full flex items-center justify-between p-4 md:p-5 hover:bg-zinc-800/80 transition-all text-left group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center gap-4",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: `p-3 rounded-xl border ${openSection === 'pattern' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 group-hover:text-white'} transition-colors`,
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$qr$2d$code$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__QrCode$3e$__["QrCode"], {
                                                                                        size: 20
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 395,
                                                                                        columnNumber: 53
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 394,
                                                                                    columnNumber: 49
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                            className: "text-sm font-bold text-white mb-0.5",
                                                                                            children: "QR Code Pattern & Colors"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 398,
                                                                                            columnNumber: 53
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                            className: "text-[11px] font-medium text-zinc-500 hidden sm:block",
                                                                                            children: "Choose a pattern for your QR code and select colors."
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 399,
                                                                                            columnNumber: 53
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 397,
                                                                                    columnNumber: 49
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 393,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                            size: 18,
                                                                            className: `text-zinc-500 transition-transform duration-300 ${openSection === 'pattern' ? 'rotate-180' : ''}`
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 402,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 392,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: `px-4 md:px-5 overflow-hidden transition-all duration-500 ${openSection === 'pattern' ? 'max-h-[2000px] pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-6 pt-4 border-t border-zinc-800/50",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3",
                                                                                        children: "Pattern Style"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 408,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "grid grid-cols-3 sm:grid-cols-6 gap-3",
                                                                                        children: [
                                                                                            {
                                                                                                id: 'square',
                                                                                                label: 'Classic',
                                                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "w-4 h-4 bg-current"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 413,
                                                                                                    columnNumber: 35
                                                                                                }, this)
                                                                                            },
                                                                                            {
                                                                                                id: 'rounded',
                                                                                                label: 'Rounded',
                                                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "w-4 h-4 bg-current rounded-[4px]"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 417,
                                                                                                    columnNumber: 35
                                                                                                }, this)
                                                                                            },
                                                                                            {
                                                                                                id: 'dots',
                                                                                                label: 'Dots',
                                                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "w-4 h-4 bg-current rounded-full"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 421,
                                                                                                    columnNumber: 35
                                                                                                }, this)
                                                                                            },
                                                                                            {
                                                                                                id: 'star',
                                                                                                label: 'Stars',
                                                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$star$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Star$3e$__["Star"], {
                                                                                                    size: 16,
                                                                                                    fill: "currentColor"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 425,
                                                                                                    columnNumber: 35
                                                                                                }, this)
                                                                                            },
                                                                                            {
                                                                                                id: 'emoji',
                                                                                                label: 'Emoji',
                                                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$smile$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Smile$3e$__["Smile"], {
                                                                                                    size: 16
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 429,
                                                                                                    columnNumber: 35
                                                                                                }, this)
                                                                                            },
                                                                                            {
                                                                                                id: 'logo',
                                                                                                label: 'Logo',
                                                                                                icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"], {
                                                                                                    size: 16
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 433,
                                                                                                    columnNumber: 35
                                                                                                }, this)
                                                                                            }
                                                                                        ].map((opt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                onClick: ()=>setPatternType(opt.id),
                                                                                                className: `flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-[10px] font-bold ${patternType === opt.id ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white bg-black'}`,
                                                                                                children: [
                                                                                                    opt.icon,
                                                                                                    " ",
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                        className: patternType === opt.id ? 'text-black' : 'text-zinc-400',
                                                                                                        children: opt.label
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 435,
                                                                                                        columnNumber: 76
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, opt.id, true, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 434,
                                                                                                columnNumber: 41
                                                                                            }, this))
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 409,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    patternType === 'emoji' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-4 p-4 bg-black rounded-xl border border-zinc-800 flex items-center justify-between sm:justify-start gap-4",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "text-xs font-bold text-zinc-500 uppercase",
                                                                                                children: "Input Emoji:"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 441,
                                                                                                columnNumber: 61
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "text",
                                                                                                value: emojiChar,
                                                                                                onChange: (e_6)=>{
                                                                                                    const val = e_6.target.value;
                                                                                                    const chars = Array.from(val);
                                                                                                    if (chars.length > 0) {
                                                                                                        setEmojiChar(chars[chars.length - 1]);
                                                                                                    } else {
                                                                                                        setEmojiChar("");
                                                                                                    }
                                                                                                },
                                                                                                className: "bg-zinc-900 border border-zinc-700 w-16 md:w-24 text-center py-2 rounded-lg text-lg focus:border-white transition-all outline-none"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 442,
                                                                                                columnNumber: 61
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 440,
                                                                                        columnNumber: 81
                                                                                    }, this),
                                                                                    patternType === 'logo' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-4 p-4 bg-black rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-4",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "text-xs font-bold text-zinc-500 uppercase",
                                                                                                children: "Upload Dots Logo:"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 454,
                                                                                                columnNumber: 61
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                type: "file",
                                                                                                accept: "image/*",
                                                                                                className: "hidden",
                                                                                                ref: patternInputRef,
                                                                                                onChange: handlePatternLogoUpload
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 455,
                                                                                                columnNumber: 61
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "flex gap-2",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                        onClick: ()=>patternInputRef.current?.click(),
                                                                                                        className: "flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 px-4 rounded-lg text-xs font-bold transition-all border border-zinc-700",
                                                                                                        children: [
                                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                                                                                size: 14
                                                                                                            }, void 0, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 458,
                                                                                                                columnNumber: 69
                                                                                                            }, this),
                                                                                                            " Choose Image"
                                                                                                        ]
                                                                                                    }, void 0, true, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 457,
                                                                                                        columnNumber: 65
                                                                                                    }, this),
                                                                                                    patternLogo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                        onClick: ()=>{
                                                                                                            setPatternLogo(null);
                                                                                                            if (patternInputRef.current) patternInputRef.current.value = '';
                                                                                                        },
                                                                                                        className: "flex items-center justify-center w-8 h-8 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20",
                                                                                                        title: "Remove Logo",
                                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                                                            size: 14
                                                                                                        }, void 0, false, {
                                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                            lineNumber: 464,
                                                                                                            columnNumber: 73
                                                                                                        }, this)
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 460,
                                                                                                        columnNumber: 81
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 456,
                                                                                                columnNumber: 61
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 453,
                                                                                        columnNumber: 80
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                lineNumber: 407,
                                                                                columnNumber: 49
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "space-y-4 pt-3 lg:pt-4 border-t border-zinc-800/50",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                        className: "block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2",
                                                                                        children: "Color Palette"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 471,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 bg-black border border-zinc-800 p-4 lg:p-5 rounded-[1.5rem]",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "space-y-3 lg:space-y-4",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                        className: "text-[10px] font-bold text-zinc-500 uppercase tracking-widest block",
                                                                                                        children: "Foreground Filter"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 476,
                                                                                                        columnNumber: 61
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                        className: "flex flex-wrap gap-2",
                                                                                                        children: FG_PRESETS.map((color)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                                onClick: ()=>setFgColor(color),
                                                                                                                className: `w-6 h-6 rounded-full border-2 transition-all ${fgColor === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}`,
                                                                                                                style: {
                                                                                                                    backgroundColor: color
                                                                                                                },
                                                                                                                title: color
                                                                                                            }, color, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 478,
                                                                                                                columnNumber: 90
                                                                                                            }, this))
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 477,
                                                                                                        columnNumber: 61
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                        className: "flex items-center gap-3",
                                                                                                        children: [
                                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                                className: "relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-700 shadow-inner",
                                                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                                    type: "color",
                                                                                                                    value: fgColor,
                                                                                                                    onChange: (e_7)=>setFgColor(e_7.target.value),
                                                                                                                    className: "absolute -inset-4 w-16 h-16 cursor-pointer"
                                                                                                                }, void 0, false, {
                                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                    lineNumber: 484,
                                                                                                                    columnNumber: 69
                                                                                                                }, this)
                                                                                                            }, void 0, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 483,
                                                                                                                columnNumber: 65
                                                                                                            }, this),
                                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                                type: "text",
                                                                                                                value: fgColor.toUpperCase(),
                                                                                                                onChange: (e_8)=>setFgColor(e_8.target.value),
                                                                                                                className: "bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono text-zinc-300 w-24 focus:border-white transition-all outline-none"
                                                                                                            }, void 0, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 486,
                                                                                                                columnNumber: 65
                                                                                                            }, this)
                                                                                                        ]
                                                                                                    }, void 0, true, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 482,
                                                                                                        columnNumber: 61
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 475,
                                                                                                columnNumber: 57
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "space-y-3 lg:space-y-4 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                        className: "text-[10px] font-bold text-zinc-500 uppercase tracking-widest block",
                                                                                                        children: "Background"
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 492,
                                                                                                        columnNumber: 61
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                        className: "flex flex-wrap gap-2",
                                                                                                        children: BG_PRESETS.map((color_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                                onClick: ()=>setBgColor(color_0),
                                                                                                                className: `w-6 h-6 rounded-full border-2 transition-all ${bgColor === color_0 ? 'border-zinc-400 scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-zinc-200 hover:scale-105 shadow-sm'}`,
                                                                                                                style: {
                                                                                                                    backgroundColor: color_0
                                                                                                                },
                                                                                                                title: color_0
                                                                                                            }, color_0, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 494,
                                                                                                                columnNumber: 92
                                                                                                            }, this))
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 493,
                                                                                                        columnNumber: 61
                                                                                                    }, this),
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                        className: "flex items-center gap-3",
                                                                                                        children: [
                                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                                className: "relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-700 shadow-inner",
                                                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                                    type: "color",
                                                                                                                    value: bgColor,
                                                                                                                    onChange: (e_9)=>setBgColor(e_9.target.value),
                                                                                                                    className: "absolute -inset-4 w-16 h-16 cursor-pointer"
                                                                                                                }, void 0, false, {
                                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                    lineNumber: 500,
                                                                                                                    columnNumber: 69
                                                                                                                }, this)
                                                                                                            }, void 0, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 499,
                                                                                                                columnNumber: 65
                                                                                                            }, this),
                                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                                                type: "text",
                                                                                                                value: bgColor.toUpperCase(),
                                                                                                                onChange: (e_10)=>setBgColor(e_10.target.value),
                                                                                                                className: "bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-mono text-zinc-300 w-24 focus:border-white transition-all outline-none"
                                                                                                            }, void 0, false, {
                                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                                lineNumber: 502,
                                                                                                                columnNumber: 65
                                                                                                            }, this)
                                                                                                        ]
                                                                                                    }, void 0, true, {
                                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                        lineNumber: 498,
                                                                                                        columnNumber: 61
                                                                                                    }, this)
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 491,
                                                                                                columnNumber: 57
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 473,
                                                                                        columnNumber: 53
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                lineNumber: 470,
                                                                                columnNumber: 49
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                        lineNumber: 406,
                                                                        columnNumber: 45
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 405,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                            lineNumber: 391,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `bg-zinc-900 border ${openSection === 'corners' ? 'border-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>setOpenSection(openSection === 'corners' ? '' : 'corners'),
                                                                    className: "w-full flex items-center justify-between p-4 md:p-5 hover:bg-zinc-800/80 transition-all text-left group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center gap-4",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: `p-3 rounded-xl border ${openSection === 'corners' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 group-hover:text-white'} transition-colors`,
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$maximize$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Maximize$3e$__["Maximize"], {
                                                                                        size: 20
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 516,
                                                                                        columnNumber: 53
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 515,
                                                                                    columnNumber: 49
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                            className: "text-sm font-bold text-white mb-0.5",
                                                                                            children: "QR Code Corners"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 519,
                                                                                            columnNumber: 53
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                            className: "text-[11px] font-medium text-zinc-500 hidden sm:block",
                                                                                            children: "Select your QR code's corner frame style"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 520,
                                                                                            columnNumber: 53
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 518,
                                                                                    columnNumber: 49
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 514,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                            size: 18,
                                                                            className: `text-zinc-500 transition-transform duration-300 ${openSection === 'corners' ? 'rotate-180' : ''}`
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 523,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 513,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: `px-4 md:px-5 overflow-hidden transition-all duration-500 ${openSection === 'corners' ? 'max-h-[1000px] pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-6 pt-4 border-t border-zinc-800/50",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                    className: "block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3",
                                                                                    children: "Frame Style"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 529,
                                                                                    columnNumber: 53
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
                                                                                    children: [
                                                                                        {
                                                                                            id: 'square',
                                                                                            label: 'Classic',
                                                                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                                                                                                size: 16
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 534,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        },
                                                                                        {
                                                                                            id: 'rounded',
                                                                                            label: 'Rounded',
                                                                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                                                                                                size: 16,
                                                                                                rx: 4
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 538,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        },
                                                                                        {
                                                                                            id: 'dots',
                                                                                            label: 'Circular',
                                                                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "w-4 h-4 border-2 border-current rounded-full"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 542,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        },
                                                                                        {
                                                                                            id: 'heart',
                                                                                            label: 'Heart',
                                                                                            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "text-[14px]",
                                                                                                children: "♥"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 546,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        }
                                                                                    ].map((opt_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                            onClick: ()=>setCornerType(opt_0.id),
                                                                                            className: `flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-[10px] font-bold ${cornerType === opt_0.id ? 'bg-white text-black border-white shadow-lg shadow-white/10' : 'border-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-white bg-black'}`,
                                                                                            children: [
                                                                                                opt_0.icon,
                                                                                                " ",
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                    className: cornerType === opt_0.id ? 'text-black' : 'text-zinc-400',
                                                                                                    children: opt_0.label
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                    lineNumber: 548,
                                                                                                    columnNumber: 78
                                                                                                }, this)
                                                                                            ]
                                                                                        }, opt_0.id, true, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 547,
                                                                                            columnNumber: 43
                                                                                        }, this))
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 530,
                                                                                    columnNumber: 53
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 528,
                                                                            columnNumber: 49
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                        lineNumber: 527,
                                                                        columnNumber: 45
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 526,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                            lineNumber: 512,
                                                            columnNumber: 37
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `bg-zinc-900 border ${openSection === 'logo' ? 'border-zinc-700' : 'border-zinc-800'} rounded-[1.5rem] overflow-hidden transition-all duration-300`,
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    onClick: ()=>setOpenSection(openSection === 'logo' ? '' : 'logo'),
                                                                    className: "w-full flex items-center justify-between p-4 md:p-5 hover:bg-zinc-800/80 transition-all text-left group",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "flex items-center gap-4",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: `p-3 rounded-xl border ${openSection === 'logo' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-400 group-hover:text-white'} transition-colors`,
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {
                                                                                        size: 20
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 561,
                                                                                        columnNumber: 53
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 560,
                                                                                    columnNumber: 49
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                                                            className: "text-sm font-bold text-white mb-0.5",
                                                                                            children: "Add Logo"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 564,
                                                                                            columnNumber: 53
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                            className: "text-[11px] font-medium text-zinc-500 hidden sm:block",
                                                                                            children: "Make your QR code unique by adding your logo or image"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 565,
                                                                                            columnNumber: 53
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                                    lineNumber: 563,
                                                                                    columnNumber: 49
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 559,
                                                                            columnNumber: 45
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                                                            size: 18,
                                                                            className: `text-zinc-500 transition-transform duration-300 ${openSection === 'logo' ? 'rotate-180' : ''}`
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                            lineNumber: 568,
                                                                            columnNumber: 45
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 558,
                                                                    columnNumber: 41
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: `px-4 md:px-5 overflow-hidden transition-all duration-500 ${openSection === 'logo' ? 'max-h-[500px] pb-5 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`,
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "space-y-4 pt-4 border-t border-zinc-800/50",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                                className: "block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1",
                                                                                children: "Center Overlay Branding"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                lineNumber: 573,
                                                                                columnNumber: 49
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "flex items-center gap-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                                        type: "file",
                                                                                        accept: "image/*",
                                                                                        className: "hidden",
                                                                                        ref: centerInputRef,
                                                                                        onChange: handleCenterLogoUpload
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 576,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        onClick: ()=>centerInputRef.current?.click(),
                                                                                        className: "flex-1 flex items-center justify-center gap-2 bg-black border border-zinc-800 hover:border-zinc-500 text-zinc-300 py-3 lg:py-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$upload$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Upload$3e$__["Upload"], {
                                                                                                size: 16
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                                lineNumber: 578,
                                                                                                columnNumber: 57
                                                                                            }, this),
                                                                                            " Upload Main Logo"
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 577,
                                                                                        columnNumber: 53
                                                                                    }, this),
                                                                                    centerLogo && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                        onClick: ()=>{
                                                                                            setCenterLogo(null);
                                                                                            if (centerInputRef.current) centerInputRef.current.value = '';
                                                                                        },
                                                                                        className: "p-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20",
                                                                                        title: "Remove Main Logo",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                                                            size: 16
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                                                            lineNumber: 585,
                                                                                            columnNumber: 61
                                                                                        }, this)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                                        lineNumber: 581,
                                                                                        columnNumber: 68
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                                lineNumber: 575,
                                                                                columnNumber: 49
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                                        lineNumber: 572,
                                                                        columnNumber: 45
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                                    lineNumber: 571,
                                                                    columnNumber: 41
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/app/tools/qr/page.tsx",
                                                            lineNumber: 557,
                                                            columnNumber: 37
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                    lineNumber: 388,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/tools/qr/page.tsx",
                                            lineNumber: 375,
                                            columnNumber: 29
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/tools/qr/page.tsx",
                                    lineNumber: 370,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-6 border border-zinc-900 rounded-3xl bg-zinc-900/30",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start gap-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "p-3 bg-zinc-900 rounded-2xl shrink-0",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                                                    size: 16,
                                                    className: "text-zinc-500"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                    lineNumber: 599,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                lineNumber: 598,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                        className: "text-xs font-bold text-white mb-2 uppercase tracking-wide",
                                                        children: "Scannability Warning"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                        lineNumber: 602,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-xs text-zinc-500 leading-relaxed font-medium",
                                                        children: "Using custom emojis, heavy star patterns, or detailed custom logos as the actual QR code dots may trigger scanner failures on older devices. Ensure there is strong contrast. The three corner square Finders are automatically protected for stability."
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                        lineNumber: 603,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                lineNumber: 601,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/tools/qr/page.tsx",
                                        lineNumber: 597,
                                        columnNumber: 29
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/tools/qr/page.tsx",
                                    lineNumber: 596,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/tools/qr/page.tsx",
                            lineNumber: 369,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "lg:col-span-5 flex flex-col items-center justify-start pointer-events-none lg:pointer-events-auto lg:pt-4 order-1 lg:order-2 sticky top-[80px] lg:top-24 z-40 self-start w-full",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "relative group w-full pointer-events-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "hidden lg:block absolute inset-0 bg-white/5 blur-[80px] rounded-[3rem] lg:rounded-[4rem] group-hover:bg-white/10 transition-all duration-700"
                                    }, void 0, false, {
                                        fileName: "[project]/app/tools/qr/page.tsx",
                                        lineNumber: 614,
                                        columnNumber: 29
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative flex flex-row lg:flex-col items-center gap-4 lg:gap-0 p-3 sm:p-4 lg:p-10 bg-zinc-950/90 lg:bg-zinc-900 border border-zinc-700/50 lg:border-zinc-800 rounded-[1.5rem] lg:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] lg:shadow-[0_40px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:backdrop-blur-none",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-center bg-white p-2 lg:p-4 rounded-[1rem] lg:rounded-[1.5rem] overflow-hidden shadow-inner shrink-0 w-[90px] h-[90px] lg:w-full lg:h-auto",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                                    ref: canvasRef,
                                                    className: "w-full max-w-full h-auto rounded-md lg:rounded-lg"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/tools/qr/page.tsx",
                                                    lineNumber: 619,
                                                    columnNumber: 37
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                lineNumber: 618,
                                                columnNumber: 33
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 lg:w-full lg:mt-10 flex flex-col justify-center",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "lg:hidden text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2",
                                                        children: "Live Preview"
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                        lineNumber: 623,
                                                        columnNumber: 37
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>renderQR(true),
                                                        className: "w-full flex items-center justify-center gap-2 lg:gap-3 bg-white text-black py-2.5 lg:py-4 rounded-lg lg:rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$download$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Download$3e$__["Download"], {
                                                                size: 14,
                                                                className: "shrink-0"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                lineNumber: 625,
                                                                columnNumber: 41
                                                            }, this),
                                                            " ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "hidden sm:inline",
                                                                children: "Export PNG"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                lineNumber: 625,
                                                                columnNumber: 85
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "sm:hidden",
                                                                children: "Export"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                                lineNumber: 625,
                                                                columnNumber: 137
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/tools/qr/page.tsx",
                                                        lineNumber: 624,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/tools/qr/page.tsx",
                                                lineNumber: 622,
                                                columnNumber: 33
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/tools/qr/page.tsx",
                                        lineNumber: 616,
                                        columnNumber: 29
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/tools/qr/page.tsx",
                                lineNumber: 613,
                                columnNumber: 25
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/tools/qr/page.tsx",
                            lineNumber: 612,
                            columnNumber: 21
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/tools/qr/page.tsx",
                    lineNumber: 367,
                    columnNumber: 17
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/tools/qr/page.tsx",
            lineNumber: 353,
            columnNumber: 13
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/tools/qr/page.tsx",
        lineNumber: 352,
        columnNumber: 10
    }, this);
}
_s(QRGeneratorPage, "/DYzmzfTCTSzBErz1j/rRYoQx7U=");
_c = QRGeneratorPage;
var _c;
__turbopack_context__.k.register(_c, "QRGeneratorPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_a92507d9._.js.map