import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    let inputPath = "";
    let outputPath = "";

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const password = formData.get("password") as string | null;

        if (!file || !password) {
            return NextResponse.json({ error: "File and password are required" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create temp paths
        const id = crypto.randomUUID();
        inputPath = path.join(os.tmpdir(), `locked-${id}.pdf`);
        outputPath = path.join(os.tmpdir(), `unlocked-${id}.pdf`);

        await writeFile(inputPath, buffer);

        try {
            // Dynamically import muhammara at runtime to avoid Turbopack static analysis
            const muhammara = (await import("muhammara")).default;
            // Decrypt using muhammara
            // recrypt throws an error if the password is wrong or encryption is unsupported
            muhammara.recrypt(inputPath, outputPath, { password });
        } catch (err: unknown) {
            await unlink(inputPath).catch(() => {});
            if (outputPath) await unlink(outputPath).catch(() => {});
            const message = err instanceof Error ? err.message : "Unknown error";
            if (message.includes("password") || message.includes("decrypt") || message.includes("encrypt")) {
                return NextResponse.json({ error: "Incorrect password or unsupported encryption" }, { status: 400 });
            }
            return NextResponse.json({ error: "Incorrect password or unsupported encryption" }, { status: 400 });
        }

        // Read the unlocked file
        const unlockedBuffer = await readFile(outputPath);

        // Clean up temp files immediately
        await unlink(inputPath).catch(() => {});
        await unlink(outputPath).catch(() => {});

        // Return the unlocked PDF
        return new NextResponse(unlockedBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${file.name.replace(/\.pdf$/i, '')}_unlocked.pdf"`,
            },
        });
    } catch (err) {
        console.error("PDF Unlock API Error:", err);
        // Ensure cleanup even on unexpected errors
        if (inputPath) await unlink(inputPath).catch(() => {});
        if (outputPath) await unlink(outputPath).catch(() => {});
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
