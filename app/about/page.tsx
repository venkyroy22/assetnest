import Container from "@/components/Container";
import { Info } from "lucide-react";

export const metadata = {
    title: "About AssetNest – Free Creative Tools & Assets",
    description: "Learn about AssetNest, the 100% free suite of design tools and curated assets for creators, designers, and developers.",
};

export default function AboutPage() {
    return (
        <div className="py-20 bg-black min-h-screen">
            <Container>
                <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-12">
                        <Info size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Discover</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white">About AssetNest</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">Our Mission</h2>
                                <p>
                                    At AssetNest, we believe that creativity shouldn't be gated by expensive subscriptions or complex tools. Our mission is to provide creators, designers, and developers with a powerful, completely free suite of online tools and high-quality resources to accelerate their workflows.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">What We Do</h2>
                                <p className="mb-4">
                                    We meticulously build and curate tools that solve real problems. From advanced image cropping and compression to productivity timers and typing speed testers, every tool on AssetNest is designed with performance, privacy, and ease-of-use in mind. No paywalls, no hidden fees, just pure utility.
                                </p>
                                <p>
                                    In addition to our tools, we curate high-quality assets, templates, and guides designed specifically to help modern creatives thrive in an increasingly competitive digital landscape.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6">Why AssetNest?</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                        <div className="text-white font-bold mb-2">100% Free</div>
                                        <div className="text-[14px] sm:text-[15px]">No premium tiers, no paywalls. Everything is accessible.</div>
                                    </div>
                                    <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                        <div className="text-white font-bold mb-2">Privacy First</div>
                                        <div className="text-[14px] sm:text-[15px]">Our tools primarily run perfectly in your browser, meaning your files never even hit a server.</div>
                                    </div>
                                    <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                        <div className="text-white font-bold mb-2">Constantly Growing</div>
                                        <div className="text-[14px] sm:text-[15px]">We are continuously adding new tools and resources based on what creators actually need.</div>
                                    </div>
                                    <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                                        <div className="text-white font-bold mb-2">Zero Clutter</div>
                                        <div className="text-[14px] sm:text-[15px]">Minimal, aesthetic interfaces focused purely on getting the job done fast.</div>
                                    </div>
                                </div>
                            </section>

                            <div className="mt-12 pt-8 border-t border-zinc-900">
                                <p className="text-sm italic text-zinc-500">
                                    Stay inspired and keep creating. Welcome to your ultimate asset nest.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
