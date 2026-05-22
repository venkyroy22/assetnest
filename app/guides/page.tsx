import Link from "next/link";
import Container from "@/components/Container";
import { ALL_GUIDE_POSTS } from "@/data/guidePosts";
import { ArrowRight, Clock, BookOpen, Tag } from "lucide-react";
import * as Icons from "lucide-react";
import GuidesSearch from "./GuidesSearch";

export const metadata = {
  title: "Guides — Creator Tips, Tool Tutorials & AI Resources",
  description:
    "Explore expert guides on image compression, PDF tools, AI prompts, QR codes, and productivity techniques. Free knowledge for modern creators.",
  openGraph: {
    title: "AssetNest Guides — Creator Tips & Tutorials",
    description:
      "Expert guides on image optimization, PDF workflows, AI prompts, and productivity hacks.",
  },
};

export default function GuidesPage() {
  const allPosts = ALL_GUIDE_POSTS.slice().reverse();
  // Force HMR recompile
  if (!allPosts) console.error("Missing ALL_GUIDE_POSTS");

  return (
    <div className="min-h-screen bg-[#141414] py-20">
      <Container>
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 rounded-full mb-6">
            <BookOpen size={12} className="text-zinc-400" />
            <span className="text-xs font-semibold tracking-wide text-zinc-400">
              Platform Guides
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#f0ede8] mb-6 leading-[1.1]">
            Tips, Guides &amp; <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">
              Creative Resources
            </span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
            Expert knowledge on image optimization, PDF workflows, AI creativity, and
            productivity — written for modern creators.
          </p>
        </div>

        {/* Interactive Search, Featured, and Grid */}
        <GuidesSearch allPosts={allPosts} />

        {/* Tags cloud */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tag size={14} className="text-zinc-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
              Topics
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(new Set(ALL_GUIDE_POSTS.flatMap((p) => p.tags))).map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-zinc-500 border border-white/[0.07] rounded-full hover:border-white/[0.12] hover:text-zinc-300 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
