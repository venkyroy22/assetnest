"use client";

import { useState, useEffect } from "react";
import { Bookmark, Share2, Check, Globe } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "ta", label: "தமிழ்" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
];

interface ArticleActionsProps {
  title: string;
  slug: string;
}

export default function ArticleActions({ title, slug }: ArticleActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang") || "en";

  const [isSaved, setIsSaved] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("saved_articles");
    if (saved) {
      const savedSlugs = JSON.parse(saved);
      setIsSaved(savedSlugs.includes(slug));
    }
  }, [slug]);

  const toggleSave = () => {
    const saved = localStorage.getItem("saved_articles");
    let savedSlugs = saved ? JSON.parse(saved) : [];
    
    if (isSaved) {
      savedSlugs = savedSlugs.filter((s: string) => s !== slug);
      setIsSaved(false);
    } else {
      savedSlugs.push(slug);
      setIsSaved(true);
    }
    
    localStorage.setItem("saved_articles", JSON.stringify(savedSlugs));
  };

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `Check out this article: ${title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLanguageChange = (lang: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lang === "en") params.delete("lang");
    else params.set("lang", lang);
    
    router.push(`?${params.toString()}`, { scroll: false });
    setIsLangOpen(false);
  };

  return (
    <div className="flex items-center gap-2 sm:gap-4 relative">
      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
            currentLang !== "en" 
              ? "bg-white text-black border-white" 
              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"
          }`}
          title="Select Language"
        >
          <Globe size={14} className={currentLang !== "en" ? "" : "text-zinc-600 group-hover:text-zinc-400"} />
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
            {LANGUAGES.find(l => l.code === currentLang)?.label || "English"}
          </span>
        </button>

        {isLangOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
            <div className="absolute top-10 right-0 z-50 w-40 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                    currentLang === l.code 
                      ? "bg-white/10 text-white" 
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="w-px h-4 bg-zinc-800 mx-1" />

      <button
        onClick={toggleSave}
        className={`p-2 transition-all hover:scale-110 active:scale-90 ${
          isSaved ? "text-white" : "text-zinc-500 hover:text-zinc-300"
        }`}
        title={isSaved ? "Remove from Bookmarks" : "Save Article"}
      >
        <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
      </button>

      <div className="relative">
        <button
          onClick={handleShare}
          className={`p-2 transition-all hover:scale-110 active:scale-90 ${
            copied ? "text-emerald-400" : "text-zinc-500 hover:text-white"
          }`}
          title="Share Article"
        >
          {copied ? <Check size={20} /> : <Share2 size={20} />}
        </button>
        
        {copied && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-zinc-900 border border-zinc-800 text-white text-[10px] font-black uppercase tracking-widest rounded-full whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
            Link Copied!
          </div>
        )}
      </div>
    </div>
  );
}
