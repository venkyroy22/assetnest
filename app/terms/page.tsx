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
                                    By accessing and using AssetNest, you agree to be bound by these Terms of Service. AssetNest provides a suite of free web-based utilities and creative resources. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                                </p>
                            </section>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">2. Use License</h2>
                                    <p>
                                        Permission is granted to use AssetNest's tools for personal or commercial creative projects. This is the grant of a license, not a transfer of title. You may not attempt to decompile or reverse engineer any software contained on the AssetNest website.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">3. Local Execution</h2>
                                    <p>
                                        Most AssetNest tools process data directly in your browser. While we strive for 100% accuracy, we are not responsible for any data loss, file corruption, or formatting errors that occur during local processing.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">4. Disclaimers</h2>
                                    <p>
                                        The materials on AssetNest are provided on an 'as is' basis. AssetNest makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties of merchantability.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">5. Limitations</h2>
                                    <p>
                                        In no event shall AssetNest or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the tools on AssetNest.
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
