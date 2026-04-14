import { notFound } from "next/navigation";
import Container from "@/components/Container";
import { ALL_ARTICLE_POSTS } from "@/data/articles";
import { ARTICLE_CONTENT } from "@/data/articleContent";
import { ArrowLeft, Clock, Calendar, Share2, Facebook, Twitter, Linkedin, Bookmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Suspense } from "react";

import ArticleActions from "./ArticleActions";
import ArticleTranslator from "@/components/ArticleTranslator";

export async function generateStaticParams() {
  return ALL_ARTICLE_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = ALL_ARTICLE_POSTS.find((p) => p.slug === slug);
  const content = ARTICLE_CONTENT[slug];

  if (!post || !content) {
    notFound();
  }

  const getIcon = (iconName?: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName || ""] || Icons.FileText;
    return <IconComponent size={24} className="text-white" strokeWidth={1.5} />;
  };

  return (
    <article className="min-h-screen bg-black pb-32">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-900 z-[60]">
        <div className="h-full bg-white w-0" /> {/* client-side would update this */}
      </div>

      <Container>
        <Suspense fallback={null}>
          {/* Navigation / Actions Bar */}
          <div className="flex items-center justify-between py-10 mb-8 border-b border-white/[0.05]">
            <Link
              href="/articles"
              className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Articles
            </Link>
            <ArticleActions title={post.title} slug={post.slug} />
          </div>

          <ArticleTranslator>
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    {getIcon(post.icon)}
                 </div>
                 <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
                       {post.category}
                    </span>
                    <div className="flex items-center gap-3 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                       <span className="w-1 h-1 rounded-full bg-zinc-800" />
                       <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readTime}</span>
                    </div>
                 </div>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.3] mb-8">
                {post.title}
              </h1>

              <p className="text-xl text-zinc-400 font-medium leading-relaxed border-l-2 border-white/10 pl-8 mb-12 italic">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-zinc-900/50 border border-zinc-800 rounded-full text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors cursor-default">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-invert prose-zinc max-w-none 
                prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
                prose-p:text-zinc-400 prose-p:text-lg prose-p:leading-relaxed
                prose-strong:text-white prose-strong:font-bold
                prose-a:text-white prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-white prose-blockquote:bg-zinc-900/30 prose-blockquote:py-2 prose-blockquote:rounded-r-2xl
                prose-img:rounded-3xl prose-img:border prose-img:border-zinc-800
                prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-900 prose-pre:rounded-2xl
              ">
                {content}
              </div>

              {/* Post-Article Section / Thank You */}
              <div className="mt-32 pt-16 border-t border-white/[0.05] text-center">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-2xl mb-8 mx-auto shadow-2xl">
                     ✨
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-6 tracking-tight leading-tight">
                     Thank you for reading the Learning Journal.
                  </h3>
                  <p className="text-zinc-500 text-lg leading-relaxed max-w-xl mx-auto italic">
                     "Knowledge is the only asset that grows when shared. We hope this perspective helps you build something meaningful today."
                  </p>
                  <div className="mt-12">
                     <Link 
                        href="/articles"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 border border-zinc-800 rounded-full text-white text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
                     >
                        <ArrowLeft size={14} />
                        Explore More Perspectives
                     </Link>
                  </div>
              </div>
            </div>
          </ArticleTranslator>
        </Suspense>
      </Container>
    </article>
  );
}
