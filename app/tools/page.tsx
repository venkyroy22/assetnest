import Container from "@/components/Container";
import { tools } from "@/data/mockData";
import { ExternalLink } from "lucide-react";

export const metadata = {
    title: "Curated Tools & Websites",
    description: "A hand-picked directory of the best tools for design, video editing, and AI-driven creativity.",
};

export default function ToolsPage() {
    const toolCategories = ["Design", "Video Editing", "AI Tools", "Resources"];

    return (
        <div className="py-20">
            <Container>
                <header className="mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase mb-6">Tools & Websites</h1>
                    <p className="text-xl text-secondary max-w-2xl">
                        Our curated list of industry-standard software and hidden gems to optimize your creative workflow.
                    </p>
                </header>

                {toolCategories.map((cat) => (
                    <section key={cat} className="mb-20">
                        <h2 className="text-2xl font-bold uppercase tracking-widest mb-8 border-b border-border pb-4 flex justify-between items-center">
                            {cat}
                            <span className="text-xs font-normal opacity-50 px-3 py-1 border border-border">
                                {tools.filter(t => t.category === cat).length} TOOLS
                            </span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tools.filter(t => t.category === cat).map((tool) => (
                                <div key={tool.id} className="premium-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                                    <div>
                                        <h3 className="text-xl font-bold mb-3">{tool.name}</h3>
                                        <p className="text-sm text-secondary mb-6">{tool.description}</p>
                                    </div>
                                    <a
                                        href={tool.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs font-bold uppercase border-t border-border pt-4 hover:text-foreground transition-colors group"
                                    >
                                        Visit Website <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                <div className="mt-12 p-8 border border-dashed border-border text-center">
                    <p className="text-secondary mb-4 italic">Have a tool we should include?</p>
                    <button className="text-sm font-bold uppercase underline hover:opacity-70">
                        SUBMIT A TOOL
                    </button>
                </div>
            </Container>
        </div>
    );
}
