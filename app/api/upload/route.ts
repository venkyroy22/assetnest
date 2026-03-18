import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Prepare FormData for the temporary file sharing API (Catbox.moe)
    const uploadForm = new FormData();
    uploadForm.append("reqtype", "fileupload");
    uploadForm.append("userhash", ""); // Anonymous upload
    uploadForm.append("fileToUpload", file);

    // Upload the file via fetch directly to the service
    const apiResponse = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: uploadForm,
    });

    if (!apiResponse.ok) {
      throw new Error(`Upload API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    // The API returns the raw URL directly as a plain text string
    const finalUrl = await apiResponse.text();

    if (!finalUrl || !finalUrl.startsWith("http")) {
      throw new Error(`Invalid response from upload service: ${finalUrl}`);
    }
    
    // Return the clean URL for the QR Code
    return NextResponse.json({ url: finalUrl.trim() });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file for sharing" }, { status: 500 });
  }
}
