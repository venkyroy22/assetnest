export type GuidePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  icon: string;
  tags: string[];
  toolLink?: { label: string; href: string };
};

export const ALL_GUIDE_POSTS: GuidePost[] = [
  {
    slug: "how-to-compress-images-without-losing-quality",
    title: "How to Compress Images Without Losing Quality (Complete 2026 Guide)",
    description:
      "Heavy images slow down your website and hurt your SEO ranking. Learn the exact techniques professionals use to reduce image file size by up to 80% — without any visible quality loss.",
    category: "Image Optimization",
    readTime: "6 min read",
    publishedAt: "2026-03-02",
    icon: "Image",
    tags: ["image compression", "web performance", "SEO", "file size"],
    toolLink: { label: "Try Our Free Image Compressor", href: "/tools/image-compressor" },
  },
  {
    slug: "best-ai-image-prompts-2026",
    title: "Top Professional AI Image Prompts for Creators in 2026",
    description:
      "Unlock breathtaking AI-generated art with these hand-crafted prompts for cinematic landscapes, portraits, product photography, and abstract art. Curated by the AssetNest team.",
    category: "AI & Prompts",
    readTime: "9 min read",
    publishedAt: "2026-03-03",
    icon: "Sparkles",
    tags: ["AI prompts", "image generation", "creative"],
    toolLink: { label: "Browse All AI Prompts", href: "/prompts" },
  },
  {
    slug: "how-to-merge-pdf-files-free",
    title: "How to Merge PDF Files for Free — No Software, No Sign-Up",
    description:
      "Whether you're combining contracts, reports, or presentations, merging PDFs doesn't require expensive software. Here's how to do it in seconds, 100% free, right in your browser.",
    category: "PDF Tools",
    readTime: "5 min read",
    publishedAt: "2026-03-04",
    icon: "FileText",
    tags: ["PDF merge", "combine PDF", "free PDF tools", "productivity"],
    toolLink: { label: "Merge PDFs Instantly — Free", href: "/tools/pdf-merger" },
  },
  {
    slug: "qr-codes-for-business-complete-guide",
    title: "QR Codes for Business: The Complete 2026 Guide",
    description:
      "From restaurant menus to product packaging — QR codes are everywhere. Learn how to create, customize, and track QR codes that actually drive results for your business.",
    category: "Business & Marketing",
    readTime: "8 min read",
    publishedAt: "2026-03-05",
    icon: "QrCode",
    tags: ["QR code", "business marketing", "digital tools", "customer engagement"],
    toolLink: { label: "Generate a Free Custom QR Code", href: "/tools/qr" },
  },
  {
    slug: "how-to-remove-background-from-image-free",
    title: "How to Remove Background from Any Image (Free & Instant)",
    description:
      "Professional background removal used to cost money and time. Now it takes seconds. Learn how to remove photo backgrounds for product listings, social media, and design projects — for free.",
    category: "Image Editing",
    readTime: "5 min read",
    publishedAt: "2026-03-06",
    icon: "Scissors",
    tags: ["background remover", "photo editing", "product photography", "design"],
    toolLink: { label: "Remove Background Free", href: "/tools/bg-remover" },
  },
  {
    slug: "pomodoro-technique-boost-productivity",
    title: "The Pomodoro Technique: How 25 Minutes Can Transform Your Productivity",
    description:
      "Procrastination meets its match with the Pomodoro Technique. Discover why this simple time-management method is used by students, developers, and executives worldwide — and how to start today.",
    category: "Productivity",
    readTime: "7 min read",
    publishedAt: "2026-03-07",
    icon: "Timer",
    tags: ["Pomodoro", "productivity", "focus", "time management", "work habits"],
    toolLink: { label: "Use Our Free Pomodoro Timer", href: "/tools/pomodoro" },
  },
  {
    slug: "how-to-sign-pdf-free",
    title: "How to Electronically Sign a PDF for Free (Without Printing)",
    description:
      "Tired of printing out contracts just to sign them and scan them back? Learn how to securely apply digital signatures to any PDF directly in your browser.",
    category: "PDF Tools",
    readTime: "4 min read",
    publishedAt: "2026-03-08",
    icon: "PenTool",
    tags: ["pdf", "signature", "electronic signature", "document signing", "paperless"],
    toolLink: { label: "Sign Your PDF Now", href: "/tools/pdf-signer" },
  },
  {
    slug: "why-convert-images-to-webp",
    title: "Why You Should Convert Images to WebP in 2026",
    description:
      "WebP is significantly faster and lighter than JPEG or PNG. Learn why major platforms switched to it, and how to bulk convert your images instantly for free.",
    category: "Image Optimization",
    readTime: "5 min read",
    publishedAt: "2026-03-09",
    icon: "RefreshCw",
    tags: ["image formats", "webp", "conversion", "web optimization", "performance"],
    toolLink: { label: "Launch Image Converter", href: "/tools/image-converter" },
  },
  {
    slug: "how-to-extract-text-from-pdf",
    title: "How to Extract Editable Text from Scanned PDFs",
    description:
      "Stop re-typing entire documents. Discover how to instantly extract raw paragraphs and editable text from any PDF file without manual transcription.",
    category: "Productivity",
    readTime: "3 min read",
    publishedAt: "2026-03-10",
    icon: "FileText",
    tags: ["pdf", "text extraction", "productivity", "document editing", "paperless"],
    toolLink: { label: "Extract Text Now", href: "/tools/pdf-text-extractor" },
  },
  {
    slug: "mastering-modern-ui-css-gradients",
    title: "Mastering Modern UI: Exploring Beautiful CSS Gradients",
    description:
      "A great background gradient can instantly elevate a website from boring to premium. Learn the basics of mixing pure CSS gradients for your next design project.",
    category: "Web Design",
    readTime: "6 min read",
    publishedAt: "2026-03-11",
    icon: "Palette",
    tags: ["css", "ui design", "web development", "gradients", "front-end"],
    toolLink: { label: "Open CSS Gradient Maker", href: "/tools/css-gradient" },
  },
  {
    slug: "how-to-manage-projects-kanban-board",
    title: "How to Manage Solo Projects with a Minimalist Kanban Board",
    description: "Stop overcomplicating your workflow. Learn why switching to a blazing-fast, private, purely drag-and-drop Kanban board is all you need to actually get things done.",
    category: "Productivity", readTime: "4 min read", publishedAt: "2026-03-12", icon: "KanbanSquare",
    tags: ["kanban", "productivity", "management", "workflow", "local-first"],
    toolLink: { label: "Launch Kanban Board", href: "/tools/kanban" },
  },
  {
    slug: "design-with-svg-patterns",
    title: "How to Design with Seamless SVG Patterns",
    description: "Generate beautiful, lightweight geometric backgrounds using pure math. Stop relying on heavy raster images for your web design.",
    category: "Web Design", readTime: "3 min read", publishedAt: "2026-03-13", icon: "Shapes",
    tags: ["svg", "patterns", "design", "css"],
    toolLink: { label: "Create SVG Patterns", href: "/tools/svg-patterns" }
  },
  {
    slug: "modern-react-icon-libraries",
    title: "Why Minimalist Icons Elevate Your UI Design",
    description: "Discover how using consistent, lightweight SVG icons can make your application look instantly more professional and load dramatically faster.",
    category: "Web Design", readTime: "4 min read", publishedAt: "2026-03-14", icon: "Images",
    tags: ["icons", "svg", "ui design"],
    toolLink: { label: "Browse Pure Icons", href: "/tools/icons" }
  },
  {
    slug: "how-to-draw-e-signature-online",
    title: "How to Draw a Clean Transparent E-Signature",
    description: "Tired of dealing with white backgrounds on your digital signature? Learn how to draw a perfectly smooth, transparent signature for your documents.",
    category: "Productivity", readTime: "2 min read", publishedAt: "2026-03-15", icon: "PenTool",
    tags: ["signature", "esign", "transparent img"],
    toolLink: { label: "Draw E-Signature", href: "/tools/e-signature" }
  },
  {
    slug: "improve-typing-speed",
    title: "The Mechanics of Hitting 100 WPM",
    description: "Stop hunting and pecking. Understand the exact finger positioning and muscle memory exercises required to double your typing speed this month.",
    category: "Productivity", readTime: "5 min read", publishedAt: "2026-03-16", icon: "Keyboard",
    tags: ["typing", "wpm", "productivity"],
    toolLink: { label: "Test Your Typing Speed", href: "/tools/typing-tester" }
  },
  {
    slug: "paperless-billing-small-merchants",
    title: "How Small Merchants Can Go 100% Paperless",
    description: "Printers are expensive and bad for the environment. Discover how a smartphone and a local barcode scanner can handle your entire retail billing flow.",
    category: "Business", readTime: "4 min read", publishedAt: "2026-03-17", icon: "Receipt",
    tags: ["billing", "retail", "business", "invoicing"],
    toolLink: { label: "Launch Smart Billing", href: "/tools/billing" }
  },
  {
    slug: "design-professional-business-cards",
    title: "Design a Corporate Business Card in Minutes",
    description: "You don't need a degree in Graphic Design or an expensive Photoshop subscription. Learn the elements of a high-converting, minimalist business card.",
    category: "Business", readTime: "3 min read", publishedAt: "2026-03-18", icon: "CreditCard",
    tags: ["business card", "branding", "networking"],
    toolLink: { label: "Make a Business Card", href: "/tools/business-card" }
  },
  {
    slug: "plan-instagram-grid-layout",
    title: "How to Visually Plan a Stunning Social Layout",
    description: "Your grid is your aesthetic resume. Learn how to drag, drop, and pre-visualize your content to maintain a consistent brand palette.",
    category: "Social Media", readTime: "5 min read", publishedAt: "2026-03-19", icon: "Grid3X3",
    tags: ["instagram", "marketing", "social media"],
    toolLink: { label: "Plan Your Grid", href: "/tools/ig-grid" }
  },
  {
    slug: "perfect-aspect-ratios-images",
    title: "The Ultimate Guide to Perfect Aspect Ratios",
    description: "Stop dealing with auto-cropping algorithms cutting off heads. Learn how to perfectly crop your images to exact platform dimensions.",
    category: "Image Editing", readTime: "4 min read", publishedAt: "2026-03-20", icon: "Crop",
    tags: ["cropping", "images", "aspect ratio"],
    toolLink: { label: "Crop Images Precisely", href: "/tools/image-cropper" }
  },
  {
    slug: "extract-text-from-screenshots",
    title: "How to Extract Text from Complex Images (OCR)",
    description: "Got a photo of a receipt or a screenshot of a chart? Learn how to instantly grab raw, editable text out of literally any image file.",
    category: "Productivity", readTime: "3 min read", publishedAt: "2026-03-21", icon: "FileText",
    tags: ["ocr", "text extraction", "image tools"],
    toolLink: { label: "Extract Image Text", href: "/tools/image-to-text" }
  },
  {
    slug: "how-to-compress-pdfs",
    title: "How to Compress PDFs That Are Too Large to Email",
    description: "Stop getting 'File Attachment Too Large' errors. Here is how you can crush heavy PDF files without making the text illegible.",
    category: "PDF Tools", readTime: "4 min read", publishedAt: "2026-03-22", icon: "Minimize2",
    tags: ["pdf", "compression", "file size"],
    toolLink: { label: "Compress Your PDF", href: "/tools/pdf-compressor" }
  },
  {
    slug: "split-pdf-pages-safely",
    title: "How to Safely Extract Specific Pages from a PDF",
    description: "Need to send page 14 of a 200-page document? Learn to visually extract exactly what you need while keeping the data completely private.",
    category: "PDF Tools", readTime: "2 min read", publishedAt: "2026-03-23", icon: "Split",
    tags: ["pdf", "splitting", "document"],
    toolLink: { label: "Split PDF Files", href: "/tools/pdf-splitter" }
  },
  {
    slug: "why-local-markdown-notes-matter",
    title: "Why Local, Encrypted Notes are the Future",
    description: "Your unpolished thoughts shouldn't live on corporate cloud servers. Learn the beauty of drafting your essays and plans inside a purely local scratchpad.",
    category: "Productivity", readTime: "5 min read", publishedAt: "2026-03-24", icon: "NotebookPen",
    tags: ["notes", "privacy", "writing"],
    toolLink: { label: "Open Local Workspace", href: "/tools/notes" }
  },
  {
    slug: "convert-photos-scans-to-pdf",
    title: "How to Combine Scan Photos into a Single PDF",
    description: "Snapping photos of paper homework or invoices? Learn to instantly bind those scattered JPEGs into a single, professional PDF document.",
    category: "PDF Tools", readTime: "3 min read", publishedAt: "2026-03-25", icon: "ImagePlus",
    tags: ["pdf", "image", "scanner", "documents"],
    toolLink: { label: "Convert Images to PDF", href: "/tools/image-to-pdf" }
  },
  {
    slug: "how-to-crop-pdf-pages-visually",
    title: "How to Visually Crop PDF Pages (Without Printing)",
    description: "Remove excessive white margins, cut out unwanted watermarks, or extract specific graphics by visually drawing a crop box over any PDF page right in your browser.",
    category: "PDF Tools",
    readTime: "3 min read",
    publishedAt: "2026-03-26",
    icon: "Crop",
    tags: ["pdf", "cropping", "margins", "documents"],
    toolLink: { label: "Crop Your PDF Now", href: "/tools/pdf-cropper" }
  }
];
