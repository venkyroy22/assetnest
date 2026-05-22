import Container from "@/components/Container";
import { ShieldAlert } from "lucide-react";

export const metadata = {
    title: "Privacy Policy",
};

export default function PrivacyPage() {
    return (
        <div className="py-20 min-h-screen" style={{ background: "#141414" }}>
            <Container>
                <div className="max-w-4xl mx-auto bg-[#1c1c1c] border border-white/[0.05] rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none -rotate-12">
                        <ShieldAlert size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/[0.07] bg-[#1e1e1e]/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Data & Privacy</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-[#f0ede8]">Privacy Policy</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">1. Local Processing & Data Collection</h2>
                                <p className="leading-relaxed">
                                    Our primary design philosophy is **Privacy by Default**. Most of our tools (including PDF Merger, Image Compressor, and QR Generator) run entirely in your local web browser using client-side technologies. This means your images, PDF documents, and personal files **never leave your device** and are never uploaded to our servers.
                                </p>
                                <p className="mt-4 leading-relaxed">
                                    We do not collect personal identification information unless you voluntarily contact us via email. Any anonymous technical data (e.g., browser type, page views) is collected to ensure site stability and performance.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">2. Use of Information</h2>
                                <p className="leading-relaxed">
                                    Any anonymous data collected is used strictly to optimize the user experience and maintain the health of our platform. We do not sell, trade, or rent user data to third parties.
                                </p>
                            </section>

                            <section className="bg-[#1c1c1c]/30 p-6 sm:p-8 rounded-3xl border border-white/[0.06]">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">3. Cookies & Advertising</h2>
                                <p className="mb-6 leading-relaxed">
                                    We use cookies to understand site traffic and to serve advertisements through Google AdSense. 
                                </p>
                                <div className="space-y-6 text-[14px] sm:text-[15px] bg-[#141414]/40 p-6 rounded-2xl border border-white/[0.07]/30">
                                    <p className="leading-relaxed">
                                        <strong className="text-[#f0ede8] block mb-2 text-base">Google AdSense</strong> Google, as a third-party vendor, uses cookies to serve ads on AssetNest. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
                                    </p>
                                    <p className="leading-relaxed">
                                        <strong className="text-[#f0ede8] block mb-2 text-base">Opt-Out</strong> Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#f0ede8] hover:text-[#f0ede8] hover:underline transition-all">Google Ad Settings</a>.
                                    </p>
                                </div>
                            </section>



                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-[#f0ede8] mb-4">4. Third-Party Services</h2>
                                <p className="leading-relaxed">
                                    We only engage with third-party vendors for advertising (e.g., Google AdSense). We explicitly do not use external file hosting services, as all document and image processing occurs securely and locally on your device.
                                </p>
                            </section>

                            <div className="mt-12 pt-8 border-t border-white/[0.05]">
                                <p className="text-sm italic text-zinc-500">
                                    Last updated: March 10, 2026. AssetNest reserves the right to update this policy as needed.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
