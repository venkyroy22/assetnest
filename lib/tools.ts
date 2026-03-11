import { FileImage, QrCode, Timer, Receipt, RefreshCw, Keyboard, Grid3X3, Crop, Eraser, Sparkles } from "lucide-react";

export type ToolCategory = "Images" | "Generate" | "Productivity" | "Business";

export interface Tool {
    id: string;
    name: string;
    description: string;
    href: string;
    badge: "Free";
    icon: any; // Lucide icon
    tags: string[];
    accent: string;
    category: ToolCategory;
}

export const ALL_TOOLS: Tool[] = [
    {
        id: "image-compressor",
        name: "Image Compressor",
        description: "Compress JPEG, PNG & WebP images instantly in your browser. 100% private, no uploads needed.",
        href: "/tools/image-compressor",
        badge: "Free",
        icon: FileImage,
        tags: ["image", "compress", "jpeg", "png", "webp", "optimize", "resize"],
        accent: "#10b981",   // emerald
        category: "Images",
    },
    {
        id: "bg-remover",
        name: "Background Remover",
        description: "Remove backgrounds from your images instantly and for free. 100% private, processing happens in your browser.",
        href: "/tools/bg-remover",
        badge: "Free",
        icon: Eraser,
        tags: ["image", "background", "remover", "bg", "ai", "remove", "transparent", "creator"],
        accent: "#a855f7",   // purple
        category: "Images",
    },
    {
        id: "qr",
        name: "QR Code Generator",
        description: "Generate beautiful, customizable QR codes instantly. Download as PNG or SVG for free.",
        href: "/tools/qr",
        badge: "Free",
        icon: QrCode,
        tags: ["qr", "qrcode", "barcode", "link", "generate", "scan"],
        accent: "#6366f1",   // indigo
        category: "Generate",
    },
    {
        id: "pomodoro",
        name: "Pomodoro Timer",
        description: "Boost your productivity with an animated focus timer, session tracking, and achievement system.",
        href: "/tools/pomodoro",
        badge: "Free",
        icon: Timer,
        tags: ["pomodoro", "timer", "focus", "productivity", "study", "work", "deep work", "break"],
        accent: "#f43f5e",   // rose
        category: "Productivity",
    },
    {
        id: "typing-tester",
        name: "Typing Speed Tester",
        description: "Test and improve your typing speed and accuracy with real-time feedback and detailed stats.",
        href: "/tools/typing-tester",
        badge: "Free",
        icon: Keyboard,
        tags: ["typing", "speed", "test", "tester", "wpm", "accuracy", "practice", "keyboard", "monkeytype", "typist"],
        accent: "#0ea5e9",   // sky
        category: "Productivity",
    },
    {
        id: "billing",
        name: "Smart Billing Tool",
        description: "Paperless billing for small merchants. Scan barcodes, add items, generate a customer QR receipt — no printing needed.",
        href: "/tools/billing",
        badge: "Free",
        icon: Receipt,
        tags: ["billing", "invoice", "gst", "receipt", "barcode", "qr", "merchant", "shop", "india", "retail", "pos"],
        accent: "#f59e0b",   // amber
        category: "Business",
    },
    {
        id: "image-converter",
        name: "Image Converter",
        description: "Convert JPG to PNG, PNG to WebP, or JPG to WebP instantly in your browser. Batch support, quality control, 100% private.",
        href: "/tools/image-converter",
        badge: "Free",
        icon: RefreshCw,
        tags: ["image", "convert", "jpg", "jpeg", "png", "webp", "format", "converter", "batch"],
        accent: "#8b5cf6",   // violet
        category: "Images",
    },
    {
        id: "ig-grid",
        name: "Instagram Grid Planner",
        description: "Plan your Instagram feed visually. Upload photos, drag and drop to rearrange, and see how your profile will look.",
        href: "/tools/ig-grid",
        badge: "Free",
        icon: Grid3X3,
        tags: ["instagram", "grid", "planner", "feed", "social", "media", "preview", "drag", "drop", "layout"],
        accent: "#ec4899",   // pink
        category: "Images",
    },
    {
        id: "image-cropper",
        name: "Advanced Image Cropper",
        description: "Crop images with precision. Set specific aspect ratios, custom dimensions, and download high quality results.",
        href: "/tools/image-cropper",
        badge: "Free",
        icon: Crop,
        tags: ["image", "crop", "cropper", "resize", "aspect", "ratio", "dimensions"],
        accent: "#3b82f6",   // blue
        category: "Images",
    },
];
