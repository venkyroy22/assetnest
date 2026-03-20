import { FileImage, QrCode, Timer, Receipt, RefreshCw, Keyboard, Grid3X3, Crop, Eraser, Sparkles, FileText, Combine, Split, Minimize2, ImagePlus, NotebookPen, FileEdit, Hash, Table, WholeWord, Gamepad2, Calculator, PenTool, CreditCard } from "lucide-react";

export type ToolCategory = "Images" | "Generate" | "Productivity" | "Business" | "PDF" | "Games";

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
        accent: "#e4e4e7",   // emerald
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
        id: "e-signature",
        name: "E-Signature Creator",
        description: "Draw your signature smoothly online using your mouse or touch screen. Download instantly as a transparent PNG or SVG.",
        href: "/tools/e-signature",
        badge: "Free",
        icon: PenTool,
        tags: ["signature", "esign", "sign", "digital signature", "draw", "transparent", "png", "svg"],
        accent: "#e4e4e7",
        category: "Generate",
    },
    {
        id: "pomodoro",
        name: "Pomodoro Timer",
        description: "Boost your productivity with an animated focus timer, session tracking, and achievement system.",
        href: "/tools/pomodoro",
        badge: "Free",
        icon: Timer,
        tags: ["pomodoro", "timer", "focus", "productivity", "study", "work", "deep work", "break", "water reminder", "hydration", "drink water"],
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
        id: "business-card",
        name: "Business Card Maker",
        description: "Design professional business cards online in minutes. Add your details, adjust colors, and export high-res PNGs.",
        href: "/tools/business-card",
        badge: "Free",
        icon: CreditCard,
        tags: ["business card", "maker", "generator", "design", "corporate", "card", "branding"],
        accent: "#6366f1",
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
    {
        id: "image-to-text",
        name: "Image to Text",
        description: "Extract text from images using high-precision OCR. Convert screenshots, photos, and scanned documents into editable text instantly.",
        href: "/tools/image-to-text",
        badge: "Free",
        icon: FileText,
        tags: ["image", "ocr", "text", "extract", "scanner", "image to text", "photo to text"],
        accent: "#f59e0b",   // amber
        category: "Images",
    },
    {
        id: "pdf-merger",
        name: "PDF Merger",
        description: "Merge and combine multiple PDF files into one document instantly. Upload PDFs, rearrange pages, and export — 100% private, runs in your browser.",
        href: "/tools/pdf-merger",
        badge: "Free",
        icon: Combine,
        tags: [
            "pdf", "merge", "combine", "join", "pdf merger", "merge pdfs",
            "combine pdfs", "join pdf", "merge pdf files", "pdf joiner",
            "merge pdf online", "combine pdf files", "document", "merge documents"
        ],
        accent: "#ef4444",
        category: "PDF",
    },
    {
        id: "pdf-compressor",
        name: "PDF Compressor",
        description: "Compress and reduce PDF file size instantly in your browser. Make your PDF smaller for email, sharing, or uploading — no uploads, 100% private.",
        href: "/tools/pdf-compressor",
        badge: "Free",
        icon: Minimize2,
        tags: [
            "pdf", "compress", "reduce", "size", "optimize", "shrink",
            "compress pdf", "reduce pdf size", "pdf compressor", "make pdf smaller",
            "pdf file size", "shrink pdf", "pdf optimizer", "smaller pdf",
            "compress pdf online", "pdf size reducer"
        ],
        accent: "#f97316",
        category: "PDF",
    },
    {
        id: "pdf-splitter",
        name: "PDF Splitter",
        description: "Split a PDF into individual pages or extract specific page ranges. Visually select the pages you need and download them as a new PDF — free and private.",
        href: "/tools/pdf-splitter",
        badge: "Free",
        icon: Split,
        tags: [
            "pdf", "split", "extract", "pages", "separate", "cut",
            "split pdf", "pdf splitter", "extract pages", "pdf page extractor",
            "split pdf into pages", "separate pdf pages", "remove pages from pdf",
            "pdf cutter", "pdf page selector", "extract pdf pages"
        ],
        accent: "#8b5cf6",
        category: "PDF",
    },
    {
        id: "pdf-text-extractor",
        name: "PDF Text Extractor",
        description: "Instantly extract paragraphs and raw text from any PDF into an editable Word Document (DOCX). Perfect for essays and text files. Processed locally for 100% privacy.",
        href: "/tools/pdf-text-extractor",
        badge: "Free",
        icon: FileText,
        tags: [
            "pdf", "word", "docx", "convert", "extract", "text",
            "pdf to word", "pdf to docx", "convert pdf", "pdf to document",
            "free pdf text extractor", "pdf converter", "pdf text extractor"
        ],
        accent: "#3b82f6", // blue
        category: "PDF",
    },
    {
        id: "notes",
        name: "Smart Notes",
        description: "A beautiful, versatile workspace for capturing thoughts, drafting articles, and organizing your notes securely in your browser.",
        href: "/tools/notes",
        badge: "Free",
        icon: NotebookPen,
        tags: ["notes", "workspace", "editor", "markdown", "write", "draft", "document", "text"],
        accent: "#f43f5e",   // rose
        category: "Productivity",
    },
    {
        id: "image-to-pdf",
        name: "Image to PDF",
        description: "Convert JPG, PNG, and WebP images into a single PDF instantly. Drag to reorder, set page size, margin and quality — 100% private, in your browser.",
        href: "/tools/image-to-pdf",
        badge: "Free",
        icon: ImagePlus,
        tags: [
            "image", "jpg", "png", "webp", "gif", "photo", "picture",
            "image to pdf", "jpg to pdf", "png to pdf", "photos to pdf",
            "convert image to pdf", "picture to pdf", "convert jpg to pdf",
            "images to pdf", "photo to pdf", "webp to pdf", "pdf from images"
        ],
        accent: "#e4e4e7",
        category: "PDF",
    },
    {
        id: "game-2048",
        name: "2048 Game",
        description: "The classic sliding tile puzzle. Swipe to merge numbers and reach the 2048 tile in this addictive, brain-teasing game.",
        href: "/tools/2048",
        badge: "Free",
        icon: Hash,
        tags: ["game", "puzzle", "2048", "logic", "sliding", "numbers", "brain", "fun"],
        accent: "#f59e0b",
        category: "Games",
    },
    {
        id: "game-sudoku",
        name: "Sudoku Pro",
        description: "Sharpen your mind with daily Sudoku. Multiple difficulty levels, clean interface, and real-time error checking.",
        href: "/tools/sudoku",
        badge: "Free",
        icon: Table,
        tags: ["game", "sudoku", "logic", "puzzle", "numbers", "brain", "intelligence"],
        accent: "#6366f1",
        category: "Games",
    },
    {
        id: "game-wordle",
        name: "Wordle Clone",
        description: "Guess the hidden 5-letter word in 6 tries. A daily viral word game to challenge your vocabulary.",
        href: "/tools/wordle",
        badge: "Free",
        icon: WholeWord,
        tags: ["game", "wordle", "word", "puzzle", "vocabulary", "daily", "guess"],
        accent: "#e4e4e7",
        category: "Games",
    },
    {
        id: "game-dino",
        name: "Dino Run",
        description: "An infinite runner adventure. Jump over obstacles, survive as long as possible, and set new high scores.",
        href: "/tools/dino",
        badge: "Free",
        icon: Gamepad2,
        tags: ["game", "dino", "runner", "infinite", "arcade", "avoid", "jump", "pixel"],
        accent: "#3b82f6",
        category: "Games",
    },
    {
        id: "game-math",
        name: "Quick Math",
        description: "Test your mental arithmetic speed. Solve as many math problems as possible in 60 seconds and climb the ranks.",
        href: "/tools/math",
        badge: "Free",
        icon: Calculator,
        tags: ["game", "math", "arithmetic", "speed", "test", "brain", "training", "logic"],
        accent: "#ef4444",
        category: "Games",
    },
];
