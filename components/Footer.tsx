import Link from "next/link";
import Logo from "./Logo";

const Footer = ({ className = "" }: { className?: string }) => {
    return (
        <footer className={`border-t border-border py-16 bg-background ${className}`}>
            <div className="px-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <Link href="/" className="mb-4 block active:scale-95 transition-all">
                            <Logo size={40} />
                        </Link>
                        <p className="max-w-md mb-6 text-zinc-400 text-sm leading-relaxed">
                            Your ultimate nest for precision utilities and professional creative building blocks. From local PDF tools to premium AI image prompts, we accelerate your creative workflow without compromising privacy.
                        </p>
                        <div className="text-xs text-zinc-500 space-y-2">
                            <p>© {new Date().getFullYear()} AssetNest. All rights reserved.</p>
                            <p>Tools are original, open-source, or curated with permission.</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-zinc-300 text-sm">Navigation</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">

                            <li><Link href="/prompts" className="hover:text-white transition-colors">AI Image Prompts</Link></li>
                            <li><Link href="/tools" className="hover:text-white transition-colors">Smart Tools</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-zinc-300 text-sm">Legal</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
