import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'CSS Gradient Maker | AssetNest',
    description: 'Design beautiful, smooth CSS gradients, adjust angles and types, and instantly copy the CSS code.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <div className="h-full">{children}</div>;
}
