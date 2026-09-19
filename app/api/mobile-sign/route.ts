import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

interface MobileSession {
  status: "pending" | "completed";
  signature: string | null;
  updatedAt: number;
}

// In-memory global store to survive across warm serverless invocations and dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __mobileSignSessions: Map<string, MobileSession> | undefined;
}

const memoryStore = globalThis.__mobileSignSessions || new Map<string, MobileSession>();
globalThis.__mobileSignSessions = memoryStore;

// Filesystem storage using os.tmpdir() which is guaranteed writable on Linux, Windows, macOS, and AWS/Vercel serverless
const SESSIONS_DIR = path.join(os.tmpdir(), "assetnest-mobile-sign-sessions");

function ensureDirectory() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    }
  } catch (err) {
    // Non-fatal: in-memory store remains functional
    console.warn("Could not create sessions directory in tmpdir:", err);
  }
}

function cleanOldSessions() {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes expiry

  // 1. Clean in-memory store
  for (const [id, session] of memoryStore.entries()) {
    if (now - session.updatedAt > maxAge) {
      memoryStore.delete(id);
    }
  }

  // 2. Clean tmp files
  try {
    if (fs.existsSync(SESSIONS_DIR)) {
      const files = fs.readdirSync(SESSIONS_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(SESSIONS_DIR, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > maxAge) {
            try { fs.unlinkSync(filePath); } catch {}
          }
        }
      }
    }
  } catch (err) {
    // Non-fatal
  }
}

function getSession(sessionId: string): MobileSession | null {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000;

  // 1. Check in-memory store first
  const memSession = memoryStore.get(sessionId);
  if (memSession) {
    if (now - memSession.updatedAt <= maxAge) {
      return memSession;
    }
    memoryStore.delete(sessionId);
    return null;
  }

  // 2. Check disk store in tmpdir
  try {
    ensureDirectory();
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed: MobileSession = JSON.parse(data);
      if (now - parsed.updatedAt <= maxAge) {
        // Cache back into memory
        memoryStore.set(sessionId, parsed);
        return parsed;
      } else {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  } catch (err) {
    console.error("Failed to read session from disk:", err);
  }

  return null;
}

function setSession(sessionId: string, sessionData: MobileSession): boolean {
  // Always write to memory
  memoryStore.set(sessionId, sessionData);

  // Best-effort write to tmpdir
  try {
    ensureDirectory();
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(sessionData), "utf-8");
  } catch (err) {
    console.warn("Failed to write session to disk, relying on in-memory store:", err);
  }

  return true;
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
      const newSession: MobileSession = {
        status: "pending",
        signature: null,
        updatedAt: Date.now(),
      };
      setSession(newSessionId, newSession);
      return NextResponse.json({ sessionId: newSessionId });
    }

    if (action === "submit") {
      if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
      }
      if (!signature) {
        return NextResponse.json({ error: "Missing signature data" }, { status: 400 });
      }

      // Check if session exists (even if in-memory was purged, create/update session)
      const existing = getSession(sessionId) || { status: "pending" as const, signature: null, updatedAt: Date.now() };

      const updatedSession: MobileSession = {
        ...existing,
        status: "completed",
        signature,
        updatedAt: Date.now(),
      };

      setSession(sessionId, updatedSession);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("API error in mobile-sign:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
