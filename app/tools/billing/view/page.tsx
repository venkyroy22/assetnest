"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem { n: string; q: number; r: number; t: number; }
interface BillPayload {
    s: string;    // shop name
    a?: string;   // address
    g?: string;   // GST number
    p?: string;   // phone
    i: string;    // invoice number
    d: string;    // date-time ISO
    l: LineItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function decode(enc: string): BillPayload | null {
    try { return JSON.parse(decodeURIComponent(atob(enc))); }
    catch { return null; }
}

function fmtINR(n: number) {
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch { return iso; }
}

function lineTotal(item: LineItem) {
    const base = item.q * item.r;
    const tax = (base * item.t) / 100;
    return { base, tax, total: base + tax };
}

// ── Bill Viewer Component ─────────────────────────────────────────────────────
function BillViewer() {
    const searchParams = useSearchParams();
    const [bill, setBill] = useState<BillPayload | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const d = searchParams.get("d");
        if (!d) { setError(true); return; }
        const data = decode(d);
        if (!data) { setError(true); return; }
        setBill(data);
    }, [searchParams]);

    if (error) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="text-4xl mb-4">🧾</div>
                    <p className="text-white font-black text-lg mb-2">Invalid Bill Link</p>
                    <p className="text-zinc-500 text-sm">This QR code doesn't contain a valid bill.</p>
                </div>
            </div>
        );
    }

    if (!bill) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Compute totals
    const subtotal = bill.l.reduce((s, it) => s + lineTotal(it).base, 0);
    const totalTax = bill.l.reduce((s, it) => s + lineTotal(it).tax, 0);
    const grandTotal = subtotal + totalTax;

    // GST breakdown per rate
    const rates = [0, 5, 12, 18, 28];
    const gstBreakdown = rates.map(rate => {
        const taxable = bill.l.filter(it => it.t === rate).reduce((s, it) => s + lineTotal(it).base, 0);
        return { rate, taxable, cgst: (taxable * rate) / 200, sgst: (taxable * rate) / 200 };
    }).filter(x => x.taxable > 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col items-center justify-start py-8 px-4">

            {/* Receipt card */}
            <div className="w-full max-w-md">

                {/* Header badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-black text-sm font-black">₹</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Digital Tax Invoice</span>
                </div>

                {/* Main receipt */}
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/50">

                    {/* Shop Header */}
                    <div className="bg-zinc-950 px-6 py-6 text-center">
                        <p className="text-xl font-black text-white mb-1 uppercase tracking-wide">
                            {bill.s}
                        </p>
                        {bill.a && (
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed">{bill.a}</p>
                        )}
                        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                            {bill.p && <p className="text-[11px] text-zinc-500">📞 {bill.p}</p>}
                            {bill.g && <p className="text-[10px] text-zinc-600 font-mono">GST: {bill.g}</p>}
                        </div>
                    </div>

                    {/* Invoice meta */}
                    <div className="bg-zinc-100 px-6 py-3 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Invoice No.</p>
                            <p className="text-xs font-black text-zinc-800 font-mono">{bill.i}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Date & Time</p>
                            <p className="text-xs font-bold text-zinc-700">{fmtDate(bill.d)}</p>
                        </div>
                    </div>

                    {/* Items table */}
                    <div className="px-6 py-4">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-2 border-b-2 border-zinc-200 mb-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Item</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-center">Qty</p>
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">Amount</p>
                        </div>

                        {/* Row for each item */}
                        <div className="divide-y divide-zinc-100">
                            {bill.l.map((item, idx) => {
                                const { base, tax, total } = lineTotal(item);
                                return (
                                    <div key={idx} className="py-2.5 grid grid-cols-[1fr_auto_auto] gap-x-3 items-start">
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">{item.n}</p>
                                            <p className="text-[10px] text-zinc-400 font-medium">
                                                {fmtINR(item.r)}{item.t > 0 ? ` + ${item.t}% GST` : ""}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-zinc-600 text-center mt-0.5">×{item.q}</p>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-zinc-900">{fmtINR(total)}</p>
                                            {item.t > 0 && (
                                                <p className="text-[9px] text-zinc-400">tax {fmtINR(tax)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dashed divider */}
                        <div className="my-3 border-t-2 border-dashed border-zinc-300" />

                        {/* Subtotal */}
                        <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-sm text-zinc-500">
                                <span>Subtotal</span>
                                <span className="font-bold text-zinc-700">{fmtINR(subtotal)}</span>
                            </div>

                            {/* GST breakdown */}
                            {gstBreakdown.map(g => (
                                <div key={g.rate}>
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>CGST @ {g.rate / 2}%</span>
                                        <span>{fmtINR(g.cgst)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-400">
                                        <span>SGST @ {g.rate / 2}%</span>
                                        <span>{fmtINR(g.sgst)}</span>
                                    </div>
                                </div>
                            ))}

                            {totalTax > 0 && (
                                <div className="flex justify-between text-sm text-zinc-500">
                                    <span>Total Tax</span>
                                    <span className="font-bold text-zinc-700">{fmtINR(totalTax)}</span>
                                </div>
                            )}
                        </div>

                        {/* Grand Total */}
                        <div className="bg-zinc-950 rounded-2xl px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Amount</p>
                                <p className="text-[10px] text-zinc-600">{bill.l.length} item{bill.l.length !== 1 ? "s" : ""}</p>
                            </div>
                            <p className="text-3xl font-black text-emerald-400">{fmtINR(grandTotal)}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 text-center">
                        <p className="text-xs font-black text-zinc-800 mb-1">🙏 Thank you for your purchase!</p>
                        <p className="text-[10px] text-zinc-400 font-medium mb-3">
                            This is a computer-generated digital invoice.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-full">
                            <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center">
                                <span className="text-black text-[8px] font-black">A</span>
                            </div>
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                Powered by AssetNest
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info note */}
                <p className="text-center text-[10px] text-zinc-700 font-medium mt-6 leading-relaxed">
                    This receipt was shared digitally — no paper needed.<br />
                    No personal data is collected or stored.
                </p>
            </div>
        </div>
    );
}

export default function BillViewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <BillViewer />
        </Suspense>
    );
}
