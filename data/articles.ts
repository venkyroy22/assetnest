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
  "Business Growth",
  "Operational Excellence",
  "Talent & Culture",
  "Mindset & Strategy"
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
  },
  {
    slug: "the-one-metric-that-matters",
    title: "The One Metric That Matters: How to Find the Single Number That Drives Your Entire Business",
    description: "Most business owners are drowning in numbers. Discover how to identify the one metric that most directly reflects the health, momentum, and direction of your business.",
    category: "Business Strategy",
    readTime: "20 min read",
    publishedAt: "2026-04-19",
    icon: "Target",
    tags: ["Metrics", "KPIs", "Business Strategy", "Growth", "Founders"]
  },
  {
    slug: "dead-time-vs-alive-time",
    title: "Dead Time vs. Alive Time: How Successful Founders Use Every Hour Differently",
    description: "There is a distinction between dead time and alive time that determines the trajectory of every founder's career. Learn how to convert passive hours into compounding assets.",
    category: "Mindset & Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-19",
    icon: "Hourglass",
    tags: ["Time Management", "Founders", "Strategy", "Productivity", "Mindset"]
  },
  {
    slug: "second-order-thinking",
    title: "Second-Order Thinking: How Top CEOs See Around Corners Others Cannot",
    description: "The ability to think one step further than almost everyone else is what separates top CEOs. Learn how to look past the immediate and see the consequences of the consequences.",
    category: "Mindset & Strategy",
    readTime: "28 min read",
    publishedAt: "2026-04-19",
    icon: "Eye",
    tags: ["Mental Models", "Strategy", "Decision Making", "CEOs", "Business Strategy"]
  },
  {
    slug: "the-flywheel-effect",
    title: "The Flywheel Effect: How Amazon, Apple and Everyday Businesses Create Unstoppable Momentum",
    description: "The businesses that grow effortlessly are those that have built self-reinforcing cycles. Discover how flywheels work and how to build one for your business.",
    category: "Business Growth",
    readTime: "24 min read",
    publishedAt: "2026-04-19",
    icon: "RotateCcw",
    tags: ["Flywheel", "Strategy", "Growth", "Amazon", "Apple", "Business Strategy"]
  },
  {
    slug: "why-growing-too-fast-kills-businesses",
    title: "Why Growing Too Fast Kills More Businesses Than Growing Too Slow",
    description: "The narrative that faster is always better is a dangerous trap. Discover why premature scaling is one of the leading causes of business failure and how to grow sustainably.",
    category: "Business Strategy",
    readTime: "26 min read",
    publishedAt: "2026-04-19",
    icon: "TrendingDown",
    tags: ["Growth", "Scaling", "Business Strategy", "Founders", "Strategy"]
  },
  {
    slug: "the-counterintuitive-truth-about-competition",
    title: "The Counterintuitive Truth About Competition: Why More Competitors Can Help You",
    description: "The presence of competition is one of the most consistently misread signals in business. Learn why competitors can be a powerful accelerant for your growth.",
    category: "Business Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-19",
    icon: "Swords",
    tags: ["Competition", "Market Development", "Strategy", "Founders", "Business Strategy"]
  },
  {
    slug: "stop-solving-problems-start-preventing-them",
    title: "Stop Solving Problems. Start Preventing Them. The Shift That Changes Everything",
    description: "The shift from reactive problem-solving to proactive problem prevention. Learn how to stop fighting fires and start building fire-resistant structures.",
    category: "Operational Excellence",
    readTime: "25 min read",
    publishedAt: "2026-04-19",
    icon: "ShieldAlert",
    tags: ["Systems", "Operations", "Efficiency", "Founders", "Business Strategy"]
  },
  {
    slug: "best-business-decisions-non-desperate",
    title: "Why the Best Business Decisions Are Made When You Are Not Desperate",
    description: "Desperation is one of the most reliably destructive forces in business. Learn how building a buffer of cash, time, and relationships protects your decision quality.",
    category: "Mindset & Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-19",
    icon: "Brain",
    tags: ["Decision Making", "Mindset", "Strategy", "Founders", "Business Strategy"]
  },
  {
    slug: "business-advice-sounds-right-almost-always-wrong",
    title: "The Business Advice That Sounds Right but Is Almost Always Wrong",
    description: "The business world is full of advice that achieves truth through repetition rather than evidence. Explore the conventional wisdom that causes the most damage when applied without critical examination.",
    category: "Mindset & Strategy",
    readTime: "30 min read",
    publishedAt: "2026-04-19",
    icon: "AlertTriangle",
    tags: ["Business Advice", "Conventional Wisdom", "Strategy", "Mindset", "Decision Making"]
  },
  {
    slug: "second-mover-beats-first-mover",
    title: "Why Being the Second Mover Often Beats Being the First",
    description: "The first mover advantage is often overstated. Discover why second movers, third movers, and smart followers frequently build larger, more durable, and more profitable businesses than the pioneers.",
    category: "Business Strategy",
    readTime: "28 min read",
    publishedAt: "2026-04-19",
    icon: "FastForward",
    tags: ["First Mover", "Second Mover", "Strategy", "Competition", "Market Entry"]
  },
  {
    slug: "growth-vs-scale-difference",
    title: "The Difference Between a Business That Grows and One That Scales",
    description: "Growing and scaling are not the same. Learn the fundamental distinction between revenue per unit of input and why understanding this relationship determines how you build, fund, and manage your business.",
    category: "Business Growth",
    readTime: "32 min read",
    publishedAt: "2026-04-19",
    icon: "TrendingUp",
    tags: ["Growth", "Scale", "Business Strategy", "Business Model", "Founders"]
  },
  {
    slug: "how-to-build-business-moat",
    title: "How to Build a Moat: Protecting Your Business from Competitors Who Want What You Have",
    description: "Success attracts competition. Explore the five genuine sources of competitive durability—from switching costs to network effects—and learn how to build structural protection that allows your business to compound its advantages.",
    category: "Business Strategy",
    readTime: "35 min read",
    publishedAt: "2026-04-19",
    icon: "Shield",
    tags: ["Moat", "Competition", "Strategy", "Business Strategy", "Durability"]
  },
  {
    slug: "the-product-market-fit-myth",
    title: "The Product-Market Fit Myth: What It Really Means and How to Know When You Have It",
    description: "Most founders who say they have product-market fit do not have it. Learn what it actually means, how it feels, and the genuine signals that indicate you've found it.",
    category: "Business Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-20",
    icon: "Target",
    tags: ["Product-Market Fit", "Strategy", "Founders", "Growth", "Business"]
  },
  {
    slug: "the-next-10x-growth-trap",
    title: "Why Your Next 10X Growth Will Not Come From What Brought You the First 10X",
    description: "The ladder that got you to this level does not reach the next one. Learn why growth strategies saturate and how to find the next engine while the first is still healthy.",
    category: "Growth",
    readTime: "30 min read",
    publishedAt: "2026-04-20",
    icon: "TrendingUp",
    tags: ["Growth", "Scale", "Strategy", "Founders", "Business"]
  },
  {
    slug: "network-effects-explained",
    title: "Network Effects Explained: How Businesses Get More Valuable the More People Use Them",
    description: "Discover why certain businesses become dominant and impregnable as they grow. A complete guide to the five types of network effects and how to build toward them.",
    category: "Business Strategy",
    readTime: "35 min read",
    publishedAt: "2026-04-20",
    icon: "Share2",
    tags: ["Network Effects", "Strategy", "Founders", "Growth", "Business"]
  },
  {
    slug: "the-niche-domination-strategy",
    title: "The Niche Domination Strategy: Why Owning a Small Market Is Better Than Competing in a Big One",
    description: "The path to building something significant runs through a specific, well-defined niche. Learn why owning a small market is the ultimate competitive advantage and how to execute it.",
    category: "Business Strategy",
    readTime: "32 min read",
    publishedAt: "2026-04-20",
    icon: "Target",
    tags: ["Niche Strategy", "Strategy", "Founders", "Business Strategy", "Growth"]
  },
  {
    slug: "the-wealth-triangle",
    title: "The Wealth Triangle: How Smart Business Owners Build Income, Assets and Freedom Simultaneously",
    description: "Discover the three distinct components of genuine wealth. Learn how to build income, assets, and freedom simultaneously so each dimension strengthens the others.",
    category: "Business Strategy",
    readTime: "38 min read",
    publishedAt: "2026-04-20",
    icon: "Triangle",
    tags: ["Wealth Building", "Strategy", "Founders", "Business Strategy", "Growth"]
  },
  {
    slug: "rich-on-paper-broke-in-reality",
    title: "Why Most Business Owners Are Rich on Paper and Broke in Reality",
    description: "Discover the specific mechanisms that create the gap between theoretical business valuation and actual cash in the bank, and learn how to bridge it.",
    category: "Business Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-21",
    icon: "Wallet",
    tags: ["Business Finance", "Wealth", "Cash Flow", "Strategy", "Founders"]
  },
  {
    slug: "true-cost-of-bad-decision",
    title: "The True Cost of a Bad Decision: How to Calculate What Your Mistakes Are Really Costing You",
    description: "Learn how to calculate the real, often hidden costs of business mistakes—from opportunity costs to momentum damage—and turn them into high-value lessons.",
    category: "Mindset & Strategy",
    readTime: "25 min read",
    publishedAt: "2026-04-21",
    icon: "AlertTriangle",
    tags: ["Decision Making", "Strategy", "Finance", "Leadership", "Mindset"]
  },
  {
    slug: "pay-yourself-properly",
    title: "How to Pay Yourself Properly as a Business Owner Without Killing the Business",
    description: "Stop guessing and start using a principled framework to set your owner compensation. Learn how to balance personal financial health with business resilience.",
    category: "Business Finance",
    readTime: "20 min read",
    publishedAt: "2026-04-21",
    icon: "Banknote",
    tags: ["Finance", "Compensation", "Strategy", "Cash Flow", "Founders"]
  },
  {
    slug: "financial-ratios-every-owner-should-know",
    title: "The Financial Ratios Every Business Owner Should Know by Heart",
    description: "Ratios are the vital signs of your business. Learn which metrics truly matter for tracking efficiency, liquidity, and long-term solvency.",
    category: "Business Finance",
    readTime: "25 min read",
    publishedAt: "2026-04-21",
    icon: "Activity",
    tags: ["Finance", "Accounting", "Metrics", "Strategy", "KPIs"]
  }
];
