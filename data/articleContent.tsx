import React, { type JSX } from "react";
import { TrendingUp, CheckCircle2, Lightbulb, Target, ArrowRight, Quote, AlertCircle, Dumbbell, Users, GraduationCap } from "lucide-react";
import * as Icons from "lucide-react";

// --- Custom styled components for Article fidelity ---
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-3xl sm:text-4xl font-black text-white mt-16 mb-8 tracking-tight leading-[1.4]">
    {children}
  </h2>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-zinc-400 text-lg leading-relaxed mb-6">
    {children}
  </p>
);

const IntroBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-zinc-900/50 border-l-4 border-white p-8 rounded-r-3xl mb-12 italic text-zinc-300 text-xl leading-relaxed">
    {children}
  </div>
);

const StatRow = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-12">
    {children}
  </div>
);

const StatCard = ({ big, text, icon: Icon }: { big: string; text: string; icon?: any }) => (
  <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] text-center group hover:border-white/10 transition-colors h-full flex flex-col items-center justify-center">
    {Icon && <Icon size={40} className="text-white/20 mb-4 group-hover:text-white/40 transition-colors duration-500" strokeWidth={1} />}
    <span className="block text-4xl sm:text-5xl font-black text-white mb-3 group-hover:scale-110 transition-transform duration-500 leading-tight">{big}</span>
    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[15ch] mx-auto">{text}</p>
  </div>
);

const HighlightBox = ({ title, items }: { title: string; items: string[] }) => (
  <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8 sm:p-10 my-10 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    <h3 className="text-white text-xl font-black mb-6 flex items-center gap-3">
        <Lightbulb className="text-zinc-500" size={20} />
        {title}
    </h3>
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4 text-zinc-400 text-sm leading-relaxed">
          <ArrowRight className="shrink-0 text-white mt-1" size={14} />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const StoryBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 my-16 relative">
    <span className="absolute -top-3 left-10 px-4 py-1 bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
        Real World Perspective
    </span>
    <div className="prose prose-zinc prose-invert max-w-none prose-p:text-zinc-400 prose-p:italic">
        {children}
    </div>
  </div>
);

const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="space-y-3 mb-8 ml-2">{children}</ul>
);

const LI = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-zinc-400 text-lg leading-relaxed">
    <CheckCircle2 size={20} className="text-white mt-1.5 shrink-0" />
    <span>{children}</span>
  </li>
);

const Step = ({ num, title, text }: { num: string; title: string; text: string }) => (
  <div className="group flex gap-6 p-8 bg-zinc-950 border border-white/5 rounded-3xl mb-6 hover:border-white/10 transition-all">
    <div className="w-12 h-12 shrink-0 bg-white text-black rounded-full flex items-center justify-center font-black text-lg">
        {num}
    </div>
    <div>
        <h4 className="text-white font-black text-lg mb-2 tracking-tight">{title}</h4>
        <p className="text-zinc-500 text-sm leading-relaxed">{text}</p>
    </div>
  </div>
);

export const ARTICLE_CONTENT: Record<string, JSX.Element> = {
  "80-20-rule-business-growth": (
    <>
      <IntroBox>
        "Imagine working fewer hours, stressing less — and somehow making more money than before. Sounds too good to be true, right? But thousands of smart business owners do exactly this. And the secret is not some magical app or a lucky break. It's a simple rule discovered over 100 years ago."
      </IntroBox>

      <section>
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-4">The Origin Story</span>
        <H2>A Man, His Garden, and a Rule That Changed Business Forever</H2>
        <P>
          It started in a garden in Italy in the late 1800s. A man named <strong>Vilfredo Pareto</strong> was just walking around his vegetable patch when he noticed something odd. About <strong>20% of his pea pods</strong> were producing roughly <strong>80% of the peas.</strong>
        </P>
        <P>
          He thought that was curious. So he started looking at other things. He checked land ownership in Italy and found that 20% of the population owned 80% of the land. He checked other countries. Same pattern. He checked wealth distribution. Same thing again.
        </P>
        <P>
          Pareto published his findings, and for decades, it sat quietly in academic papers. Then, in the 1940s, a quality management expert named <strong>Joseph Juran</strong> picked it up and applied it to business. He called it the <strong>"Pareto Principle."</strong> Today, the whole world knows it as the <span className="text-white underline decoration-white/20 underline-offset-4 font-bold">80/20 Rule.</span>
        </P>
        <P>
          And here's the thing — it shows up everywhere. Not just in gardens. Not just in Italy. In <em>your</em> business too. Right now. Today.
        </P>
      </section>

      <section className="mt-24">
        <H2>So What Exactly Is the 80/20 Rule?</H2>
        <P>
          In simple terms, the 80/20 Rule says this: <strong>80% of your results come from just 20% of your efforts.</strong>
        </P>
        <P>
          Read that again slowly. Most of what you're doing every day — the meetings, the tasks, the busy work — is producing very little actual result. But a small chunk of what you do? That tiny 20%? That's where almost all the growth, the money, and the real progress comes from.
        </P>

        <StatRow>
          <StatCard big="80%" text="of revenue comes from 20% of customers" />
          <StatCard big="80%" text="of problems come from 20% of clients" />
          <StatCard big="80%" text="of sales come from 20% of products" />
        </StatRow>

        <P>
          Now, this doesn't mean the numbers are always exactly 80 and 20. Sometimes it's 70/30 or even 90/10. The point is not the exact numbers. The point is the <strong>imbalance</strong> — a small number of things drive a massive amount of results.
        </P>
      </section>

      <section className="mt-24">
        <H2>Why Most Business Owners Are Busy but Broke</H2>
        <P>
          Here's a painful truth that nobody likes to say out loud: <strong>being busy is not the same as being productive.</strong>
        </P>
        <P>
          Most business owners fill their day with tasks that feel important but don't actually move the needle. Replying to every email the moment it arrives. Attending every meeting even if it doesn't need them. Fixing small customer complaints that drain time. Trying to do everything themselves instead of delegating.
        </P>

        <div className="bg-zinc-900 border border-white/5 p-12 rounded-[3.5rem] my-16 shadow-[0_30px_60px_rgba(255,255,255,0.02)] relative group">
           <div className="absolute top-6 left-10 text-zinc-800 group-hover:text-zinc-700 transition-colors">
              <Icons.Quote size={40} className="fill-current" />
           </div>
           <blockquote className="relative z-10 text-2xl sm:text-3xl font-black italic tracking-tight leading-tight mb-6 pl-4 text-white">
            "You don't have a time problem. You have a focus problem. The right 20% of actions will do more for your business in one week than the wrong 80% will do in an entire year."
           </blockquote>
           <footer className="pl-4 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">— The Focus Thesis</footer>
        </div>

        <P>
          The business owners who grow fast are not the ones working 16-hour days. They are the ones who have figured out — sometimes by accident, sometimes through hard lessons — which activities actually drive their results. And they do more of those things, and less of everything else.
        </P>
      </section>

      <StoryBlock>
        <H2>Case Study: Doubling Revenue by Doing Less</H2>
        <P>
          Meet Rahul. He runs a small digital marketing agency with 6 employees. For two years, he chased every type of client — small shops, restaurants, freelancers, real estate agents, startups. He worked 14 hours a day and still felt behind.
        </P>
        <P>
          One evening, out of frustration, Rahul looked at his income. <strong>3 out of his 22 clients</strong> were responsible for <strong>nearly 68% of his total revenue.</strong> They were all e-commerce businesses hiring him for the same two specific services: paid ads and email marketing.
        </P>
        <P>
          Rahul made a decision that felt terrifying. He stopped taking on small local shops and focused purely on e-commerce. Within 8 months, his revenue had nearly doubled, his team was less confused, and he was working significantly fewer hours. 
        </P>
        <P className="font-bold text-white mt-4 italic">
            Rahul didn't work harder. He worked on the right 20%.
        </P>
      </StoryBlock>

      <section className="mt-24">
        <H2>How to Find Your 20% — A Simple Exercise</H2>
        <P>
          You don't need to be a big company to use this rule. You can do this today, even if you're a solo entrepreneur.
        </P>
        
        <HighlightBox 
            title="Step 1 — List your customers or clients" 
            items={[
            "Write down every customer from the last 6 months",
            "Next to each name, write how much revenue they brought in",
            "Rank them from highest to lowest",
            "Identify the top 20% and find their common traits (Industry, Age, Problem solve)"
            ]}
        />
        
        <HighlightBox 
            title="Step 2 — Look at your products or services" 
            items={[
            "List every product or service you offer",
            "Write the revenue each one has generated this year",
            "Identify the 2-3 items responsible for most of your income",
            "Evaluate if you are spending most of your time on these or the low-sellers"
            ]}
        />

        <HighlightBox 
            title="Step 3 — Audit your daily tasks" 
            items={[
            "Write down everything you did last week (tasks, meetings)",
            "Ask: 'Did this directly bring in money or growth?'",
            "Identify the 2-3 tasks that actually drove results",
            "Protect these tasks fiercely in your schedule"
            ]}
        />
      </section>

      <section className="mt-24">
        <H2>Your 6 Practical Steps for This Week</H2>
        <div className="grid grid-cols-1 gap-4 mt-8">
            <Step num="1" title="Identify top revenue generators" text="Pull your sales data. Find the customers who bring in the most money with the least friction. These are your gold." />
            <Step num="2" title="Cut low-performing offerings" text="If a service hasn't sold in 6 months, it's stealing your attention. Drop it or reduce focus. Be ruthless." />
            <Step num="3" title="Protect top 3 activities daily" text="Figure out which 3 activities actually drive growth. Block time for these first every morning, before anything else." />
            <Step num="4" title="Delegate or automate" text="If a task can be done by someone else or software, hand it off. Reserve your time for what only you can do." />
            <Step num="5" title="Learn to say no" text="Every time you say yes to a low-value project, you say no to something better. Let go of the 80% that doesn't serve you." />
            <Step num="6" title="Review monthly" text="Your business changes. Set a recurring monthly reminder to re-identify your top 20%. Stay sharp." />
        </div>
      </section>

      <section className="mt-24">
        <H2>The 3 Biggest Mistakes People Make</H2>
        <div className="space-y-8">
            <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl">
                <h4 className="text-white font-bold mb-3 flex items-center gap-3">
                    <Icons.AlertCircle className="text-zinc-500" size={18} />
                    Knowing it but not acting on it
                </h4>
                <p className="text-zinc-500 text-sm leading-relaxed">
                    Most people read about the 80/20 Rule and agree, but then go right back to their busy routine. Understanding it is not enough; you must reorganize how you spend your time.
                </p>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl">
                <h4 className="text-white font-bold mb-3 flex items-center gap-3">
                    <Icons.AlertCircle className="text-zinc-500" size={18} />
                    Applying it once and forgetting
                </h4>
                <p className="text-zinc-500 text-sm leading-relaxed">
                    The 80/20 Rule is not a one-time fix. It's an ongoing way of thinking. You need to keep asking: "Am I focused on the right things right now?"
                </p>
            </div>
            <div className="bg-zinc-900 border border-white/5 p-8 rounded-3xl">
                <h4 className="text-white font-bold mb-3 flex items-center gap-3">
                    <Icons.AlertCircle className="text-zinc-500" size={18} />
                    Thinking it means abandoning everyone else
                </h4>
                <p className="text-zinc-500 text-sm leading-relaxed">
                    You don't have to fire all smaller customers overnight. It just means you stop letting them consume disproportionate energy. Serve them efficiently, but invest best energy in the top 20%.
                </p>
            </div>
        </div>
      </section>

      <div className="bg-zinc-900 border border-white/5 p-10 sm:p-14 rounded-[3rem] mt-24 text-center relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:30px_30px]" />
        </div>
        <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight leading-tight">Less Is More — When You Choose the Right Less</h3>
        <div className="relative z-10 max-w-xl mx-auto space-y-5">
            <p className="text-white text-lg font-bold leading-relaxed">
                You are not short on time. You are short on focus.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
                The successful business owners you admire are not superhuman. They have simply learned that a few key things drive almost all of their results. They protect those things like their life depends on it.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
                The answer isn't out there. It's inside your own business — hiding in plain sight, waiting for you to see it.
            </p>
            <div className="pt-6">
                <p className="text-white font-bold italic text-xl tracking-tight leading-snug group-hover:text-zinc-300 transition-colors duration-500">
                    "Stop trying to do more things. Start doing the right things more. That single shift will take you further in one year than a decade of being busy ever could."
                </p>
            </div>
        </div>
      </div>
    </>
  ),
  "why-most-business-plans-fail": (
    <>
      <IntroBox>
        "Most people who start a business sit down one day, open a blank document, and start writing a business plan. They spend days on it. Sometimes weeks. They write about the market size, the competition, the five-year revenue projections, the organizational structure. And then? They never look at it again."
      </IntroBox>

      <P>
        Sound familiar? You are not alone. This happens to the majority of entrepreneurs around the world — from first-time business owners to experienced founders starting something new. The business plan gets written, filed away, and the real world takes over.
      </P>
      <P>
        But here&apos;s the bigger problem. It&apos;s not just that people don&apos;t follow their plan. It&apos;s that the plan itself was built on the wrong foundation from the very beginning. And that&apos;s exactly what we&apos;re going to fix today.
      </P>

      <H2>The Honest Truth About Traditional Business Plans</H2>
      <P>
        Let&apos;s be real for a moment. The traditional business plan was designed for one purpose — to impress a bank or an investor so they would give you money. That&apos;s it. It was never really designed to help you actually run and grow a business.
      </P>
      <P>
        Think about it. A traditional business plan asks you to predict exactly how much money you&apos;ll make in year one, year two, and year three. But how can you predict that before you&apos;ve even spoken to a single customer? How do you know your pricing is right before anyone has paid you? How do you know your product is what people want before a single person has used it?
      </P>
      <P>
        You don&apos;t. And deep down, every honest entrepreneur knows this.
      </P>
      <P>
        The numbers in most business plans are not based on real data. They are based on hope. On guesses. On what sounds good on paper. And when the real world shows up — which it always does — those numbers fall apart fast.
      </P>

      <H2>Why Business Plans Fail — The Real Reasons</H2>
      <P>
        There are three core reasons why most business plans fail. Not one. Not two. Three. And they work together to make sure the plan becomes useless almost immediately after it&apos;s written.
      </P>
      <UL>
        <LI><strong>They are built on assumptions, not reality.</strong> When you write a business plan before testing your idea, every single number and prediction is an assumption. Assumptions are not facts. And businesses run on facts.</LI>
        <LI><strong>They don&apos;t account for change.</strong> The world moves fast. A rigid business plan written in January has no way of handling what March brings. Most plans have no built-in system for adapting.</LI>
        <LI><strong>They are written to satisfy someone else.</strong> Written to get a loan. Written to show a partner. When something is written for someone else, it doesn&apos;t reflect what you actually believe. That&apos;s a performance, not a plan.</LI>
      </UL>

      <StoryBlock>
        <H2>The Story of Two Founders</H2>
        <P>
          The first founder — <strong>Arjun</strong> — spent three months writing a detailed 40-page business plan. He launched six months later, after his plan was &quot;perfect.&quot; Within four months, three of his core assumptions had turned out to be wrong. He went back to his 40-page plan. It had no answers. He felt lost.
        </P>
        <P>
          The second founder — <strong>Meera</strong> — spent three days writing a living document. One page. Clear problem, clear solution, clear customer, clear first step. She launched in three weeks. When something didn&apos;t work, she changed it. Her one-page document got updated every two weeks. It stayed useful because it stayed real.
        </P>
        <P className="font-bold text-white mt-4 italic">
            Two years later, Meera&apos;s business was profitable and growing. Arjun had pivoted twice and was still trying to find his footing.
        </P>
      </StoryBlock>

      <H2>What to Write Instead — The Living Business Document</H2>
      <P>
        So if not a traditional business plan, then what? The answer is something far simpler, far more honest, and far more useful. Call it a Living Business Document. It has five parts.
      </P>

      <div className="space-y-4 mt-8">
        <Step num="1" title="The Problem You Are Solving" text="Write one clear paragraph about the specific pain or problem your customer has. Something real and felt that your ideal customer loses sleep over." />
        <Step num="2" title="Your Solution and Why It's Different" text="Describe what you offer and why it's different. Different is a fact; better is an opinion. Different gives people a reason to choose you." />
        <Step num="3" title="Your Ideal Customer" text="Describe one specific person. When you write for one person, you speak to thousands. When you write for everyone, you speak to no one." />
        <Step num="4" title="Your First 90 Days" text="What are the three things you need to prove in the next 90 days? Keep it ruthlessly simple. Three goals. Ninety days. That's it." />
        <Step num="5" title="How You Make Money" text="Write it plainly. What exactly do you sell, what is the price, and how many do you need to sell each month to cover your costs and pay yourself?" />
      </div>

      <H2>The Most Important Rule</H2>
      <P>
        The most important rule is that this document must be updated regularly. At minimum, once a month. Ideally every two weeks.
      </P>
      <P>
        Every time something changes — a customer tells you something surprising, a price needs adjusting — you update the document. You cross things out. You rewrite the customer description when you learn more about who&apos;s actually buying.
      </P>
      <P className="italic text-white">
        &quot;A business plan is a photograph. A living business document is a mirror. One shows you what you imagined. The other shows you what&apos;s actually there.&quot;
      </P>

      <H2>What About Getting a Loan or Investment?</H2>
      <P>
        What if a bank or investor actually does ask for a formal business plan? Write one. But write it second, not first.
      </P>
      <P>
        Build your living business document, test your idea, get real results, and then turn that real data into a formal document. Now your projections aren&apos;t guesses — they&apos;re based on actual results. Investors and good bank managers can tell the difference immediately.
      </P>

      <HighlightBox 
        title="Three Questions to Ask Before You Write"
        items={[
          "Have I spoken to at least ten real potential customers (strangers) about this?",
          "Do I know what success looks like in 90 days?",
          "Am I writing this for myself or for someone else?"
        ]}
      />

      <H2>The Bottom Line</H2>
      <P>
        A business plan that sits in a drawer helps no one. A living document that sits on your desk, gets marked up, argued with, updated, and questioned — that&apos;s the thing that actually builds a business.
      </P>
      <P>
        Stop trying to predict the future in a document. Start trying to understand your present reality as clearly as possible. The best businesses in the world were built by people who stayed honest about what was working and stayed flexible enough to change.
      </P>

      <div className="bg-zinc-900 border border-white/5 p-10 sm:p-14 rounded-[3rem] mt-24 text-center relative overflow-hidden group hover:border-white/10 transition-colors">
        <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight leading-tight italic">
            &quot;Be that kind of business owner. Write that kind of document. And watch how much faster things start to move.&quot;
        </h3>
      </div>
    </>
  ),
  "get-first-100-customers-without-ads": (
    <>
      <IntroBox>
        "Your first 100 customers will not come from ads. They will come from something far more powerful, far more personal, and completely free: genuine human connection."
      </IntroBox>

      <P>
        Every new business owner faces the same terrifying moment. The product is ready. The service is set up. The website is live. And then comes the silence.
      </P>
      <P>
        No orders. No inquiries. No customers.
      </P>
      <P>
        Most people&apos;s first instinct at this point is to run ads. Spend money on Google. Boost a post on Instagram. Try Facebook ads. And within days, they&apos;ve spent thousands of rupees — or dollars — and gotten almost nothing in return.
      </P>
      <P>
        Here&apos;s the truth that most marketing gurus won&apos;t tell you: paid ads almost never work for a brand new business with no track record, no reviews, and no trust built up yet. People don&apos;t buy from strangers. They buy from people and brands they feel they already know. And ads, by nature, come from strangers.
      </P>

      <H2>Why the First 100 Customers Are So Special</H2>
      <P>
        Before we get into the how, let&apos;s talk about the why. Why does the number 100 matter so much?
      </P>
      <P>
        Because 100 real customers changes everything about your business. It gives you proof that people want what you&apos;re selling. It gives you stories and testimonials you can use to attract more customers. It gives you feedback that makes your product or service dramatically better. It gives you confidence that this is real, this is working, and this is worth pushing forward.
      </P>
      <P>
        Most businesses that fail, fail before they ever reach 100 customers. Not because their idea was bad. But because they gave up too soon, or spent all their money on ads and ran out of runway before the business had a chance to breathe.
      </P>
      <P>
        Get to 100 customers and you have a foundation. You have data. You have momentum. Everything after 100 is easier than everything before it.
      </P>

      <H2>Start With the People Already Around You</H2>
      <P>
        This sounds almost too simple. But it works every single time, and almost every successful business owner will tell you their first customers came from their existing circle.
      </P>
      <P>
        Write down every person you know. Friends. Family. Former colleagues. Old classmates. Neighbors. People you went to school with. People you&apos;ve worked with at any point in your life. People you know from your gym, your place of worship, your local community group.
      </P>
      <P>
        Now go through that list and ask yourself: who on this list, or who do they know, that could benefit from what I&apos;m offering?
      </P>
      <P>
        You are not asking them to do you a favor. You are not begging. You are simply letting people who already trust you know that you have something valuable to offer. Tell them clearly what you do, who it helps, and what problem it solves. Then ask if they know anyone who might need it.
      </P>
      <StoryBlock>
        Most people skip this step because it feels uncomfortable. It feels like mixing business with personal relationships. But think about it from the other side. If your friend started a restaurant and never told you, and you found out later, you&apos;d be a little hurt, wouldn&apos;t you? People who care about you want to support you. Let them.
      </StoryBlock>

      <H2>The Power of One-on-One Conversations</H2>
      <P>
        Here is something that almost no business course teaches but every experienced entrepreneur knows: nothing converts a potential customer faster than a real, genuine, one-on-one conversation.
      </P>
      <P>
        Not a post. Not an email blast. Not a flyer. A conversation.
      </P>
      <P>
        In the early days of your business, your most important job is not marketing. It is talking to people. Every single day, you should be having at least two or three real conversations with people who might be your ideal customer. Not a sales pitch. A conversation.
      </P>
      <UL>
        <LI>Ask them about their life.</LI>
        <LI>Ask them about the problem your business solves.</LI>
        <LI>Ask them how they currently deal with it.</LI>
        <LI>Ask them what they wish existed.</LI>
      </UL>
      <P>
        Listen more than you talk. And when the moment feels right, tell them what you do and ask if they&apos;d like to try it. This approach feels slow. It feels like it doesn&apos;t scale. But here&apos;s the secret — it works with a near 100% reliability that no ad campaign in the world can match.
      </P>

      <H2>Use WhatsApp and Social Media the Right Way</H2>
      <P>
        Most people use social media to broadcast. They post about their product, their offer, their discount, their launch. And they wonder why nobody responds. Social media was built for connection, not broadcasting.
      </P>
      <P>
        Post your story. Not your product — your story. Why did you start this? What problem did you personally face that led you to build this business? People connect with people, not products. When you share your genuine story, people lean in.
      </P>
      <P>
        Then post about the problem you solve. Educate your audience. When you teach people something valuable, they start to see you as an expert. And people buy from experts they trust.
      </P>
      <HighlightBox 
        title="Making the First Step Easy"
        items={[
          "Offer something small and low risk first",
          "A free consultation, trial, or small starter pack",
          "Give away a free guide to build authority",
          "Serve them so well that the bigger step feels natural"
        ]}
      />

      <H2>The Magic of Referrals</H2>
      <P>
        A referral is when someone who already knows and trusts you tells someone else about your business. And here is what makes referrals so powerful: <strong>the trust transfers.</strong>
      </P>
      <P>
        For a new business, referrals are everything. But here is the mistake most people make — they wait for referrals to happen naturally. They hope satisfied customers will spread the word.
      </P>
      <P>
        So ask. After every successful transaction, after every happy customer interaction, say these words: <span className="text-white italic">&quot;I&apos;m really glad this helped you. I&apos;m still in the early stages of growing my business and referrals mean the world to me. If you know anyone who might benefit from this, I would be so grateful if you could mention me to them.&quot;</span>
      </P>

      <H2>Find Where Your Customers Already Gather</H2>
      <P>
        Every type of customer has places they gather. Online communities. Local events. Industry meetups. WhatsApp groups. Facebook groups. Marketplaces.
      </P>
      <P>
        Your job in the early days is to find those places and show up there — not to sell, but to genuinely participate. Contribute. Answer questions. Share useful information. Become a known, trusted voice in that community.
      </P>

      <H2>Partner With People Who Already Have Your Customers</H2>
      <P>
        This is one of the most underused strategies. Who else serves your ideal customer but does not compete with you directly?
      </P>
      <StatRow>
        <StatCard icon={Dumbbell} big="Gyms" text="Partner with Healthy Meal Plans" />
        <StatCard icon={Users} big="Coaches" text="Partner with Bookkeeping Services" />
        <StatCard icon={GraduationCap} big="Schools" text="Partner with Educational Materials" />
      </StatRow>
      <P>
        Approach those people or businesses with a simple, genuine proposal. Tell them what you do and who you serve. Ask if there is a way to collaborate that would benefit both of you.
      </P>

      <H2>Give People a Reason to Talk About You</H2>
      <P>
        Do something so good, so surprising, or so thoughtful that your customers feel compelled to tell someone else about it.
      </P>
      <UL>
        <LI>Write a handwritten thank-you note with every order.</LI>
        <LI>Follow up two days after a purchase to ask if everything was good.</LI>
        <LI>Remember a customer&apos;s name and their specific preference.</LI>
        <LI>Solve a problem so fast and so well that they can&apos;t believe it.</LI>
      </UL>

      <H2>Track Every Single Lead and Follow Up Relentlessly</H2>
      <P>
        Research consistently shows that most buying decisions happen after <strong>five to eight touchpoints</strong>.
      </P>
      <P>
        When someone shows interest, don&apos;t give up after one follow-up. Keep a simple list of every person who has shown any interest. Follow up with them warmly, helpfully, and consistently. Send them a useful article. Share a success story. Just check in.
      </P>

      <H2>The Mindset That Gets You to 100</H2>
      <P>
        There will be days when you hear nothing back. Those moments are normal. Every single business owner who has ever reached 100 customers has had those days.
      </P>
      <P>
        Keep having conversations. Keep showing up. Keep improving based on feedback. Keep asking for referrals. The customers will come. They always come to the business owner who refuses to stop showing up.
      </P>

      <H2>The Bottom Line</H2>
      <P>
        This is not the fast way. But it is the right way. Because every customer you earn through genuine connection is a customer who stays longer, spends more, and brings others with them.
      </P>

      <div className="bg-zinc-900 border border-white/5 p-10 sm:p-14 rounded-[3rem] mt-24 text-center relative overflow-hidden group hover:border-white/10 transition-colors">
        <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight leading-tight">
            One customer at a time. One conversation at a time.
        </h3>
        <P className="max-w-xl mx-auto text-zinc-400">
            Start today. Write your list. Have two conversations before tonight. That&apos;s how every great business begins.
        </P>
      </div>
    </>
  ),
  "thinking-like-a-ceo-decision-frameworks": (
    <>
      <IntroBox>
        "Successful leaders don't just work harder; they think differently. Discover the structured mental models that top CEOs use to cut through noise and make high-stakes decisions with confidence."
      </IntroBox>

      <P>
        Most people look at successful CEOs and think the secret is intelligence. Or connections. Or luck. Or being in the right place at the right time.
      </P>

      <P>
        But spend enough time studying the world's best business leaders — the ones who built companies from nothing, who navigated crises that would have destroyed lesser organizations, who made bold moves that looked crazy at the time and genius in hindsight — and you start to notice something different.
      </P>

      <P>
        It's not that they're smarter than everyone else. It's that they think differently. Specifically, they make decisions differently.
      </P>

      <P>
        The average person makes decisions based on emotion, habit, or what feels comfortable in the moment. A CEO who lasts, who builds something real and lasting, makes decisions based on frameworks. Structured ways of thinking that cut through noise, reduce emotion, and consistently lead to better outcomes.
      </P>

      <P>
        The good news? These frameworks are not secret. They are not locked away in expensive MBA programs or private boardrooms. They are learnable. And once you learn them, you will never make a major business decision the same way again.
      </P>

      <H2>Why Most People Make Bad Business Decisions</H2>
      <P>
        Before we get into the frameworks, let's understand why most people make poor decisions in business. Not because they are unintelligent. But because of the way the human brain is built.
      </P>

      <P>
        Our brains are wired for survival, not strategy. When faced with a difficult decision, the brain defaults to fear, familiarity, and shortcuts. It looks for the option that feels safest, not the option that is actually best. It looks for patterns from the past — even when the current situation is completely different. It avoids uncertainty even when uncertainty is where all the growth lives.
      </P>

      <StoryBlock>
        A decision-making framework does one powerful thing. It creates a small pause between the situation and your response. In that pause, your rational brain gets a chance to override your emotional brain. And in business, that pause is often worth millions.
      </StoryBlock>

      <H2>Framework One — The 10/10/10 Rule</H2>
      <P>
        This is one of the simplest and most powerful frameworks for any business decision, big or small. It was popularized by author Suzy Welch, and once you start using it, you will find yourself reaching for it constantly.
      </P>

      <P>
        The rule is this. When you face a decision, ask yourself three questions:
      </P>

      <HighlightBox 
        title="The Three Questions"
        items={[
          "How will I feel about this decision ten minutes from now?",
          "How will I feel about this decision ten months from now?",
          "How will I feel about this decision ten years from now?"
        ]}
      />

      <P>
        Here's why it works so well. Most bad business decisions look good in the ten-minute view and terrible in the ten-year view. Avoiding a difficult conversation with a bad employee feels like relief in ten minutes. Ten months later, the whole team's morale has suffered. Ten years later, you realize you built a culture of avoiding hard truths.
      </P>

      <H2>Framework Two — First Principles Thinking</H2>
      <P>
        This is the framework most associated with Elon Musk, though it has roots going back to the ancient Greek philosopher Aristotle. It sounds complicated. It is actually beautifully simple.
      </P>

      <P>
        First principles thinking means stripping a problem or decision down to its most basic, fundamental truths — and then building your thinking back up from there. Instead of reasoning by analogy — doing something because that's how it's always been done, or because a competitor does it that way — you reason from the ground up.
      </P>

      <HighlightBox 
        title="Checklist for First Principles"
        items={[
          "Bypass the 'industry standard' explanation.",
          "Identify the core physical or logical constraints.",
          "Build a solution based on these core truths alone.",
          "Ask: If no one had ever done this before, how would I do it?"
        ]}
      />

      <H2>Framework Three — The Eisenhower Matrix</H2>
      <P>
        Dwight D. Eisenhower once said something that became the foundation of one of the most useful decision-making tools in business: "What is important is seldom urgent, and what is urgent is seldom important."
      </P>

      <StatRow>
         <StatCard big="Q1" text="Urgent & Important (Do Now)" icon={Icons.AlertCircle} />
         <StatCard big="Q2" text="Important, Not Urgent (Schedule)" icon={Icons.Target} />
         <StatCard big="Q3" text="Urgent, Not Important (Delegate)" icon={Icons.Users} />
      </StatRow>

      <P>
        The reason most business owners feel overwhelmed and stuck is that they spend the majority of their time in boxes one, three, and four. They are constantly reacting, constantly firefighting, constantly busy with things that don't matter.
      </P>
      <P>
        CEOs who build great companies protect their box two time with fierce discipline. Because box two is where the future is built.
      </P>

      <H2>Framework Four — The Pre-Mortem</H2>
      <P>
        The pre-mortem flips this completely. It was developed by psychologist Gary Klein and has been adopted by leaders at companies like Google, Amazon, and hundreds of successful startups.
      </P>

      <HighlightBox 
        title="How to run a Pre-Mortem"
        items={[
          "Imagine it is one year from today and the project failed.",
          "Write down every possible reason why it went wrong.",
          "Sort the reasons by likelihood and severity.",
          "Create mitigation plans for the top 3 risks."
        ]}
      />

      <H2>Framework Five — The Regret Minimization Framework</H2>
      <P>
        Jeff Bezos projected himself forward to age eighty, sitting in a rocking chair, looking back on his life. From that vantage point, he would ask one question: which choice would I regret more?
      </P>

      <P>
        This framework is particularly powerful for the big decisions. The ones where fear and logic and practicality all seem to argue for the safe path. In those moments, the regret minimization framework cuts through all of that noise.
      </P>

      <H2>Framework Six — The Two-Way Door Test</H2>
      <P>
        Before agonizing over a decision, ask yourself one question: is this a one-way door or a two-way door?
      </P>

      <UL>
          <LI><strong>One-Way Door:</strong> Irreversible. Selling your company, signing a 5-year lease. Go slow.</LI>
          <LI><strong>Two-Way Door:</strong> Reversible. Pricing changes, marketing tests. Go fast.</LI>
      </UL>

      <H2>The Bottom Line</H2>
      <P>
        Thinking like a CEO is not about having a title. It is not about having a corner office or a team of hundreds. It is about developing the mental discipline to make better decisions, more consistently, under pressure.
      </P>

      <P>
        Start small. Pick one framework. Apply it today. And over time, as these ways of thinking become habit, you will notice something changing — not just in your business, but in the clarity and confidence with which you move through challenges.
      </P>

      <div className="bg-zinc-900 border border-white/5 p-10 sm:p-14 rounded-[3rem] mt-24 text-center relative overflow-hidden group hover:border-white/10 transition-colors">
        <h3 className="relative z-10 text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight leading-tight">
            The quality of your decisions determines the quality of your life.
        </h3>
        <P className="max-w-xl mx-auto text-zinc-400">
            Thinking like a CEO is a practice, not a destination. Start using these models today and build the future you envision.
        </P>
      </div>
    </>
  ),
};
