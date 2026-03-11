export interface Asset {
  id: string;
  title: string;
  description: string;
  category: "Thumbnails" | "Social Media Templates" | "Overlays" | "UI Kits" | "LUTs";
  previewUrl: string;
  downloadUrl: string;
  license: "Free" | "Premium";
}

export const assets: Asset[] = [
  {
    id: "1",
    title: "Minimal UI Kit",
    description: "A clean, black and white UI kit for mobile applications.",
    category: "UI Kits",
    previewUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?q=80&w=2070&auto=format&fit=crop",
    downloadUrl: "https://drive.google.com/drive/folders/placeholder1",
    license: "Free",
  },
  {
    id: "2",
    title: "Cinematic LUTs Pack",
    description: "Professional color grading presets for video editors.",
    category: "LUTs",
    previewUrl: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071&auto=format&fit=crop",
    downloadUrl: "https://drive.google.com/drive/folders/placeholder2",
    license: "Free",
  },
  {
    id: "3",
    title: "YouTube Thumbnail Pack",
    description: "High-click-through rate templates for creators.",
    category: "Thumbnails",
    previewUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop",
    downloadUrl: "https://drive.google.com/drive/folders/placeholder3",
    license: "Free",
  },
  {
    id: "4",
    title: "Instagram Story Templates",
    description: "Minimalist social media assets for brand building.",
    category: "Social Media Templates",
    previewUrl: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1974&auto=format&fit=crop",
    downloadUrl: "https://drive.google.com/drive/folders/placeholder4",
    license: "Free",
  },
  {
    id: "5",
    title: "Retro VHS Overlays",
    description: "Add a nostalgic feel to your video projects.",
    category: "Overlays",
    previewUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    downloadUrl: "https://drive.google.com/drive/folders/placeholder5",
    license: "Free",
  }
];

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: "Design" | "Video Editing" | "Resources";
  link: string;
}

export const tools: Tool[] = [
  {
    id: "t1",
    name: "Figma",
    description: "The collaborative interface design tool.",
    category: "Design",
    link: "https://figma.com",
  },
  {
    id: "t2",
    name: "Adobe Premiere Pro",
    description: "Industry-leading video editing software.",
    category: "Video Editing",
    link: "https://adobe.com/products/premiere",
  },
  {
    id: "t4",
    name: "Behance",
    description: "Showcase and discover creative work.",
    category: "Resources",
    link: "https://behance.net",
  },
  {
    id: "ig1",
    name: "InstaFetch Downloader",
    description: "Download high-quality Instagram Reels & Posts instantly.",
    category: "Video Editing",
    link: "/tools/ig-downloader",
  },
  {
    id: "qr1",
    name: "Assetnest QR Engine",
    description: "Generate beautiful, highly customizable HD QR Codes.",
    category: "Design",
    link: "/tools/qr",
  }
];

export interface KeywordList {
  title: string;
  slug: string;
  description: string;
  image: string;
  keywords: string[];
  tips: string[];
  externalUrl?: string;
}

export const pinterestKeywords: KeywordList[] = [
  {
    title: "Pinterest Keywords for Designers",
    slug: "designers",
    description: "Discover the most effective keywords to showcase your graphic design, UI/UX, and branding projects to the right audience.",
    image: "/categories/KeyWord1.png",
    keywords: ["Graphic Design Inspiration", "Minimalist Logo Design", "Typography Trends 2024", "Brand Identity Design", "UX/UI Case Studies"],
    tips: ["Use broad terms combined with specific niches.", "Update your keywords every season.", "Analyze your competitor's boards."],
    externalUrl: "https://in.pinterest.com/pin/908530924842231701/",
  },
  {
    title: "Pinterest Keywords for NFT Creators",
    slug: "nft-creators",
    description: "Strategic search terms for highlighting 3D avatars, digital collectibles, and crypto art projects.",
    image: "/categories/KeyWord2.png",
    keywords: ["NFT Character Art", "3D Avatar Design", "Digital Collectibles", "Crypto Art Style", "Web3 Branding"],
    tips: ["Use platform-specific hashtags.", "Highlight unique character traits.", "Focus on 3D and rendering styles."],
    externalUrl: "https://in.pinterest.com/pin/84020349292800356/",
  }
];

export const assetFilters = [
  "Recommended",
  "New Assets",
  "Most Popular",
  "UI Kits",
  "Overlays",
  "LUTs",
  "Pinterest Tools"
];
