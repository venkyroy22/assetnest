import Container from "@/components/Container";

export const metadata = {
    title: "Terms of Service",
};

export default function TermsPage() {
    return (
        <div className="py-20">
            <Container>
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase mb-12">Terms of Service</h1>

                    <div className="prose dark:prose-invert prose-lg max-w-none space-y-8 text-secondary">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using AssetNest, you agree to comply with and be bound by these Terms of Service. AssetNest provides completely free tools and resources. If you do not agree to these terms, please refrain from using our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">2. No Accounts Required</h2>
                            <p>
                                AssetNest is designed to be completely open and accessible. We do not require users to create accounts, sign up, or provide personal information to use any of our core tools or download our free assets.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">3. Intellectual Property</h2>
                            <p>
                                All content on AssetNest, including logos, text, and graphics, is the property of AssetNest or its licensors and is protected by intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">4. Prohibited Conduct</h2>
                            <p>
                                Users are prohibited from using the platform for any unlawful purpose, attempting to gain unauthorized access, or interfering with the site's functionality.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">5. Limitation of Liability</h2>
                            <p>
                                AssetNest shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services or assets.
                            </p>
                        </section>

                        <div className="mt-12 pt-12 border-t border-border">
                            <p className="text-sm italic">
                                Last updated: March 6, 2026. AssetNest reserves the right to modify these terms at any time.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
