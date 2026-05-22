import Container from "@/components/Container";
import { Info } from "lucide-react";

export const metadata = {
    title: "About AssetNest – Free Creative Tools & Resources",
    description: "Learn about AssetNest, the 100% free suite of design tools and curated resources for creators, designers, and developers.",
};

export default function AboutPage() {
    return (
        <div className="py-20 min-h-screen" style={{ background: "#141414" }}>
            <Container>
                <div className="max-w-4xl mx-auto bg-[#1c1c1c] border border-white/[0.05] rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-12">
                        <Info size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Discover</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-[#f0ede8]">About AssetNest</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06]">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">Our Mission</h2>
                                <p>
                                    At AssetNest, we believe that high-quality creative tools should be accessible to everyone without cost. Our mission is to provide a curated suite of powerful, browser-based utilities that help designers, marketers, and developers streamline their workflows without the need for complex software or monthly subscriptions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">What We Do</h2>
                                <p className="mb-4">
                                    We build precision tools for modern creators. From our advanced PDF suite and image optimization utilities to our premium AI prompting gallery, every feature on AssetNest is engineered for speed and privacy. We focus on "Local Processing"—meaning your sensitive files never leave your computer.
                                </p>
                                <p>
                                    Whether you're compressing images for a website, merging PDFs for a client, or looking for cinematic AI inspiration, AssetNest is built to be your reliable, lightweight creative companion.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-6">Why AssetNest?</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                        <div className="text-[#f0ede8] font-bold mb-2">Browser-Only</div>
                                        <div className="text-[14px] sm:text-[15px]">No apps to install. Our tools run directly in your favorite web browser.</div>
                                    </div>
                                    <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                        <div className="text-[#f0ede8] font-bold mb-2">Privacy First</div>
                                        <div className="text-[14px] sm:text-[15px]">Since processing happens locally, your data stays under your control at all times.</div>
                                    </div>
                                    <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                        <div className="text-[#f0ede8] font-bold mb-2">Free Forever</div>
                                        <div className="text-[14px] sm:text-[15px]">We provide essential utilities at no cost to help the creator community thrive.</div>
                                    </div>
                                    <div className="bg-[#1c1c1c]/40 p-6 rounded-3xl border border-white/[0.06] hover:border-white/[0.12] transition-colors">
                                        <div className="text-[#f0ede8] font-bold mb-2">Clean UI</div>
                                        <div className="text-[14px] sm:text-[15px]">Zero clutter. Minimalist designs focused purely on getting the job done fast.</div>
                                    </div>
                                </div>
                            </section>

                            <div className="mt-12 pt-8 border-t border-white/[0.05]">
                                <p className="text-sm italic text-zinc-500">
                                    Efficiency. Privacy. Creativity. Welcome to AssetNest.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
