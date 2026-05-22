import Container from "@/components/Container";
import { AlertCircle } from "lucide-react";

export const metadata = {
    title: "Legal Disclaimer",
};

export default function DisclaimerPage() {
    return (
        <div className="py-20 min-h-screen" style={{ background: "#141414" }}>
            <Container>
                <div className="max-w-4xl mx-auto bg-[#1c1c1c] border border-white/[0.05] rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-12">
                        <AlertCircle size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Legal Information</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-[#f0ede8]">Legal Disclaimer</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">1. Tool Reliability</h2>
                                <p className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] text-zinc-400">
                                    The utilities provided on AssetNest (Image Compressor, PDF Tools, QR Generator, etc.) are provided for convenience and are intended to assist in creative workflows. While we strive for high precision, we do not guarantee that the results will be 100% error-free or suitable for every professional requirement. Users should always verify important files (such as legal PDF merges or critical image conversions) after processing.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">2. Intellectual Property</h2>
                                <p className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] text-zinc-400">
                                    AssetNest provides tools and curated prompts. We do not claim ownership of the images you process or the content you generate using our tools. Any logos, brand names, or third-party trademarks mentioned on the site are the property of their respective owners and are used here for descriptive or illustrative purposes only.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">3. No Professional Advice</h2>
                                <p className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06] text-zinc-400">
                                    The information and tools on AssetNest do not constitute professional, legal, or financial advice. We are not liable for any business decisions, legal complications, or financial losses resulting from the use of our browser-based utilities.
                                </p>
                            </section>



                            <div className="mt-12 pt-8 border-t border-white/[0.05]">
                                <p className="text-sm italic text-zinc-500">
                                    Last updated: March 10, 2026. AssetNest reserves the right to modify this disclaimer at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
