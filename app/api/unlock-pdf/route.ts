import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const password = formData.get("password") as string | null;

        if (!file || !password) {
            return NextResponse.json({ error: "File and password are required" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const inputData = new Uint8Array(bytes);

        // Dynamically import qpdf-wasm (Emscripten WASM module)
        const createModule = (await import("@jspawn/qpdf-wasm")).default;
        const qpdf = await createModule();

        const inputPath = "/input.pdf";
        const outputPath = "/output.pdf";

        // Write input file to WASM virtual filesystem
        qpdf.FS.writeFile(inputPath, inputData);

        // Run qpdf --decrypt with the provided password
        try {
            qpdf.callMain([
                "--decrypt",
                `--password=${password}`,
                inputPath,
                outputPath,
            ]);
        } catch (err: unknown) {
            // Clean up virtual filesystem
            try { qpdf.FS.unlink(inputPath); } catch {}
            try { qpdf.FS.unlink(outputPath); } catch {}
            return NextResponse.json({ error: "Incorrect password or unsupported encryption" }, { status: 400 });
        }

        // Read the decrypted output from virtual filesystem
        const decryptedData = qpdf.FS.readFile(outputPath);

        // Clean up virtual filesystem
        try { qpdf.FS.unlink(inputPath); } catch {}
        try { qpdf.FS.unlink(outputPath); } catch {}

        // Return the unlocked PDF
        return new NextResponse(Buffer.from(decryptedData), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${file.name.replace(/\.pdf$/i, '')}_unlocked.pdf"`,
            },
        });
    } catch (err) {
        console.error("PDF Unlock API Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
