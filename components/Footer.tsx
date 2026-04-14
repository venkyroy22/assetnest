import Link from "next/link";
import Logo from "./Logo";
import { ArrowUpRight, Sparkles, Shield, Zap } from "lucide-react";

const footerTools = [
  { name: "Image Compressor", href: "/tools/image-compressor" },
  { name: "Background Remover", href: "/tools/bg-remover" },
  { name: "QR Code Generator", href: "/tools/qr" },
  { name: "PDF Merger", href: "/tools/pdf-merger" },
  { name: "E-Signature Creator", href: "/tools/e-signature" },
  { name: "Pomodoro Timer", href: "/tools/pomodoro" },
];

const footerLinks = {
  Explore: [
    { name: "Smart Tools", href: "/tools" },
    { name: "AI Image Prompts", href: "/prompts" },
    { name: "Industry Insights", href: "/articles" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "Guides", href: "/guides" },
    { name: "Articles", href: "/articles" },
    { name: "Contact", href: "/contact" },
    { name: "Disclaimer", href: "/disclaimer" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const Footer = ({ className = "" }: { className?: string }) => {
  return (
    <footer className={`relative bg-black overflow-hidden ${className}`}>
      {/* Primary gradient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-zinc-300/20 to-transparent" />

      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Ambient glows */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-white/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[200px] rounded-full bg-white/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[200px] rounded-full bg-white/4 blur-3xl pointer-events-none" />

      <div className="relative z-10 px-6 md:px-10 pt-16 pb-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          {/* Brand column */}
          <div className="md:col-span-5">
            <Link href="/" className="mb-6 block group w-fit">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Logo size={44} className="relative z-10 transition-transform duration-300 group-hover:scale-105" />
              </div>
            </Link>

            <p className="max-w-xs mb-7 text-zinc-400 text-sm leading-relaxed font-medium">
              Your ultimate nest for precision utilities and professional creative building blocks. From local PDF tools to premium AI image prompts — we accelerate your workflow without compromising privacy.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-zinc-400">
                <Shield size={10} />
                100% Private
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-zinc-400">
                <Zap size={10} />
                No Sign-Up
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-zinc-400">
                <Sparkles size={10} />
                Always Free
              </div>
            </div>
          </div>

          {/* Popular Tools */}
          <div className="md:col-span-3">
            <h4 className="font-bold mb-5 text-zinc-200 text-xs tracking-widest uppercase">Popular Tools</h4>
            <ul className="space-y-3">
              {footerTools.map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="group flex items-center gap-1.5 text-sm text-zinc-500 hover:text-white transition-colors duration-200 font-medium"
                  >
                    <span>{tool.name}</span>
                    <ArrowUpRight
                      size={11}
                      className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200 text-zinc-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links columns */}
          <div className="md:col-span-4 grid grid-cols-2 gap-8">
            {Object.entries(footerLinks).map(([section, links]) => (
              <div key={section}>
                <h4 className="font-bold mb-5 text-zinc-200 text-xs tracking-widest uppercase">{section}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 hover:text-white transition-colors duration-200 font-medium"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent mb-7" />

        {/* Legal strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-600 font-medium">
            © {new Date().getFullYear()} AssetNest. All rights reserved.
          </div>
          <div className="text-xs text-zinc-700 font-medium text-center sm:text-right">
            Tools are original, open-source, or curated with permission.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
