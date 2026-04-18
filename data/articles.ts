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
  },
  {
    slug: "how-smart-founders-manage-cash-flow",
    title: "How Smart Founders Manage Cash Flow (Before It Becomes a Crisis)",
    description: "Most businesses fail not because of a bad product, but because they run out of cash. Learn the simple habits and the one tool that changes everything for founder financial stability.",
    category: "Business Strategy",
    readTime: "15 min read",
    publishedAt: "2026-04-16",
    icon: "Wallet",
    tags: ["Cash Flow", "Finance", "Business Strategy", "Entrepreneurship"]
  },
  {
    slug: "understanding-business-credit",
    title: "Understanding Business Credit: What Most Entrepreneurs Learn Too Late",
    description: "Business credit is the invisible foundation of your company's financial power. Discover why it’s separate from personal credit and how to build it from zero to unlock better rates and higher limits.",
    category: "Business Strategy",
    readTime: "16 min read",
    publishedAt: "2026-04-16",
    icon: "CreditCard",
    tags: ["Credit", "Business Finance", "Strategy", "Entrepreneurship", "Founders"]
  },
  {
    slug: "bootstrap-vs-funding-honest-comparison",
    title: "Bootstrap vs. Funding: A Brutally Honest Comparison",
    description: "Every founder faces the same question: bootstrap or raise? Discover the raw, unvarnished truth about both paths and how to decide what's right for your life and business.",
    category: "Business Strategy",
    readTime: "20 min read",
    publishedAt: "2026-04-16",
    icon: "Scale",
    tags: ["Founders", "Strategy", "Funding", "Bootstrapping", "Business"]
  },
  {
    slug: "hidden-costs-of-running-a-business",
    title: "The Hidden Costs of Running a Business Nobody Talks About",
    description: "Every business has costs you don't see on the balance sheet. Learn to spot the invisible drain on your time, money, and energy before they see you first.",
    category: "Business Strategy",
    readTime: "20 min read",
    publishedAt: "2026-04-17",
    icon: "Receipt",
    tags: ["Business", "Strategy", "Finance", "Founder Tips", "Growth"]
  },
  {
    slug: "wish-i-knew-before-starting-business",
    title: "What I Wish I Knew Before Starting My First Business",
    description: "Beyond the tactics and business plans, there are lessons that can only be earned through experience. Discover the raw, unvarnished truths that first-time founders wish they knew before they began.",
    category: "Business Strategy",
    readTime: "22 min read",
    publishedAt: "2026-04-17",
    icon: "Lightbulb",
    tags: ["Entrepreneurship", "Founders", "Business Strategy", "Mindset", "Life Lessons"]
  },
  {
    slug: "5-businesses-that-failed-lessons",
    title: "5 Businesses That Failed — And the Exact Lessons That Came Out of Them",
    description: "Failure is the most honest teacher in business. Discover the specific, preventable reasons why five iconic companies collapsed and what you can learn to protect your own venture.",
    category: "Business Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-17",
    icon: "TrendingDown",
    tags: ["Business Failure", "Case Study", "Strategy", "Lessons Learned", "Entrepreneurship"]
  },
  {
    slug: "how-famous-brands-went-from-zero-to-icon",
    title: "How Famous Brands Went from Zero to Icon: Lessons You Can Steal",
    description: "Most people look at iconic brands and assume the story started with an advantage. Discover the raw, often messy origin stories of Nike, Apple, Starbucks, Amul, and Airbnb.",
    category: "Business Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-17",
    icon: "Trophy",
    tags: ["Branding", "Case Study", "Business Strategy", "Founders", "Success"]
  },
  {
    slug: "the-pivot-that-saved-the-company",
    title: "The Pivot That Saved the Company: Real Stories of Business Transformation",
    description: "A real pivot is what happens when a founder pays close enough attention to reality to see what the market is actually telling them. Discover the stories of YouTube, Slack, Netflix, and more.",
    category: "Business Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-18",
    icon: "RefreshCcw",
    tags: ["Business Pivot", "Case Study", "Business Strategy", "Founders", "Success"]
  },
  {
    slug: "how-to-run-a-business-in-4-hours-a-day",
    title: "How to Run a Business in 4 Hours a Day (And Still Grow)",
    description: "The four-hour business day is not a fantasy. It is about understanding which four hours of work actually drive results. Learn to protect, prioritize, and perform at the highest level.",
    category: "Business Growth",
    readTime: "22 min read",
    publishedAt: "2026-04-18",
    icon: "Clock",
    tags: ["Productivity", "Business Strategy", "Growth", "Delegation", "Time Management"]
  },
  {
    slug: "systems-over-hustle",
    title: "Systems Over Hustle: Building a Business That Doesn't Need You 24/7",
    description: "A business that depends on you is not a tribute to your capability. It is evidence that your capability has not yet been replicated. Learn how to build systems that scale.",
    category: "Operational Excellence",
    readTime: "28 min read",
    publishedAt: "2026-04-18",
    icon: "Settings",
    tags: ["Systems", "Operations", "Efficiency", "Automation", "Founders"]
  },
  {
    slug: "how-to-hire-your-first-employee",
    title: "How to Hire Your First Employee Without Making Expensive Mistakes",
    description: "Hiring your first employee is a milestone, but the cost of getting it wrong is high. Learn the specific things to look for, ask, and assess to find the right fit.",
    category: "Talent & Culture",
    readTime: "30 min read",
    publishedAt: "2026-04-18",
    icon: "Users",
    tags: ["Hiring", "Recruitment", "Management", "Founders", "Culture"]
  },
  {
    slug: "the-compounding-effect",
    title: "The Compounding Effect: Why Small Daily Decisions Build Empires",
    description: "Compounding is not just a financial principle. It works on knowledge, reputation, and habits. Learn how small, consistent decisions build empires over time.",
    category: "Mindset & Strategy",
    readTime: "35 min read",
    publishedAt: "2026-04-18",
    icon: "TrendingUp",
    tags: ["Compounding", "Decision Making", "Habits", "Founders", "Strategy"]
  },
  {
    slug: "why-your-business-needs-an-enemy",
    title: "Why Your Business Needs an Enemy: The Power of Positioning Against Someone",
    description: "Picking an enemy is not about aggression; it's about clarity. Learn why the most successful brands position themselves against a belief, behavior, or standard to build fierce loyalty.",
    category: "Business Strategy",
    readTime: "32 min read",
    publishedAt: "2026-04-18",
    icon: "ShieldAlert",
    tags: ["Branding", "Positioning", "Strategy", "Marketing", "Founders"]
  }
];
