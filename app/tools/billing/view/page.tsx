"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Globe, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem { n: string; q: number; r: number; t: number; }
interface BillPayload {
    s: string; a?: string; g?: string; p?: string;
    i: string; d: string; l: LineItem[];
}
type LangCode = "en" | "hi" | "ml" | "te" | "ta" | "kn";

// ── Supported languages ───────────────────────────────────────────────────────
const LANGS: { code: LangCode; native: string }[] = [
    { code: "en", native: "English"  },
    { code: "hi", native: "हिन्दी"   },
    { code: "ml", native: "മലയാളം"  },
    { code: "te", native: "తెలుగు"  },
    { code: "ta", native: "தமிழ்"   },
    { code: "kn", native: "ಕನ್ನಡ"   },
];

// ── Static UI translations ────────────────────────────────────────────────────
const UI: Record<LangCode, {
    title: string; invoiceNo: string; dateTime: string; item: string;
    qty: string; amount: string; subtotal: string; totalTax: string;
    totalAmount: string; cgst: string; sgst: string; on: string;
    thank: string; generated: string; poweredBy: string;
    noData: string; noDataSub: string; download: string; translating: string;
}> = {
    en: {
        title: "Digital Tax Invoice", invoiceNo: "Invoice No.", dateTime: "Date & Time",
        item: "Item", qty: "Qty", amount: "Amount", subtotal: "Subtotal",
        totalTax: "Total Tax", totalAmount: "Total Amount", cgst: "CGST", sgst: "SGST", on: "on",
        thank: "Thank you for your purchase! 🙏",
        generated: "This is a computer-generated digital invoice.",
        poweredBy: "Powered by AssetNest",
        noData: "Invalid Bill Link", noDataSub: "This QR code doesn't contain a valid bill.",
        download: "Download Invoice", translating: "Translating…",
    },
    hi: {
        title: "डिजिटल कर चालान", invoiceNo: "चालान नं.", dateTime: "दिनांक और समय",
        item: "वस्तु", qty: "मात्रा", amount: "राशि", subtotal: "उप-कुल",
        totalTax: "कुल कर", totalAmount: "कुल राशि", cgst: "सीजीएसटी", sgst: "एसजीएसटी", on: "पर",
        thank: "खरीदारी के लिए धन्यवाद! 🙏",
        generated: "यह कंप्यूटर-जनित डिजिटल चालान है।",
        poweredBy: "AssetNest द्वारा संचालित",
        noData: "अमान्य बिल लिंक", noDataSub: "इस QR कोड में कोई वैध बिल नहीं है।",
        download: "चालान डाउनलोड करें", translating: "अनुवाद हो रहा है…",
    },
    ml: {
        title: "ഡിജിറ്റൽ ടാക്സ് ഇൻവോയ്സ്", invoiceNo: "ഇൻവോയ്സ് നം.", dateTime: "തീയതി & സമയം",
        item: "ഇനം", qty: "അളവ്", amount: "തുക", subtotal: "ഉപ-ആകെ",
        totalTax: "ആകെ നികുതി", totalAmount: "ആകെ തുക", cgst: "സിജിഎസ്ടി", sgst: "എസ്ജിഎസ്ടി", on: "ൽ",
        thank: "വാങ്ങിയതിന് നന്ദി! 🙏",
        generated: "ഇത് കംപ്യൂട്ടർ ജനറേറ്റ് ചെയ്ത ഡിജിറ്റൽ ഇൻവോയ്സ് ആണ്.",
        poweredBy: "AssetNest ഉപയോഗിച്ച്",
        noData: "അസാധുവായ ബിൽ ലിങ്ക്", noDataSub: "ഈ QR കോഡിൽ സാധുവായ ബിൽ ഇല്ല.",
        download: "ഇൻവോയ്സ് ഡൗൺലോഡ് ചെയ്യുക", translating: "വിവർത്തനം ചെയ്യുന്നു…",
    },
    te: {
        title: "డిజిటల్ పన్ను ఇన్వాయిస్", invoiceNo: "ఇన్వాయిస్ నం.", dateTime: "తేదీ & సమయం",
        item: "వస్తువు", qty: "పరిమాణం", amount: "మొత్తం", subtotal: "ఉప-మొత్తం",
        totalTax: "మొత్తం పన్ను", totalAmount: "మొత్తం", cgst: "సిజిఎస్టి", sgst: "ఎస్జిఎస్టి", on: "లో",
        thank: "మీ కొనుగోలుకు ధన్యవాదాలు! 🙏",
        generated: "ఇది కంప్యూటర్ రూపొందించిన డిజిటల్ ఇన్వాయిస్.",
        poweredBy: "AssetNest ద్వారా",
        noData: "చెల్లని బిల్ లింక్", noDataSub: "ఈ QR కోడ్‌లో చెల్లుబాటు అయ్యే బిల్ లేదు.",
        download: "ఇన్వాయిస్ డౌన్‌లోడ్ చేయండి", translating: "అనువదిస్తోంది…",
    },
    ta: {
        title: "டிஜிட்டல் வரி விலைப்பட்டியல்", invoiceNo: "விலைப்பட்டியல் எண்.", dateTime: "தேதி & நேரம்",
        item: "பொருள்", qty: "அளவு", amount: "தொகை", subtotal: "உப-மொத்தம்",
        totalTax: "மொத்த வரி", totalAmount: "மொத்தம்", cgst: "சிஜிஎஸ்டி", sgst: "எஸ்ஜிஎஸ்டி", on: "இல்",
        thank: "வாங்கியதற்கு நன்றி! 🙏",
        generated: "இது கணினி உருவாக்கிய டிஜிட்டல் விலைப்பட்டியல்.",
        poweredBy: "AssetNest மூலம்",
        noData: "தவறான பில் இணைப்பு", noDataSub: "இந்த QR குறியீட்டில் சரியான பில் இல்லை.",
        download: "விலைப்பட்டியல் பதிவிறக்கவும்", translating: "மொழிபெயர்க்கிறது…",
    },
    kn: {
        title: "ಡಿಜಿಟಲ್ ತೆರಿಗೆ ಇನ್ವಾಯ್ಸ್", invoiceNo: "ಇನ್ವಾಯ್ಸ್ ಸಂ.", dateTime: "ದಿನಾಂಕ & ಸಮಯ",
        item: "ವಸ್ತು", qty: "ಪ್ರಮಾಣ", amount: "ಮೊತ್ತ", subtotal: "ಉಪ-ಒಟ್ಟು",
        totalTax: "ಒಟ್ಟು ತೆರಿಗೆ", totalAmount: "ಒಟ್ಟು ಮೊತ್ತ", cgst: "ಸಿಜಿಎಸ್ಟಿ", sgst: "ಎಸ್ಜಿಎಸ್ಟಿ", on: "ನಲ್ಲಿ",
        thank: "ನಿಮ್ಮ ಖರೀದಿಗೆ ಧನ್ಯವಾದಗಳು! 🙏",
        generated: "ಇದು ಕಂಪ್ಯೂಟರ್ ರಚಿಸಿದ ಡಿಜಿಟಲ್ ಇನ್ವಾಯ್ಸ್.",
        poweredBy: "AssetNest ನಿಂದ",
        noData: "ಅಮಾನ್ಯ ಬಿಲ್ ಲಿಂಕ್", noDataSub: "ಈ QR ಕೋಡ್‌ನಲ್ಲಿ ಮಾನ್ಯ ಬಿಲ್ ಇಲ್ಲ.",
        download: "ಇನ್ವಾಯ್ಸ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", translating: "ಅನುವಾದಿಸಲಾಗುತ್ತಿದೆ…",
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function decode(enc: string): BillPayload | null {
    try { return JSON.parse(decodeURIComponent(atob(enc))); } catch { return null; }
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
    const tax  = (base * item.t) / 100;
    return { base, tax, total: base + tax };
}

// ── Google Translate (unofficial public endpoint, no key) ─────────────────────
async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    if (targetLang === "en") return texts;
    const results: string[] = [];
    for (const text of texts) {
        if (!text.trim()) { results.push(text); continue; }
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const data = await (await fetch(url)).json();
            results.push((data[0] as string[][]).map(s => s[0]).join("") || text);
        } catch { results.push(text); }
    }
    return results;
}

// ─────────────────────────────────────────────────────────────────────────────
function BillViewer() {
    const searchParams                      = useSearchParams();
    const [bill,        setBill]            = useState<BillPayload | null>(null);
    const [error,       setError]           = useState(false);
    const [lang,        setLang]            = useState<LangCode>("en");
    const [translating, setTranslating]     = useState(false);
    const [txNames,     setTxNames]         = useState<string[] | null>(null);
    const printRef                          = useRef<HTMLDivElement>(null);

    // Decode ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const d = searchParams?.get("d");
        if (!d) { setError(true); return; }
        const data = decode(d);
        if (!data) { setError(true); return; }
        setBill(data);
    }, [searchParams]);

    // Translate item names ───────────────────────────────────────────────────
    useEffect(() => {
        if (!bill) return;
        if (lang === "en") { setTxNames(null); return; }
        setTranslating(true);
        translateBatch(bill.l.map(it => it.n), lang)
            .then(r => { setTxNames(r); setTranslating(false); })
            .catch(() => setTranslating(false));
    }, [lang, bill]);

    const t = UI[lang];

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
            <div className="text-center">
                <div className="text-5xl mb-4">🧾</div>
                <p className="text-white font-black text-lg mb-2">{t.noData}</p>
                <p className="text-zinc-500 text-sm">{t.noDataSub}</p>
            </div>
        </div>
    );

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!bill) return (
        <div className="min-h-screen bg-[#fafafc] flex items-center justify-center">
            <div className="w-12 h-12 border-[4px] border-black border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ── Compute totals ────────────────────────────────────────────────────────
    const subtotal   = bill.l.reduce((s, it) => s + lineTotal(it).base, 0);
    const totalTax   = bill.l.reduce((s, it) => s + lineTotal(it).tax,  0);
    const grandTotal = subtotal + totalTax;
    const gstBreakdown = [0, 5, 12, 18, 28].map(rate => {
        const taxable = bill.l.filter(it => it.t === rate).reduce((s, it) => s + lineTotal(it).base, 0);
        return { rate, taxable, half: (taxable * rate) / 200 };
    }).filter(x => x.taxable > 0);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/* Print styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                @media print {
                    .no-print    { display: none !important; }
                    .screen-only { display: none !important; }
                    .print-only  { display: block !important; }
                    body { background: #fff !important; margin: 0; }
                    @page { margin: 1cm; size: A4; }
                }
                @media screen { .print-only { display: none !important; } }
            `}} />

            <div className="min-h-screen bg-[#fafafc] flex flex-col items-center py-8 px-4 font-sans antialiased text-zinc-900">

                {/* ── Language Switcher (screen only) ── */}
                <div className="no-print w-full max-w-md mb-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe size={13} className="text-zinc-500" />
                        <span className="text-xs font-semibold tracking-wide text-zinc-500">Language / भाषा</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {LANGS.map(l => (
                            <button
                                key={l.code}
                                onClick={() => setLang(l.code)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition-all ${
                                    lang === l.code
                                        ? "bg-white border-white text-black"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                                }`}
                            >
                                {l.native}
                            </button>
                        ))}
                    </div>
                    {translating && (
                        <div className="flex items-center gap-2 mt-2">
                            <Loader2 size={12} className="text-zinc-600 animate-spin" />
                            <span className="text-xs text-zinc-600 font-semibold tracking-wide">{t.translating}</span>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SCREEN RECEIPT (dark card — hidden during print)
                ══════════════════════════════════════════════════════════ */}
                <div className="screen-only w-full max-w-md" ref={printRef}>

                    {/* Badge */}
                    <div className="no-print flex items-center justify-center gap-2 mb-5">
                        <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center border border-white/10">
                            <span className="text-white text-sm font-black">₹</span>
                        </div>
                        <span className="text-xs font-semibold tracking-wide text-zinc-400">{t.title}</span>
                    </div>

                    <div className="bg-white rounded-3xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-zinc-200">
                        {/* Shop Header */}
                        <div className="bg-white px-8 pt-10 pb-6 text-center border-b border-zinc-100">
                            <div className="inline-block px-3 py-1 bg-white text-white rounded-full text-[10px] font-semibold tracking-wide mb-4">Official Receipt</div>
                            <p className="text-2xl font-bold text-black mb-1.5 uppercase tracking-tight">{bill.s}</p>
                            {bill.a && <p className="text-xs text-zinc-500 font-bold max-w-xs mx-auto leading-relaxed">{bill.a}</p>}
                            <div className="flex items-center justify-center gap-5 mt-4 flex-wrap">
                                {bill.p && <p className="text-[11px] text-zinc-400 font-bold">📞 {bill.p}</p>}
                                {bill.g && <p className="text-[10px] text-zinc-400 font-bold tracking-tight bg-zinc-50 px-3 py-1 rounded-lg">GSTIN: {bill.g}</p>}
                            </div>
                        </div>

                        {/* Invoice meta */}
                        <div className="bg-zinc-50/50 px-8 py-4 flex items-center justify-between border-b border-zinc-100">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-zinc-400 mb-0.5">{t.invoiceNo}</p>
                                <p className="text-sm font-black text-black font-mono tracking-tighter">{bill.i}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold tracking-wide text-zinc-400 mb-0.5">{t.dateTime}</p>
                                <p className="text-[11px] font-black text-zinc-800">{fmtDate(bill.d)}</p>
                            </div>
                        </div>
                        {/* Items */}
                        <div className="px-5 py-4">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-2 border-b-2 border-zinc-200 mb-1">
                                <p className="text-xs font-semibold tracking-wide text-zinc-500">{t.item}</p>
                                <p className="text-xs font-semibold tracking-wide text-zinc-500 text-center">{t.qty}</p>
                                <p className="text-xs font-semibold tracking-wide text-zinc-500 text-right">{t.amount}</p>
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {bill.l.map((item, idx) => {
                                    const { tax, total } = lineTotal(item);
                                    return (
                                        <div key={idx} className="py-2.5 grid grid-cols-[1fr_auto_auto] gap-x-3 items-start">
                                            <div>
                                                <p className={`text-[13px] font-bold text-black ${translating ? "opacity-30" : ""}`}>
                                                    {txNames?.[idx] ?? item.n}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                                                    {fmtINR(item.r)}{item.t > 0 ? ` + ${item.t}% GST` : ""}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-600 text-center mt-0.5">×{item.q}</p>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-zinc-900">{fmtINR(total)}</p>
                                                {item.t > 0 && <p className="text-[9px] text-zinc-400">tax {fmtINR(tax)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {/* Totals */}
                            <div className="my-3 border-t-2 border-dashed border-zinc-300" />
                            <div className="space-y-1.5 mb-3">
                                <div className="flex justify-between text-sm text-zinc-500">
                                    <span>{t.subtotal}</span>
                                    <span className="font-bold text-zinc-700">{fmtINR(subtotal)}</span>
                                </div>
                                {gstBreakdown.map(g => (
                                    <div key={g.rate}>
                                        <div className="flex justify-between text-xs text-zinc-400">
                                            <span>{t.cgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                            <span>{fmtINR(g.half)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-zinc-400">
                                            <span>{t.sgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                            <span>{fmtINR(g.half)}</span>
                                        </div>
                                    </div>
                                ))}
                                {totalTax > 0 && (
                                    <div className="flex justify-between text-sm text-zinc-500">
                                        <span>{t.totalTax}</span>
                                        <span className="font-bold text-zinc-700">{fmtINR(totalTax)}</span>
                                    </div>
                                )}
                            </div>
                            {/* Grand Total */}
                            <div className="bg-black rounded-[1.25rem] px-6 py-5 flex items-center justify-between shadow-xl shadow-black/10 transition-transform active:scale-[0.98]">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-0.5">{t.totalAmount}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold">{bill.l.length} {bill.l.length === 1 ? "item" : "items"}</p>
                                </div>
                                <p className="text-3xl font-black text-white">{fmtINR(grandTotal)}</p>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="bg-zinc-50/50 border-t border-zinc-100 px-8 py-8 text-center bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02),transparent)]">
                            <p className="text-xs font-black text-black mb-1.5">{t.thank}</p>
                            <p className="text-xs text-zinc-400 font-semibold tracking-wide mb-6">{t.generated}</p>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                                <div className="w-5 h-5 bg-black rounded-lg flex items-center justify-center">
                                    <span className="text-white text-[9px] font-black">A</span>
                                </div>
                                <span className="text-xs font-semibold text-zinc-600 tracking-wide">{t.poweredBy}</span>
                            </div>
                        </div>
                    </div>

                    {/* Download button */}
                    <button
                        onClick={() => window.print()}
                        className="no-print mt-5 w-full flex items-center justify-center gap-2.5 bg-black text-white py-4 rounded-full text-sm font-bold tracking-wide hover:bg-zinc-900 active:scale-[0.98] transition-all shadow-lg shadow-black/20"
                    >
                        <Download size={16} />
                        {t.download}
                    </button>

                    <p className="no-print text-center text-[10px] text-zinc-700 font-medium mt-5 leading-relaxed">
                        This receipt was shared digitally — no paper needed.<br />
                        No personal data is collected or stored.
                    </p>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    PRINT-ONLY WHITE GST INVOICE (shown only when printing)
                ══════════════════════════════════════════════════════════ */}
                <div className="print-only" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: "#09090b", border: "1px solid #d4d4d8", width: "100%" }}>

                    {/* Title bar */}
                    <div style={{ background: "#000", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: "18px", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>Tax Invoice</span>
                        <span style={{ color: "#71717a", fontSize: "11px", fontWeight: 600 }}>Powered by AssetNest</span>
                    </div>

                    {/* Two-column header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #09090b" }}>
                        <div style={{ padding: "14px 20px", borderRight: "1px solid #d4d4d8" }}>
                            <div style={{ fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{bill.s}</div>
                            {bill.a && <div style={{ fontSize: "11px", color: "#52525b", marginBottom: "3px" }}>{bill.a}</div>}
                            {bill.p && <div style={{ fontSize: "11px", color: "#52525b", marginBottom: "3px" }}>📞 {bill.p}</div>}
                            {bill.g && <div style={{ fontSize: "11px", color: "#52525b", fontWeight: 600 }}>GSTIN: {bill.g}</div>}
                        </div>
                        <div style={{ padding: "14px 20px", background: "#f9fafb" }}>
                            <div style={{ marginBottom: "10px" }}>
                                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: "3px" }}>{t.invoiceNo}</div>
                                <div style={{ fontSize: "15px", fontWeight: 800, fontFamily: "monospace" }}>{bill.i}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: "3px" }}>{t.dateTime}</div>
                                <div style={{ fontSize: "12px", fontWeight: 600, color: "#3f3f46" }}>{fmtDate(bill.d)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Items table */}
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                        <thead>
                            <tr style={{ background: "#f4f4f5", borderBottom: "2px solid #09090b" }}>
                                <th style={{ padding: "8px 12px", textAlign: "left",   fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>#</th>
                                <th style={{ padding: "8px 8px",  textAlign: "left",   fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>{t.item}</th>
                                <th style={{ padding: "8px 8px",  textAlign: "center", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>{t.qty}</th>
                                <th style={{ padding: "8px 8px",  textAlign: "right",  fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>Rate</th>
                                <th style={{ padding: "8px 8px",  textAlign: "right",  fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>Taxable</th>
                                <th style={{ padding: "8px 8px",  textAlign: "center", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>GST%</th>
                                <th style={{ padding: "8px 12px", textAlign: "right",  fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#52525b" }}>{t.amount}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.l.map((item, idx) => {
                                const { base, tax, total } = lineTotal(item);
                                return (
                                    <tr key={idx} style={{ borderBottom: "1px solid #e4e4e7", background: idx % 2 === 1 ? "#fafafa" : "#fff" }}>
                                        <td style={{ padding: "9px 12px", color: "#a1a1aa", fontSize: "11px" }}>{idx + 1}</td>
                                        <td style={{ padding: "9px 8px", fontWeight: 600 }}>
                                            {txNames?.[idx] ?? item.n}
                                            {item.t > 0 && <span style={{ fontSize: "10px", color: "#71717a", fontWeight: 400, marginLeft: "6px" }}>(tax {fmtINR(tax)})</span>}
                                        </td>
                                        <td style={{ padding: "9px 8px", textAlign: "center", color: "#52525b" }}>{item.q}</td>
                                        <td style={{ padding: "9px 8px", textAlign: "right",  color: "#52525b" }}>{fmtINR(item.r)}</td>
                                        <td style={{ padding: "9px 8px", textAlign: "right",  color: "#52525b" }}>{fmtINR(base)}</td>
                                        <td style={{ padding: "9px 8px", textAlign: "center", color: "#52525b" }}>{item.t > 0 ? `${item.t}%` : "—"}</td>
                                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700 }}>{fmtINR(total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Totals — right aligned */}
                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "2px solid #09090b" }}>
                        <div style={{ minWidth: "280px", padding: "14px 20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#52525b", paddingBottom: "6px", marginBottom: "6px", borderBottom: "1px dashed #d4d4d8" }}>
                                <span>{t.subtotal}</span>
                                <span style={{ fontWeight: 600 }}>{fmtINR(subtotal)}</span>
                            </div>
                            {gstBreakdown.map(g => (
                                <div key={g.rate}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#71717a", marginBottom: "3px" }}>
                                        <span>{t.cgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                        <span>{fmtINR(g.half)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#71717a", marginBottom: "3px" }}>
                                        <span>{t.sgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                        <span>{fmtINR(g.half)}</span>
                                    </div>
                                </div>
                            ))}
                            {totalTax > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#52525b", marginTop: "4px", paddingTop: "6px", borderTop: "1px dashed #d4d4d8" }}>
                                    <span>{t.totalTax}</span>
                                    <span style={{ fontWeight: 600 }}>{fmtINR(totalTax)}</span>
                                </div>
                            )}
                            {/* Grand Total */}
                            <div style={{ marginTop: "12px", padding: "12px 16px", background: "#f8f8f8", border: "2px solid #000", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#000" }}>{t.totalAmount}</span>
                                <span style={{ fontSize: "24px", fontWeight: 900, color: "#000" }}>{fmtINR(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: "1px solid #e4e4e7", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
                        <div>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#09090b" }}>{t.thank}</p>
                            <p style={{ margin: "3px 0 0", fontSize: "10px", color: "#a1a1aa" }}>{t.generated}</p>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "9px", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: "1.6" }}>
                            Powered by<br /><strong style={{ color: "#000", fontSize: "11px" }}>AssetNest</strong>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillViewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <BillViewer />
        </Suspense>
    );
}

