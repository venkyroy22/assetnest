import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

const SHARED_DIR = path.join(os.tmpdir(), "assetnest-shared-files");

function ensureSharedDir() {
  try {
    if (!fs.existsSync(SHARED_DIR)) {
      fs.mkdirSync(SHARED_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create shared files dir:", err);
  }
}

async function saveLocalFallback(file: File, safeFileName: string, origin: string): Promise<string> {
  ensureSharedDir();
  const id = crypto.randomBytes(16).toString("hex");
  const filePath = path.join(SHARED_DIR, `${id}.bin`);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return `${origin}/api/download?id=${id}&name=${encodeURIComponent(safeFileName)}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = req.headers.get("origin") || `${proto}://${host}`;

    const rawName = file.name || "document";
    const fileType = file.type || "";

    const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(rawName);
    const isImage = fileType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(rawName);

    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: "Unsupported file type. Only PDF documents and images are supported." },
        { status: 400 }
      );
    }

    // Ensure valid file extension so downstream services never reject the file
    let safeFileName = rawName;
    if (isPdf && !safeFileName.toLowerCase().endsWith(".pdf")) {
      safeFileName = `${safeFileName}.pdf`;
    } else if (isImage && !/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(safeFileName)) {
      const ext = fileType.includes("png") ? ".png" : fileType.includes("webp") ? ".webp" : ".jpg";
      safeFileName = `${safeFileName}${ext}`;
    }

    const apiKey = process.env.STREAMLET_API_KEY;
    const accountNumber = process.env.STREAMLET_ACCOUNT_NUMBER;

    // 1. Try Streamlet if credentials exist
    if (apiKey && accountNumber) {
      try {
        const uploadForm = new FormData();
        let endpoint = "";

        if (isImage) {
          endpoint = "https://api.streamletedge.com/api-key/upload-image";
          uploadForm.append("image", file, safeFileName);
        } else {
          endpoint = "https://api.streamletedge.com/api-key/upload-document";
          uploadForm.append("document", file, safeFileName);
        }

        const apiResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "x-streamlet-api-key": apiKey,
            "x-streamlet-account-number": accountNumber,
          },
          body: uploadForm,
        });

        if (apiResponse.ok) {
          const data = await apiResponse.json();
          if (data.success && data.cdnUrl) {
            return NextResponse.json({ url: data.cdnUrl });
          }
        } else {
          const errText = await apiResponse.text().catch(() => "");
          console.warn(`Streamlet upload returned status ${apiResponse.status}: ${errText}. Using local fallback.`);
        }
      } catch (streamletErr) {
        console.warn("Streamlet upload error, falling back to local sharing:", streamletErr);
      }
    }

    // 2. High-reliability fallback (local temporary storage served via /api/download)
    const fallbackUrl = await saveLocalFallback(file, safeFileName, origin);
    return NextResponse.json({ url: fallbackUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process and share file for mobile." }, { status: 500 });
  }
}
