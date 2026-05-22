"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Search } from "lucide-react";
import * as Icons from "lucide-react";
import { type GuidePost, GUIDE_CATEGORIES, type GuideCategory } from "@/data/guidePosts";

export default function GuidesSearch({ allPosts }: { allPosts: GuidePost[] }) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>("All");

  // Get distinct categories that actually have posts (plus "All")
  const activeCategories = useMemo(() => {
    const categoriesWithPosts = new Set(allPosts.map(p => p.category));
    return GUIDE_CATEGORIES.filter(cat => cat === "All" || categoriesWithPosts.has(cat));
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    
    // 1. Category Filter
    if (selectedCategory !== "All") {
      posts = posts.filter(post => post.category === selectedCategory);
    }
    
    // 2. Query Filter with scoring
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
  }, [allPosts, query, selectedCategory]);

  const [featured, ...rest] = filteredPosts;

  // Decide what to show in the grid
  // If we are filtering, we show EVERYTHING in the grid (no featured hero)
  // Or we keep the hero if the filter is just category?
  // Let's keep it simple: if filtering by text or category, show a flat list if it feels better.
  const isFiltering = query.trim().length > 0 || selectedCategory !== "All";

  const getSmallIcon = (iconName: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent className="w-6 h-6 text-zinc-300 group-hover:text-[#f0ede8] transition-colors" strokeWidth={1.5} />;
  };

  const getFeaturedIcon = (iconName: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300 group-hover:text-[#f0ede8] transition-colors" strokeWidth={1.5} />;
  };

  return (
    <>
      <div className="relative max-w-2xl mx-auto mb-10">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="Search guides, tags, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-[#1c1c1c] border border-white/[0.07] rounded-2xl text-[#f0ede8] placeholder:text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-16 overflow-x-auto pb-4 scrollbar-hide">
        {activeCategories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedCategory === category
                ? "bg-[#f0ede8] text-[#141414] border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                : "bg-[#1e1e1e]/50 text-zinc-500 border-white/[0.07] hover:border-white/[0.12] hover:text-zinc-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Featured Post displays only if not "deeply" filtering and we have a winner */}
      {!isFiltering && featured && (
        <Link
          href={`/guides/${featured.slug}`}
          className="group block mb-12 bg-[#1c1c1c] border border-white/[0.05] rounded-[2rem] p-8 sm:p-10 hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_0_60px_rgba(255,255,255,0.04)] relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.02] blur-3xl pointer-events-none group-hover:bg-white/[0.04] transition-all duration-500" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              {getFeaturedIcon(featured.icon)}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/40 text-zinc-400">
                  {featured.category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-400">
                  ★ Featured
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#f0ede8] tracking-tight mb-3 group-hover:text-zinc-100 transition-colors leading-snug">
                {featured.title}
              </h2>
              <p className="text-zinc-500 text-sm sm:text-base leading-relaxed mb-4 max-w-2xl">
                {featured.description}
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
                  <Clock size={12} />
                  {featured.readTime}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0ede8] group-hover:gap-2.5 transition-all duration-200">
                  Read Guide
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid of posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(isFiltering ? filteredPosts : rest).length > 0 ? (
          (isFiltering ? filteredPosts : rest).map((post) => (
            <Link
              key={post.slug}
              href={`/guides/${post.slug}`}
              className="group flex flex-col bg-[#1c1c1c] border border-white/[0.05] rounded-[1.5rem] p-6 hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-xl bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  {getSmallIcon(post.icon)}
                </div>

                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/40 text-zinc-400 w-fit mb-3">
                  {post.category}
                </span>

                <h2 className="text-base sm:text-lg font-black text-[#f0ede8] tracking-tight mb-2 group-hover:text-zinc-100 transition-colors leading-snug flex-1">
                  {post.title}
                </h2>
                <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-5 line-clamp-2">
                  {post.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-700 font-medium">
                    <Clock size={11} />
                    {post.readTime}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 group-hover:text-[#f0ede8] transition-colors">
                    Read Guide
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border overflow-hidden border-white/[0.05]/50 rounded-[2rem] bg-[#1c1c1c]/30">
             <div className="w-16 h-16 bg-[#1c1c1c] border border-white/[0.07] rounded-full flex items-center justify-center mx-auto mb-5">
                <Search size={24} className="text-zinc-600" />
             </div>
             <p className="text-zinc-400 font-medium tracking-tight">No guides found matching your filters</p>
             <p className="text-zinc-600 text-sm mt-2">Try adjusting your search or category selection.</p>
          </div>
        )}
      </div>
    </>
  );
}
