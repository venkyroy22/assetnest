"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, X } from "lucide-react";

async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === "en" || !text.trim()) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map((s: any) => s[0]).join("") || text;
  } catch (e) {
    console.error("Translation error:", e);
    return text;
  }
}

export default function ArticleTranslator({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "en";
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState(0); 

  useEffect(() => {
    if (lang === "en") {
      setKey(prev => prev + 1);
      setShowDisclaimer(false);
      return;
    }

    const translateAll = async () => {
      if (!containerRef.current) return;
      setIsTranslating(true);
      setShowDisclaimer(true);

      const walker = document.createTreeWalker(
        containerRef.current,
        NodeFilter.SHOW_TEXT,
        null
      );

      const nodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.textContent?.trim()) {
          nodes.push(node as Text);
        }
      }
      
      const translationPromises = nodes.map(async (textNode) => {
        const originalText = textNode.textContent || "";
        const translated = await translateText(originalText, lang);
        textNode.textContent = translated;
      });

      await Promise.all(translationPromises);
      setIsTranslating(false);
    };

    translateAll();
  }, [lang]);

  return (
    <div className="relative">
      {isTranslating && (
        <div className="fixed top-1/2 -translate-y-1/2 right-10 z-[100] bg-white text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-5 duration-300">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Translating Article...</span>
        </div>
      )}
 
      {showDisclaimer && !isTranslating && (
        <div className="fixed top-1/2 -translate-y-1/2 right-6 md:right-10 z-[90] max-w-xs bg-zinc-900 border border-white/10 p-5 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-right-5 duration-500 group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
               <AlertCircle size={18} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Translation Note</p>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                This article is machine-translated and may contain inaccuracies. Please refer to the English version for maximum accuracy.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowDisclaimer(false)}
            className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div ref={containerRef} key={key}>
        {children}
      </div>
    </div>
  );
}
