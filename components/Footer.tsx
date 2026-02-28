import Link from "next/link";
import Logo from "./Logo";

const Footer = () => {
    return (
        <footer className="border-t border-border py-16 bg-background">
            <div className="px-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <Link href="/" className="mb-4 block active:scale-95 transition-all">
                            <Logo size={40} />
                        </Link>
                        <p className="max-w-md mb-6">
                            A Home for Designers & Editors. Providing high-quality, curated resources to accelerate your creative workflow.
                        </p>
                        <div className="text-xs text-secondary space-y-2">
                            <p>© {new Date().getFullYear()} AssetNest. All rights reserved.</p>
                            <p>Assets are original, licensed, or curated with permission.</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4 uppercase text-sm tracking-widest">Navigation</h4>
                        <ul className="space-y-2 text-sm">

                            <li><Link href="/keywords" className="hover:text-foreground">Pinterest Keywords</Link></li>
                            <li><Link href="/tools" className="hover:text-foreground">Tools & Websites</Link></li>
                            <li><Link href="/premium" className="hover:text-foreground">Premium Packs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4 uppercase text-sm tracking-widest">Legal</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
