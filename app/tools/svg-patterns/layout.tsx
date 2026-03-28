import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SVG Pattern Backgrounds | AssetNest',
    description: 'A curated library of beautiful, seamless geometric SVG backgrounds for websites.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <div className="h-full">{children}</div>;
}
