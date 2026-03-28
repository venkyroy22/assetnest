import Link from "next/link";
import Container from "@/components/Container";
import { Mail } from "lucide-react";

export const metadata = {
    title: "Contact Us – AssetNest",
    description: "Get in touch with the AssetNest team for support, feedback, or collaboration opportunities.",
};

export default function ContactPage() {
    return (
        <div className="py-20 bg-black min-h-screen">
            <Container>
                <div className="max-w-4xl mx-auto bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 text-zinc-800 opacity-20 pointer-events-none rotate-12">
                        <Mail size={250} strokeWidth={1} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 rounded-full mb-6">
                            <span className="text-xs font-semibold tracking-wide text-zinc-400">Get in Touch</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-12 text-white">Contact Us</h1>

                        <div className="max-w-2xl mx-auto text-center space-y-12">
                            <section>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Support & Feedback</h2>
                                <p className="text-zinc-400 leading-relaxed text-[16px] sm:text-[18px]">
                                    Have a question about one of our tools? Or perhaps a suggestion for a new feature? We'd love to hear from you. Click below to send us an email directly.
                                </p>
                            </section>

                            <div className="flex justify-center">
                                <a 
                                    href="mailto:assetnestt@gmail.com"
                                    className="group flex items-center gap-6 p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] hover:border-white/50 hover:bg-white/5 transition-all duration-500 shadow-2xl active:scale-95"
                                >
                                    <div className="p-4 bg-zinc-800 rounded-2xl text-white group-hover:bg-white group-hover:text-black transition-colors duration-500">
                                        <Mail size={24} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Send an Email</div>
                                        <div className="text-white text-xl md:text-2xl font-bold tracking-tight">assetnestt@gmail.com</div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="mt-16 pt-8 border-t border-zinc-900/50 text-center">
                            <p className="text-xs text-zinc-600 max-w-lg mx-auto leading-relaxed">
                                We typically respond within 24-48 hours. By contacting us, you agree to our{" "}
                                <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
                                    privacy policy
                                </Link>{" "}
                                regarding communication.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
