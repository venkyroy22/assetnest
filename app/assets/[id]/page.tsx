import Container from "@/components/Container";
import { assets } from "@/data/mockData";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Download, ChevronLeft, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const asset = assets.find(a => a.id === id);
    if (!asset) return { title: "Asset Not Found" };

    return {
        title: asset.title,
        description: asset.description,
    };
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const asset = assets.find(a => a.id === id);

    if (!asset) {
        notFound();
    }

    return (
        <div className="py-12 md:py-20">
            <Container>
                <Link href="/assets" className="inline-flex items-center gap-2 text-sm font-bold uppercase mb-8 hover:opacity-70 transition-opacity">
                    <ChevronLeft size={16} /> BACK TO LIBRARY
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Preview Image */}
                    <div className="premium-card overflow-hidden">
                        <div className="relative aspect-video">
                            <Image
                                src={asset.previewUrl}
                                alt={asset.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 border border-border">
                                {asset.category}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-foreground text-background">
                                {asset.license}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter uppercase mb-6 leading-none">
                            {asset.title}
                        </h1>

                        <p className="text-lg text-secondary mb-10 leading-relaxed">
                            {asset.description}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-12">
                            <a
                                href={asset.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cta-button flex items-center justify-center gap-2 text-lg py-5 px-10"
                            >
                                <Download size={20} /> DOWNLOAD ASSET
                            </a>
                            <button className="secondary-button py-5 px-10">
                                SAVE TO WISHLIST
                            </button>
                        </div>

                        {/* Features/Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t border-border">
                            <div className="flex gap-3">
                                <ShieldCheck className="shrink-0" size={24} />
                                <div>
                                    <h4 className="font-bold text-sm uppercase">Secure Download</h4>
                                    <p className="text-xs text-secondary">Verified and safe files stored on secure cloud.</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Zap className="shrink-0" size={24} />
                                <div>
                                    <h4 className="font-bold text-sm uppercase">Instant Access</h4>
                                    <p className="text-xs text-secondary">No signup required for free assets. One-click download.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ownership Disclaimer */}
                <div className="mt-20 p-8 md:p-12 border border-border bg-zinc-900/50">
                    <h3 className="text-xl font-bold uppercase tracking-tighter mb-4">License & Ownership</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <p className="text-sm text-secondary leading-relaxed">
                            This asset is original, licensed, or curated with explicit permission for distribution on AssetNest.
                            Upon downloading, you are granted a non-exclusive license to use this asset in your personal or commercial projects.
                            Redistribution or resale of the original files is strictly prohibited.
                        </p>
                        <p className="text-sm text-secondary leading-relaxed">
                            AssetNest does not claim ownership of any third-party fonts, software icons, or company logos that may be included in templates
                            for educational or placeholder purposes. Users are responsible for adhering to individual licenses for such elements.
                        </p>
                    </div>
                </div>
            </Container>
        </div>
    );
}
