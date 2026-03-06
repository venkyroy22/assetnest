import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Advanced Image Cropper | AssetNest",
    description: "Crop images with precision. Set specific aspect ratios, custom dimensions, and download high quality results.",
};

export default function ImageCropperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
