import { NextResponse } from "next/server";

// Keep session state in memory
const globalForSignatures = global as unknown as {
  mobileSignatures?: Map<string, { status: "pending" | "completed"; signature: string | null; updatedAt: number }>;
};

if (!globalForSignatures.mobileSignatures) {
  globalForSignatures.mobileSignatures = new Map();
}

const sessions = globalForSignatures.mobileSignatures;

// Self cleaning function to prevent memory leaks
function cleanOldSessions() {
  const now = Date.now();
  for (const [key, value] of sessions.entries()) {
    if (now - value.updatedAt > 15 * 60 * 1000) { // 15 mins expiry
      sessions.delete(key);
    }
  }
}

export async function GET(req: Request) {
  cleanOldSessions();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = sessions.get(sessionId);
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
      sessions.set(newSessionId, {
        status: "pending",
        signature: null,
        updatedAt: Date.now(),
      });
      return NextResponse.json({ sessionId: newSessionId });
    }

    if (action === "submit") {
      if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
      }
      if (!signature) {
        return NextResponse.json({ error: "Missing signature data" }, { status: 400 });
      }

      const session = sessions.get(sessionId);
      if (!session) {
        return NextResponse.json({ error: "Session expired or not found" }, { status: 404 });
      }

      sessions.set(sessionId, {
        status: "completed",
        signature,
        updatedAt: Date.now(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("API error in mobile-sign:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
