import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Icon Library | AssetNest',
    description: 'A beautifully clean icon library featuring premium outline icons. Click to copy the exact SVG or React component code.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <div className="h-full">{children}</div>;
}
