"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { io } from "socket.io-client";
import { Loader2 } from "lucide-react";

// Using the existing SignaturePad component
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });

function MobileSignerInner() {
    const searchParams = useSearchParams();
    const sessionId = searchParams?.get("sid");
    const [status, setStatus] = useState<"connecting" | "ready" | "done" | "error">("connecting");
    const [socket, setSocket] = useState<any>(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus("error");
            return;
        }

        // Initialize socket connection
        const initializeSocket = async () => {
            await fetch("/api/socket"); // Trigger socket server initialization
            const newSocket = io({
                path: "/api/socket"
            });

            newSocket.on("connect", () => {
                console.log("Connected to socket", newSocket.id);
                newSocket.emit("join-session", sessionId);
                setStatus("ready");
            });

            newSocket.on("connect_error", (err) => {
                console.error("Socket connection error", err);
                setStatus("error");
            });

            setSocket(newSocket);
        };

        initializeSocket();

        return () => {
            if (socket) socket.disconnect();
        };
    }, [sessionId]);

    const onSignatureSaved = (dataUrl: string) => {
        if (socket && sessionId) {
            socket.emit("signature-applied", { sessionId, signatureData: dataUrl });
            setStatus("done");
        }
    };

    if (status === "connecting") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                <h1 className="text-xl font-bold text-white uppercase tracking-widest">Connecting Session...</h1>
                <p className="text-zinc-500 text-sm mt-2">Initializing secure link to your desktop.</p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                    <span className="text-red-500 text-2xl font-bold">!</span>
                </div>
                <h1 className="text-xl font-bold text-white uppercase tracking-widest">Invalid Session</h1>
                <p className="text-zinc-500 text-sm mt-2">The link is expired or invalid. Please generate a new QR code on your PC.</p>
            </div>
        );
    }

    if (status === "done") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400">
                    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-xl font-bold text-white uppercase tracking-widest">Signature Sent</h1>
                <p className="text-zinc-500 text-sm mt-2">Check your PC for the signature. You can now close this window.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black">
            <SignaturePad 
                onSave={onSignatureSaved} 
                onCancel={() => typeof window !== 'undefined' && window.close()} 
            />
        </div>
    );
}

export default function MobileSignerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6 text-center">
                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                <h1 className="text-xl font-bold text-white uppercase tracking-widest">Loading...</h1>
            </div>
        }>
            <MobileSignerInner />
        </Suspense>
    );
}
