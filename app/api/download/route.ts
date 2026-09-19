import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// Shared temporary storage directory
const SHARED_DIR = path.join(os.tmpdir(), "assetnest-shared-files");

// Clean files older than 2 hours
function cleanOldFiles() {
  try {
    if (!fs.existsSync(SHARED_DIR)) return;
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000;
    const files = fs.readdirSync(SHARED_DIR);
    for (const file of files) {
      const filePath = path.join(SHARED_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > maxAge) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  } catch {}
}

export async function GET(req: Request) {
  cleanOldFiles();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name") || "document.pdf";

    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return new NextResponse("Invalid or missing file ID", { status: 400 });
    }

    const filePath = path.join(SHARED_DIR, `${id}.bin`);
    if (!fs.existsSync(filePath)) {
      return new NextResponse("File expired or not found. Please regenerate the QR code from your desktop.", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const isPdf = name.toLowerCase().endsWith(".pdf");
    const contentType = isPdf ? "application/pdf" : "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(name)}"`,
        "Cache-Control": "public, max-age=7200",
      },
    });
  } catch (err) {
    console.error("Error serving shared file:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
