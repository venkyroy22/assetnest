import Container from "@/components/Container";
import { AlertCircle } from "lucide-react";

export const metadata = {
    title: "Legal Disclaimer",
};

export default function DisclaimerPage() {
    return (
        <div className="py-20 bg-black min-h-screen">
            <Container>
                <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-12">
                        <AlertCircle size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Legal Information</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white">Legal Disclaimer</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">1. Asset Ownership</h2>
                                <p className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 text-zinc-400">
                                    The tools provided on AssetNest are completely free to use. The design assets provided are either created by our in-house designers, licensed for redistribution, or curated from public sources with appropriate permissions.
                                    We do not claim ownership of any third-party brand names, logos, or software mentioned or depicted in our resources.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">2. Licensing & Usage</h2>
                                <p className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 text-zinc-400">
                                    All tools are free to use. Each digital asset comes with its own license agreement which is usually included in the download file or outlined on the asset page.
                                    Users are solely responsible for reviewing and adhering to the specific terms of use for each individual resource.
                                    AssetNest is NOT liable for any legal issues arising from the misuse of downloaded assets or the tools provided.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">3. No Warranties</h2>
                                <p className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 text-zinc-400">
                                    All resources and tools are provided &quot;as-is&quot; without any warranties of any kind, whether express or implied.
                                    While we strive for high quality, we do not guarantee that every asset will be error-free or compatible with all versions of creative software.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">4. External Links</h2>
                                <p className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 text-zinc-400">
                                    Our website may contain links to external tools and resources (e.g., cloud storage for downloads, or strategic partner sites).
                                    We have no control over the content, privacy policies, or practices of these third-party services and cannot be held responsible for them.
                                </p>
                            </section>

                            <div className="mt-12 pt-8 border-t border-zinc-900">
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
