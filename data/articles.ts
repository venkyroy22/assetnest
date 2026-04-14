import { type LucideIcon } from "lucide-react";

export type ArticlePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  icon: string;
  tags: string[];
};

export const ARTICLE_CATEGORIES = [
  "Business Strategy",
  "Business Growth"
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const ALL_ARTICLE_POSTS: ArticlePost[] = [
  {
    slug: "80-20-rule-business-growth",
    title: "The 80/20 Rule Applied to Business: Where to Focus for Maximum Growth",
    description: "Most business owners work 12-hour days and still feel stuck. Discover the one shift that changes everything using the Pareto Principle.",
    category: "Business Strategy",
    readTime: "10 min read",
    publishedAt: "2026-04-13",
    tags: ["Business", "Strategy", "Growth", "Productivity"]
  },
  {
    slug: "why-most-business-plans-fail",
    title: "Why Most Business Plans Fail — And What to Write Instead",
    description: "Traditional business plans are often ignored the moment they are printed. Learn why they fail and how to build a Living Business Document that actually grows with you.",
    category: "Business Strategy",
    readTime: "12 min read",
    publishedAt: "2026-04-14",
    icon: "FileText",
    tags: ["Business", "Strategy", "Planning", "Entrepreneurship"]
  },
  {
    slug: "get-first-100-customers-without-ads",
    title: "How to Get Your First 100 Customers Without Spending on Ads",
    description: "Paid ads often fail for new businesses. Learn the high-trust, zero-cost strategies to build your foundation and reach your first 100 customers through genuine connection.",
    category: "Business Growth",
    readTime: "15 min read",
    publishedAt: "2026-04-14",
    icon: "Users",
    tags: ["Marketing", "Growth", "Customers", "Founder Tips", "Business"]
  },
  {
    slug: "thinking-like-a-ceo-decision-frameworks",
    title: "Thinking Like a CEO: Decision-Making Frameworks Used by Top Leaders",
    description: "Successful leaders don't just work harder; they think differently. Discover the structured mental models that top CEOs use to cut through noise and make high-stakes decisions with confidence.",
    category: "Business Strategy",
    readTime: "12 min read",
    publishedAt: "2026-04-14",
    icon: "Brain",
    tags: ["Leadership", "Decision Making", "Mental Models", "CEO", "Strategy"]
  }
];
