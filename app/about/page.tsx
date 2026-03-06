import Container from "@/components/Container";

export const metadata = {
    title: "About AssetNest – Free Creative Tools & Assets",
    description: "Learn about AssetNest, the 100% free suite of design tools and curated assets for creators, designers, and developers.",
};

export default function AboutPage() {
    return (
        <div className="py-20">
            <Container>
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase mb-12">About AssetNest</h1>

                    <div className="prose dark:prose-invert prose-lg max-w-none space-y-8 text-secondary">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">Our Mission</h2>
                            <p>
                                At AssetNest, we believe that creativity shouldn't be gated by expensive subscriptions or complex tools. Our mission is to provide creators, designers, and developers with a powerful, completely free suite of online tools and high-quality resources to accelerate their workflows.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">What We Do</h2>
                            <p>
                                We meticulously build and curate tools that solve real problems. From advanced image cropping and compression to productivity timers and typing speed testers, every tool on AssetNest is designed with performance, privacy, and ease-of-use in mind. No paywalls, no hidden fees, just pure utility.
                            </p>
                            <p>
                                In addition to our tools, we curate high-quality assets, templates, and guides designed specifically to help modern creatives thrive in an increasingly competitive digital landscape.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">Why AssetNest?</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>100% Free:</strong> No premium tiers, no paywalls. Everything is accessible.</li>
                                <li><strong>Privacy First:</strong> Our tools primarily run perfectly in your browser, meaning your files never even hit a server.</li>
                                <li><strong>Constantly Growing:</strong> We are continuously adding new tools and resources based on what creators actually need.</li>
                                <li><strong>Zero Clutter:</strong> Minimal, aesthetic interfaces focused purely on getting the job done fast.</li>
                            </ul>
                        </section>

                        <div className="mt-12 pt-12 border-t border-border">
                            <p className="text-sm italic">
                                Stay inspired and keep creating. Welcome to your ultimate asset nest.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
