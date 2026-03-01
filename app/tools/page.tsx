import { Wrench, Sparkles, Clock } from "lucide-react";

export const metadata = {
    title: "Top Tools | AssetNest",
    description: "A powerful collection of free tools for creators, designers, and marketers. New tools dropping soon.",
};

// ─── ADD YOUR TOOLS HERE WHEN READY ──────────────────────────────────────────
// To add a tool, uncomment and fill in a new object in this array.
// Each tool will automatically appear as a card on this page.
//
// const tools = [
//   {
//     id: "qr",
//     name: "QR Code Generator",
//     description: "Create beautiful, customizable QR codes in seconds.",
//     icon: "QrCode",           // icon name from lucide-react
//     href: "/tools/qr",        // internal route or external URL
//     badge: "Free",            // "Free" | "New" | "Pro" | "Coming Soon"
//     color: "white",           // accent color
//   },
// ];
// ─────────────────────────────────────────────────────────────────────────────

const tools: any[] = [];

export default function ToolsPage() {
    return (
        <div className="min-h-[80vh] py-20 px-10">
            {/* Header */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-800 bg-zinc-900/50 mb-6">
                    <Wrench size={11} className="text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">AssetNest Tools</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase text-white mb-4">
                    Top Tools
                </h1>
                <p className="text-zinc-400 max-w-lg text-sm font-medium leading-relaxed">
                    A growing collection of powerful, free tools built for creators, designers, and marketers. New tools launching regularly.
                </p>
            </div>

            {/* Empty State — Replace this block with a tools grid when tools are added */}
            {tools.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 border border-dashed border-zinc-800 bg-zinc-950/30">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <Wrench size={32} className="text-zinc-600" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 flex items-center justify-center">
                            <Clock size={11} className="text-black" />
                        </div>
                    </div>

                    <h2 className="text-xl font-black uppercase tracking-widest text-white mb-3">
                        Tools Coming Soon
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium text-center max-w-sm leading-relaxed mb-8">
                        We are working on launching a suite of powerful free tools. Check back in a few days — new tools will be dropping here one by one.
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 border border-zinc-800 bg-zinc-900/50">
                            <Sparkles size={12} className="text-amber-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Stay Tuned</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tools Grid — This will render once you add tools to the array above */}
            {tools.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {tools.map((tool) => (
                        <a
                            key={tool.id}
                            href={tool.href}
                            className="group relative overflow-hidden border border-zinc-800 bg-zinc-900/50 p-6 hover:border-white/30 hover:bg-zinc-800/50 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col h-full gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="w-10 h-10 bg-white/10 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                                        <Wrench size={18} className="text-white" />
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${tool.badge === "Free" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" :
                                            tool.badge === "New" ? "text-blue-400 border-blue-400/30 bg-blue-400/10" :
                                                tool.badge === "Coming Soon" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                                                    "text-purple-400 border-purple-400/30 bg-purple-400/10"
                                        }`}>
                                        {tool.badge}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">{tool.name}</h3>
                                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">{tool.description}</p>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
