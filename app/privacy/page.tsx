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
                                We collect the minimal data necessary to maintain platform functionality. Most of our tools run entirely locally in your web browser, meaning your data, images, and files never leave your device.
                                Any anonymous usage data collected (such as page views or tool usage metrics) is used solely to improve our platform and provide better services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">2. Use of Information</h2>
                            <p>
                                Any data collected is used strictly to understand website performance and improve the tools we offer.
                                We do not sell your personal data to third parties. We do not store or process files uploaded to our local tools (like the Image Compressor or QR Code generator) on our servers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-foreground uppercase tracking-tight mb-4">3. Cookies & Advertising</h2>
                            <p>
                                We use cookies to maintain your session, understand how you interact with our site, and to serve advertisements through Google AdSense. 
                            </p>
                            <div className="mt-4 space-y-4 text-secondary">
                                <p>
                                    <strong>Google AdSense & DoubleClick Cookie:</strong> Google, as a third-party vendor, uses cookies to serve ads on AssetNest. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
                                </p>
                                <p>
                                    <strong>Personalized Advertising:</strong> Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ad Settings</a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aboutads.info</a>.
                                </p>
                            </div>
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
                                Last updated: March 10, 2026. AssetNest reserves the right to update this policy as needed.
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}

