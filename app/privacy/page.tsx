import Container from "@/components/Container";
import { ShieldAlert } from "lucide-react";

export const metadata = {
    title: "Privacy Policy",
};

export default function PrivacyPage() {
    return (
        <div className="py-20 bg-black min-h-screen">
            <Container>
                <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none -rotate-12">
                        <ShieldAlert size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Data & Privacy</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white">Privacy Policy</h1>

                        <div className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px]">
                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">1. Data Collection</h2>
                                <p className="leading-relaxed">
                                    We collect the minimal data necessary to maintain platform functionality. Most of our tools run entirely locally in your web browser, meaning your data, images, and files never leave your device.
                                    Any anonymous usage data collected (such as page views or tool usage metrics) is used solely to improve our platform and provide better services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">2. Use of Information</h2>
                                <p className="leading-relaxed">
                                    Any data collected is used strictly to understand website performance and improve the tools we offer.
                                    We do not sell your personal data to third parties. We do not store or process files uploaded to our local tools (like the Image Compressor or QR Code generator) on our servers.
                                </p>
                            </section>

                            <section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">3. Cookies & Advertising</h2>
                                <p className="mb-6 leading-relaxed">
                                    We use cookies to maintain your session, understand how you interact with our site, and to serve advertisements through Google AdSense. 
                                </p>
                                <div className="space-y-6 text-[14px] sm:text-[15px] bg-black/40 p-6 rounded-2xl border border-zinc-800/30">
                                    <p className="leading-relaxed">
                                        <strong className="text-white block mb-2 text-base">Google AdSense & DoubleClick Cookie</strong> Google, as a third-party vendor, uses cookies to serve ads on AssetNest. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
                                    </p>
                                    <p className="leading-relaxed">
                                        <strong className="text-white block mb-2 text-base">Personalized Advertising</strong> Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline transition-all">Google Ad Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 hover:underline transition-all">www.aboutads.info</a>.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">4. Data Security</h2>
                                <p className="leading-relaxed">
                                    We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-4">5. Third-Party Services</h2>
                                <p className="leading-relaxed">
                                    We may use third-party services for analytics or file hosting. These services have their own privacy policies, and we encourage you to review them.
                                </p>
                            </section>

                            <div className="mt-12 pt-8 border-t border-zinc-900">
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
