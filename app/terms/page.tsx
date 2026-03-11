import Container from "@/components/Container";
import { Scale } from "lucide-react";

export const metadata = {
    title: "Terms of Service",
};

export default function TermsPage() {
    return (
        <div className="py-20 bg-black min-h-screen">
            <Container>
                <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-6">
                        <Scale size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Legal Agreement</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white">Terms of Service</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            
                            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">1. Acceptance of Terms</h2>
                                <p>
                                    By accessing and using AssetNest, you agree to comply with and be bound by these Terms of Service. AssetNest provides completely free tools and resources. If you do not agree to these terms, please refrain from using our platform.
                                </p>
                            </section>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">2. No Accounts Required</h2>
                                    <p>
                                        AssetNest is designed to be completely open and accessible. We do not require users to create accounts, sign up, or provide personal information to use any of our core tools or download our free assets.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">3. Intellectual Property</h2>
                                    <p>
                                        All content on AssetNest, including logos, text, and graphics, is the property of AssetNest or its licensors and is protected by intellectual property laws.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">4. Prohibited Conduct</h2>
                                    <p>
                                        Users are prohibited from using the platform for any unlawful purpose, attempting to gain unauthorized access, or interfering with the site's functionality.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">5. Limitation of Liability</h2>
                                    <p>
                                        AssetNest shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services or assets.
                                    </p>
                                </section>
                            </div>

                            <div className="mt-12 pt-8 border-t border-zinc-900">
                                <p className="text-sm italic text-zinc-500">
                                    Last updated: March 10, 2026. AssetNest reserves the right to modify these terms at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
