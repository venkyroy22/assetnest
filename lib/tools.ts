import { FileImage, QrCode, Timer, Receipt, RefreshCw } from "lucide-react";

export interface Tool {
    id: string;
    name: string;
    description: string;
    href: string;
    badge: "Free";
    icon: any; // Lucide icon
    tags: string[];
    accent: string;
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
    },
];
