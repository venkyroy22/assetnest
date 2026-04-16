import { type LucideIcon } from "lucide-react";

export type ArticlePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  publishedAt: string;
  icon?: string;
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
    icon: "TrendingUp",
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
  },
  {
    slug: "art-of-saying-no-boundaries-business",
    title: "The Art of Saying No: How Boundaries Drive Business Success",
    description: "Every time you say yes to the wrong thing, you are automatically saying no to something better. Learn why the most successful business owners have mastered the art of saying no — clearly, kindly, and without apology.",
    category: "Business Strategy",
    readTime: "14 min read",
    publishedAt: "2026-04-15",
    icon: "ShieldCheck",
    tags: ["Business", "Boundaries", "Leadership", "Productivity", "Growth"]
  },
  {
    slug: "find-business-idea-saturated-market",
    title: "How to Find a Business Idea in a Market That's Already Saturated",
    description: "Every single market that exists today was once considered oversaturated. Learn the five proven angles to find a profitable gap in a crowded market and build something meaningfully different.",
    category: "Business Strategy",
    readTime: "12 min read",
    publishedAt: "2026-04-15",
    icon: "Lightbulb",
    tags: ["Business Ideas", "Market Research", "Strategy", "Entrepreneurship", "Growth"]
  },
  {
    slug: "content-strategy-readers-to-loyal-buyers",
    title: "The Content Strategy That Turns Readers Into Loyal Buyers",
    description: "Most business owners who try content marketing make the same mistake. Discover the framework that stops content from being a vanity exercise and turns it into a system that builds real trust and converts loyal customers.",
    category: "Business Growth",
    readTime: "16 min read",
    publishedAt: "2026-04-16",
    icon: "HandCoins",
    tags: ["Content Marketing", "Growth", "Strategy", "Email Marketing", "Business"]
  },
  {
    slug: "viral-by-design-word-of-mouth",
    title: "Viral by Design: How Small Brands Create Word-of-Mouth Machines",
    description: "Nobody accidentally goes viral. Learn the three elements viral brands share and how to engineer word-of-mouth growth for your small business without massive ad spend.",
    category: "Business Growth",
    readTime: "14 min read",
    publishedAt: "2026-04-16",
    icon: "Megaphone",
    tags: ["Marketing", "Virality", "Word of Mouth", "Branding", "Growth"]
  },
  {
    slug: "pricing-psychology-charging-more",
    title: "Pricing Psychology: Why Charging More Can Actually Win You More Clients",
    description: "There is a question that lives in the back of almost every business owner's mind: am I charging too much? Discover why lowering prices attracts the wrong clients and how premium pricing builds better businesses.",
    category: "Business Strategy",
    readTime: "18 min read",
    publishedAt: "2026-04-16",
    icon: "DollarSign",
    tags: ["Pricing", "Psychology", "Business Strategy", "Growth", "Sales"]
  }
];
