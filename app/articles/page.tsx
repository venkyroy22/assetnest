
import Container from "@/components/Container";
import { Newspaper, Tag } from "lucide-react";
import ArticlesSearch from "@/app/articles/ArticlesSearch";
import { ALL_ARTICLE_POSTS } from "@/data/articles";

export const metadata = {
  title: "Articles — Knowledge Base & Education",
  description: "Deep dives into industry trends, case studies, and business growth. Articles for creators and entrepreneurs.",
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-black py-20">
      <Container>
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <Newspaper size={12} className="text-zinc-500" />
              The Learning Journal
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              {ALL_ARTICLE_POSTS.length} Articles
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1]">
            Perspective & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">
              Knowledge Base
            </span>
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
            Deep dives into creative tech, business strategies, and the evolving landscape of digital tools.
          </p>
        </div>

        {/* Interactive Search & Grid */}
        <ArticlesSearch allPosts={ALL_ARTICLE_POSTS} />

        {/* Tags cloud */}
        <div className="mt-24 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tag size={14} className="text-zinc-600" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">
              Trending Topics
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(new Set(ALL_ARTICLE_POSTS.flatMap((p) => p.tags))).length > 0 ? (
              Array.from(new Set(ALL_ARTICLE_POSTS.flatMap((p) => p.tags))).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium text-zinc-500 border border-zinc-800 rounded-full hover:border-zinc-700 hover:text-zinc-300 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))
            ) : (
                <span className="text-zinc-700 text-xs italic font-medium">No topics yet</span>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
