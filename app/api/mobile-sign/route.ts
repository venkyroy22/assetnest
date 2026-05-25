import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Filesystem-based persistence for cross-process compatibility in both Dev and Prod
const SESSIONS_DIR = path.join(process.cwd(), ".next", "mobile-sign-sessions");

function ensureDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

function cleanOldSessions() {
  try {
    ensureDirectory();
    const files = fs.readdirSync(SESSIONS_DIR);
    const now = Date.now();
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(SESSIONS_DIR, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 15 * 60 * 1000) { // 15 mins expiry
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (err) {
    console.error("Failed to clean old sessions:", err);
  }
}

function getSession(sessionId: string) {
  try {
    ensureDirectory();
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read session:", err);
    return null;
  }
}

function setSession(sessionId: string, sessionData: any) {
  try {
    ensureDirectory();
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(sessionData), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write session:", err);
    return false;
  }
}

export async function GET(req: Request) {
  cleanOldSessions();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session expired or not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: session.status,
    signature: session.signature,
  });
}

export async function POST(req: Request) {
  cleanOldSessions();
  try {
    const body = await req.json();
    const { action, sessionId, signature } = body;

    if (action === "init") {
      const newSessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const success = setSession(newSessionId, {
        status: "pending",
        signature: null,
        updatedAt: Date.now(),
      });
      if (!success) {
        return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
      }
      return NextResponse.json({ sessionId: newSessionId });
    }

    if (action === "submit") {
      if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
      }
      if (!signature) {
        return NextResponse.json({ error: "Missing signature data" }, { status: 400 });
      }

      const session = getSession(sessionId);
      if (!session) {
        return NextResponse.json({ error: "Session expired or not found" }, { status: 404 });
      }

      const success = setSession(sessionId, {
        status: "completed",
        signature,
        updatedAt: Date.now(),
      });
      if (!success) {
        return NextResponse.json({ error: "Failed to save signature" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("API error in mobile-sign:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
