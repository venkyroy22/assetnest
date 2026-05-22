import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const apiKey = process.env.STREAMLET_API_KEY;
    const accountNumber = process.env.STREAMLET_ACCOUNT_NUMBER;

    if (!apiKey || !accountNumber) {
      console.error("Streamlet credentials are not configured in environment variables.");
      return NextResponse.json(
        { error: "Image storage service is not properly configured." },
        { status: 500 }
      );
    }

    const fileName = file.name || "";
    const fileType = file.type || "";

    const isImage = fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(fileName);
    const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(fileName);

    const uploadForm = new FormData();
    let endpoint = "";

    if (isImage) {
      endpoint = "https://api.streamlet.in/api-key/upload-image";
      uploadForm.append("image", file);
    } else if (isPdf) {
      endpoint = "https://api.streamlet.in/api-key/upload-document";
      uploadForm.append("document", file);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Only images and PDF documents are supported by our storage service." },
        { status: 400 }
      );
    }

    // Call Streamlet API
    const apiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-streamlet-api-key": apiKey,
        "x-streamlet-account-number": accountNumber,
      },
      body: uploadForm,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Streamlet API error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();

    if (!data.success || !data.cdnUrl) {
      throw new Error(data.error || "Invalid response from storage service - missing CDN URL.");
    }
    
    // Return the clean CDN URL for compatibility with client components
    return NextResponse.json({ url: data.cdnUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file to cloud storage" }, { status: 500 });
  }
}
