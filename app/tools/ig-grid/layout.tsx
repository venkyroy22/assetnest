import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Instagram Grid Planner | AssetNest",
    description: "Plan your Instagram feed visually. Upload photos, drag and drop to rearrange, and see how your profile will look.",
};

export default function IGGridLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
