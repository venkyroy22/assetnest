import Container from "@/components/Container";
import { pinterestKeywords } from "@/data/mockData";
import { Copy, Sparkles } from "lucide-react";

export const metadata = {
    title: "Pinterest Keywords for Creators",
    description: "Boost your reach on Pinterest with curated keyword lists for designers and video editors.",
};

export default function KeywordsPage() {
    return (
        <div className="py-24 min-h-screen bg-black">
            <Container>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[90rem] mx-auto pt-10">
                    {pinterestKeywords.map((list) => {
                        const CardContent = (
                            <div
                                className="group relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 hover:scale-[1.01] border border-zinc-900 cursor-pointer"
                            >
                                <img
                                    src={list.image}
                                    alt={list.title}
                                    className="w-full h-auto block"
                                />
                                {/* Overlay for hover feedback */}
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-500" />
                            </div>
                        );

                        if (list.externalUrl) {
                            return (
                                <a
                                    key={list.slug}
                                    href={list.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    {CardContent}
                                </a>
                            );
                        }

                        return <div key={list.slug}>{CardContent}</div>;
                    })}
                </div>
            </Container>
        </div>
    );
}
