"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Search } from "lucide-react";
import * as Icons from "lucide-react";
import type { GuidePost } from "@/data/guidePosts";

export default function GuidesSearch({ allPosts }: { allPosts: GuidePost[] }) {
  const [query, setQuery] = useState("");

  const [featured, ...rest] = allPosts;

  // If there's a search query, filter ALL posts. 
  // If no query, we display the Featured Post + the Rest.
  const isSearching = query.trim().length > 0;
  
  const filteredPosts = isSearching 
    ? allPosts.filter(post => 
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.description.toLowerCase().includes(query.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(query.toLowerCase())) ||
        post.category.toLowerCase().includes(query.toLowerCase())
      )
    : rest;

  const getSmallIcon = (iconName: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent className="w-6 h-6 text-zinc-300 group-hover:text-white transition-colors" strokeWidth={1.5} />;
  };

  const getFeaturedIcon = (iconName: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-300 group-hover:text-white transition-colors" strokeWidth={1.5} />;
  };

  return (
    <>
      <div className="relative max-w-2xl mx-auto mb-16">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={18} className="text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="Search guides, tags, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-700 transition-colors shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Featured Post displays only if not searching */}
      {!isSearching && featured && (
        <Link
          href={`/guides/${featured.slug}`}
          className="group block mb-12 bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 sm:p-10 hover:border-zinc-700 transition-all duration-300 hover:shadow-[0_0_60px_rgba(255,255,255,0.04)] relative overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/[0.02] blur-3xl pointer-events-none group-hover:bg-white/[0.04] transition-all duration-500" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            {/* Emoji cover */}
            <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
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

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight mb-3 group-hover:text-zinc-100 transition-colors leading-snug">
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
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:gap-2.5 transition-all duration-200">
                  Read Article
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid of posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/guides/${post.slug}`}
              className="group flex flex-col bg-zinc-950 border border-zinc-900 rounded-[1.5rem] p-6 hover:border-zinc-700 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Emoji */}
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  {getSmallIcon(post.icon)}
                </div>

                {/* Category */}
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/40 text-zinc-400 w-fit mb-3">
                  {post.category}
                </span>

                <h2 className="text-base sm:text-lg font-black text-white tracking-tight mb-2 group-hover:text-zinc-100 transition-colors leading-snug flex-1">
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
                  <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 group-hover:text-white transition-colors">
                    Read
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border overflow-hidden border-zinc-900/50 rounded-[2rem] bg-zinc-950/30">
             <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-5">
                <Search size={24} className="text-zinc-600" />
             </div>
             <p className="text-zinc-400 font-medium tracking-tight">No guides found matching "{query}"</p>
             <p className="text-zinc-600 text-sm mt-2">Try searching by tool, topic, or keyword.</p>
          </div>
        )}
      </div>
    </>
  );
}
