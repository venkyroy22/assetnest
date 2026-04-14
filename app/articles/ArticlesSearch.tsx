"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Search, Bookmark } from "lucide-react";
import * as Icons from "lucide-react";
import { type ArticlePost, ARTICLE_CATEGORIES, type ArticleCategory } from "@/data/articles";

export default function ArticlesSearch({ allPosts }: { allPosts: ArticlePost[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | "All">("All");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("saved_articles");
    if (saved) {
      setSavedSlugs(JSON.parse(saved));
    }
  }, []);

  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    
    if (showBookmarks) {
      posts = posts.filter(post => savedSlugs.includes(post.slug));
    }
    
    if (selectedCategory !== "All") {
      posts = posts.filter(post => post.category === selectedCategory);
    }
    
    if (query.trim()) {
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      
      const scored = posts.map(post => {
        let score = 0;
        const title = post.title.toLowerCase();
        const desc = post.description.toLowerCase();
        const cat = post.category.toLowerCase();
        const tags = post.tags.map(t => t.toLowerCase());

        for (const word of words) {
          if (title.includes(word)) score += 30;
          if (tags.some(t => t.includes(word))) score += 20;
          if (cat.includes(word)) score += 15;
          if (desc.includes(word)) score += 5;
        }

        return { post, score };
      }).filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.post);

      return scored;
    }
    
    return posts;
  }, [allPosts, query, selectedCategory, showBookmarks, savedSlugs]);

  const getSmallIcon = (iconName?: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName || ""] || Icons.FileText;
    return <IconComponent className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" strokeWidth={1.5} />;
  };

  return (
    <>
      <div className="relative max-w-2xl mx-auto mb-10">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="Search articles, insights, or analysis..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Article Specific Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-16 overflow-x-auto pb-4 scrollbar-hide">
        <button
          onClick={() => setShowBookmarks(!showBookmarks)}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center gap-2 ${
            showBookmarks
              ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              : "bg-zinc-900/50 text-amber-500 border-amber-900/30 hover:border-amber-700/50"
          }`}
        >
          <Bookmark size={12} className={showBookmarks ? "fill-current" : ""} />
          Bookmarks {savedSlugs.length > 0 && `(${savedSlugs.length})`}
        </button>

        <div className="w-px h-4 bg-zinc-800 mx-2" />

        {["All", ...ARTICLE_CATEGORIES].map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category as any);
              setShowBookmarks(false);
            }}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedCategory === category && !showBookmarks
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                : "bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid of articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/articles/${post.slug}`}
              className="group flex flex-col bg-zinc-950 border border-zinc-900 rounded-[1.5rem] p-6 hover:border-zinc-700 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300">
                  {getSmallIcon(post.icon || "FileText")}
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-zinc-800/50 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300 transition-all border border-zinc-700/50">
                    {post.category}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-700">{post.readTime}</span>
                </div>

                <h2 className="text-lg font-black text-white tracking-tight mb-3 group-hover:text-zinc-100 transition-colors leading-tight flex-1">
                  {post.title}
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed mb-6 line-clamp-2">
                  {post.description}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/[0.03]">
                  <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                    {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all group-hover:gap-2.5">
                    Read Article
                    <ArrowRight size={10} />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/20">
             <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                {showBookmarks ? <Bookmark size={22} className="text-zinc-600" /> : <Search size={22} className="text-zinc-600" />}
             </div>
             <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px]">
               {showBookmarks ? "No saved articles" : "No results found"}
             </p>
             <p className="text-zinc-600 text-sm mt-3 max-w-xs mx-auto">
               {showBookmarks 
                ? "You haven't saved any articles to your bookmarks yet."
                : "We couldn't find any articles matching your search query or filters."}
             </p>
          </div>
        )}
      </div>
    </>
  );
}
