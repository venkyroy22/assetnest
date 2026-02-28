import Container from "@/components/Container";

export const metadata = {
    title: "Privacy Policy",
};

export default function PrivacyPage() {
    return (
        <div className="py-20">
            <Container>
                <div className="max-w-3xl">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter uppercase mb-12">Privacy Policy</h1>

                    <div className="prose dark:prose-invert prose-lg max-w-none space-y-8 text-secondary">
                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">1. Data Collection</h2>
                            <p>
                                We collect minimal data necessary to provide our services. This includes information you provide during signup (e.g., email address) and anonymous usage data to improve our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">2. Use of Information</h2>
                            <p>
                                Your information is used to personalize your experience, provide access to downloads, and communicate important updates. We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">3. Cookies & Tracking</h2>
                            <p>
                                We use cookies to maintain your session and understand how you interact with our site. You can manage cookie preferences through your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">4. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">5. Third-Party Services</h2>
                            <p>
                                We may use third-party services for analytics or file hosting. These services have their own privacy policies, and we encourage you to review them.
                            </p>
                        </section>

                        <div className="mt-12 pt-12 border-t border-border">
                            <p className="text-sm italic">
                                Last updated: February 24, 2026. AssetNest reserves the right to update this policy as needed.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
