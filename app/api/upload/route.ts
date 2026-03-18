import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload EVERYTHING as 'raw' so Cloudinary doesn't touch, compress, or rasterize the PDF/DOCX.
    // We MUST manually append the extension to the public_id so that the generated URL has the right format.
    const fileExtension = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
    const publicId = `share_${Date.now()}_${Math.random().toString(36).substring(7)}${fileExtension}`;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: "assetnest_temp_shares", 
          resource_type: "auto", 
          public_id: publicId 
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // Provide the clean, direct secure_url from Cloudinary
    // Mobile browsers and native OS handlers will correctly offer to open/save PDFs and DOCX files.
    const finalUrl = (uploadResult as any).secure_url;
    
    return NextResponse.json({ url: finalUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
