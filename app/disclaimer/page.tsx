import Container from "@/components/Container";

export const metadata = {
    title: "Legal Disclaimer",
};

export default function DisclaimerPage() {
    return (
        <div className="py-20">
            <Container>
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase mb-12">Legal Disclaimer</h1>

                    <div className="prose dark:prose-invert prose-lg max-w-none space-y-8 text-secondary">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">1. Asset Ownership</h2>
                            <p>
                                The assets provided on AssetNest are either created by our in-house designers, licensed for redistribution, or curated from public sources with appropriate permissions.
                                We do not claim ownership of any third-party brand names, logos, or software mentioned or depicted in our resources.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">2. Licensing & Usage</h2>
                            <p>
                                Each asset comes with its own license agreement which is usually included in the download file.
                                Users are solely responsible for reviewing and adhering to the specific terms of use for each individual resource.
                                AssetNest is NOT liable for any legal issues arising from the misuse of downloaded assets.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">3. No Warranties</h2>
                            <p>
                                All resources and tools are provided &quot;as-is&quot; without any warranties of any kind, whether express or implied.
                                While we strive for high quality, we do not guarantee that every asset will be error-free or compatible with all versions of creative software.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">4. External Links</h2>
                            <p>
                                Our website contains links to external tools and websites (e.g., Google Drive for downloads, external design portals).
                                We have no control over the content, privacy policies, or practices of these third-party services and cannot be held responsible for them.
                            </p>
                        </section>

                        <div className="mt-12 pt-12 border-t border-border">
                            <p className="text-sm italic">
                                Last updated: February 23, 2026. AssetNest reserves the right to modify this disclaimer at any time.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
