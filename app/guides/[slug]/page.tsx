import { notFound } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { ALL_GUIDE_POSTS } from "@/data/guidePosts";
import { ArrowLeft, Clock, ArrowRight, Tag, ExternalLink } from "lucide-react";
import * as Icons from "lucide-react";
import { GUIDE_CONTENT } from "@/data/guideContent";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = ALL_GUIDE_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  };
}

export function generateStaticParams() {
  return ALL_GUIDE_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function GuidePostPage({ params }: Props) {
  const { slug } = await params;
  const post = ALL_GUIDE_POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  const getIcon = (iconName: string, className: string) => {
    // @ts-ignore
    const IconComponent = Icons[iconName] || Icons.FileText;
    return <IconComponent className={className} strokeWidth={1.5} />;
  };

  const content = GUIDE_CONTENT[slug];
  if (!content) notFound();

  const related = ALL_GUIDE_POSTS.filter(
    (p) => p.slug !== slug && p.tags.some((t) => post.tags.includes(t))
  ).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#141414] py-20">
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-[#f0ede8] transition-colors mb-10 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            All Guides
          </Link>

          {/* Article Header */}
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-zinc-700 bg-zinc-800/40 text-zinc-400">
                {post.category}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-600 font-medium">
                <Clock size={11} />
                {post.readTime}
              </span>
              <span className="text-[11px] text-zinc-700 font-medium">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-start gap-5 mb-6">
              <div className="shrink-0 w-16 h-16 rounded-xl bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center">
                {getIcon(post.icon, "w-8 h-8 text-zinc-300")}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#f0ede8] leading-[1.1]">
                {post.title}
              </h1>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed border-l-2 border-white/[0.07] pl-5">
              {post.description}
            </p>
          </div>

          {/* Tool CTA Banner */}
          {post.toolLink && (
            <Link
              href={post.toolLink.href}
              className="group flex items-center justify-between gap-4 bg-[#1c1c1c] border border-white/[0.07] hover:border-zinc-600 rounded-2xl px-6 py-4 mb-10 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.04)]"
            >
              <span className="text-sm font-bold text-[#f0ede8] group-hover:text-zinc-100 transition-colors">
                {post.toolLink.label}
              </span>
              <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-zinc-500 group-hover:text-[#f0ede8] transition-colors">
                <ExternalLink size={12} />
                Free
              </div>
            </Link>
          )}

          {/* Article Body */}
          <article className="prose-custom">{content}</article>

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-white/[0.05] flex flex-wrap gap-2">
            <div className="flex items-center gap-2 mr-2">
              <Tag size={12} className="text-zinc-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Tags</span>
            </div>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs font-medium text-zinc-500 border border-white/[0.07] rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Bottom CTA */}
          {post.toolLink && (
            <div className="mt-10 bg-[#1c1c1c] border border-white/[0.05] rounded-[1.5rem] p-8 text-center">
              <p className="text-zinc-400 text-sm mb-4">
                Ready to put this guide into practice?
              </p>
              <Link
                href={post.toolLink.href}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#f0ede8] text-[#141414] text-sm font-black rounded-xl hover:bg-zinc-100 active:scale-95 transition-all duration-200"
              >
                {post.toolLink.label}
                <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {/* Related Posts */}
          {related.length > 0 && (
            <div className="mt-14">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-5">
                Related Guides
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/guides/${r.slug}`}
                    className="group flex items-start gap-4 bg-[#1c1c1c] border border-white/[0.05] hover:border-white/[0.12] rounded-2xl p-5 transition-all duration-200"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-[#1c1c1c] border border-white/[0.07] flex items-center justify-center text-xl">
                      {getIcon(r.icon, "w-5 h-5 text-zinc-400 group-hover:text-[#f0ede8] transition-colors")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#f0ede8] leading-snug group-hover:text-zinc-100 mb-1 transition-colors line-clamp-2">
                        {r.title}
                      </p>
                      <span className="text-[11px] text-zinc-600 font-medium">{r.readTime}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to all */}
          <div className="mt-10 text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-[#f0ede8] transition-colors group"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to All Guides
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
