"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Globe, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        download: "invois downlod cheyandi", translating: "అనువదిస్తోంది…",
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
        item: "ವಸ್ತು", qty: "ಪ್ರಮಾಣ", amount: "ಮೊತ್ತ", subtotal: "ಒಟ್ಟು ತೆರಿಗೆ",
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
    try {
        const binaryStr = atob(enc);
        const utf8Bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            utf8Bytes[i] = binaryStr.charCodeAt(i);
        }
        const jsonStr = new TextDecoder().decode(utf8Bytes);
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
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
        <div className="min-h-screen bg-[#F4ECD8] flex items-center justify-center p-6 text-black ig-root">
            <div className="text-center bg-white border-2 border-black p-8 rounded-[2rem] shadow-[4px_4px_0_#000] max-w-sm">
                <div className="text-5xl mb-4">🧾</div>
                <h3 className="font-black text-lg mb-1.5 uppercase ig-display">{t.noData}</h3>
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide">{t.noDataSub}</p>
            </div>
        </div>
    );

    // ── Loading ───────────────────────────────────────────────────────────────
    if (!bill) return (
        <div className="min-h-screen bg-[#F4ECD8] flex items-center justify-center">
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
        <div className="ig-root">
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

            <div className="min-h-screen bg-[#F4ECD8] flex flex-col items-center py-8 px-4 font-sans text-black relative">

                {/* ── Language Switcher (screen only) ── */}
                <div className="no-print w-full max-w-md mb-6 bg-white border-2 border-black p-4 rounded-3xl shadow-[4px_4px_0_#000]">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe size={13} className="text-black" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Receipt Language / भाषा</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {LANGS.map(l => (
                            <button
                                key={l.code}
                                onClick={() => setLang(l.code)}
                                className="ig-btn px-3 py-1.5 border border-black rounded-lg text-[10px] font-black uppercase tracking-wide transition-all shadow-[1.5px_1.5px_0_#000]"
                                style={{
                                    background: lang === l.code ? "#fde047" : "#ffffff",
                                }}
                            >
                                {l.native}
                            </button>
                        ))}
                    </div>
                    {translating && (
                        <div className="flex items-center gap-2 mt-3 bg-zinc-50 p-2 rounded-xl border border-black">
                            <Loader2 size={12} className="text-black animate-spin" />
                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">{t.translating}</span>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════════════════════
                    SCREEN RECEIPT
                ══════════════════════════════════════════════════════════ */}
                <div className="screen-only w-full max-w-md" ref={printRef}>

                    {/* Badge */}
                    <div className="no-print flex items-center justify-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center border-2 border-black shadow-[2px_2px_0_#F4ECD8]">
                            <span className="text-white text-sm font-black">₹</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-550">{t.title}</span>
                    </div>

                    <div className="bg-white rounded-[2rem] overflow-hidden border-2 border-black shadow-[6px_6px_0_#000]">
                        {/* Shop Header */}
                        <div className="bg-white px-6 pt-8 pb-5 text-center border-b-2 border-dashed border-zinc-200">
                            <div className="inline-block px-3 py-1 border border-black bg-zinc-50 rounded-full text-[9px] font-black uppercase tracking-wider mb-4 shadow-[1.5px_1.5px_0_#000]">Official Receipt</div>
                            <h1 className="text-xl sm:text-2xl font-black text-black mb-1 uppercase tracking-tight ig-display">{bill.s}</h1>
                            {bill.a && <p className="text-xs text-zinc-500 font-bold max-w-xs mx-auto leading-relaxed">{bill.a}</p>}
                            <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
                                {bill.p && <p className="text-[10px] text-zinc-500 font-black uppercase">📞 {bill.p}</p>}
                                {bill.g && <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider bg-zinc-50 border border-black px-2.5 py-0.5 rounded-lg shadow-[1px_1px_0_#000]">GSTIN: {bill.g}</p>}
                            </div>
                        </div>

                        {/* Invoice meta */}
                        <div className="bg-zinc-50/50 px-6 py-3 flex items-center justify-between border-b-2 border-black text-xs font-semibold">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">{t.invoiceNo}</p>
                                <p className="text-xs font-black text-black font-mono tracking-tighter">{bill.i}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">{t.dateTime}</p>
                                <p className="text-[10px] font-black text-zinc-700">{fmtDate(bill.d)}</p>
                            </div>
                        </div>
                        
                        {/* Items */}
                        <div className="px-5 py-4">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-2 border-b-2 border-black mb-1 text-[10px] font-black uppercase tracking-wider text-zinc-450">
                                <p>{t.item}</p>
                                <p className="text-center">{t.qty}</p>
                                <p className="text-right">{t.amount}</p>
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {bill.l.map((item, idx) => {
                                    const { tax, total } = lineTotal(item);
                                    return (
                                        <div key={idx} className="py-3 grid grid-cols-[1fr_auto_auto] gap-x-3 items-start">
                                            <div>
                                                <p className={`text-xs font-black text-black ${translating ? "opacity-30" : ""}`}>
                                                    {txNames?.[idx] ?? item.n}
                                                </p>
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                                                    {fmtINR(item.r)}{item.t > 0 ? ` + ${item.t}% GST` : ""}
                                                </p>
                                            </div>
                                            <p className="text-xs font-black text-zinc-500 text-center mt-0.5">×{item.q}</p>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-black">{fmtINR(total)}</p>
                                                {item.t > 0 && <p className="text-[9px] text-zinc-400 font-bold uppercase">tax {fmtINR(tax)}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Totals */}
                            <div className="my-2 border-t-2 border-dashed border-zinc-200" />
                            <div className="space-y-1.5 mb-4">
                                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    <span>{t.subtotal}</span>
                                    <span className="font-black text-black">{fmtINR(subtotal)}</span>
                                </div>
                                {gstBreakdown.map((g, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            <span>{t.cgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                            <span>{fmtINR(g.half)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            <span>{t.sgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                            <span>{fmtINR(g.half)}</span>
                                        </div>
                                    </div>
                                ))}
                                {totalTax > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        <span>{t.totalTax}</span>
                                        <span className="font-black text-black">{fmtINR(totalTax)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Grand Total */}
                            <div className="bg-[#fde047] border-2 border-black rounded-xl px-5 py-4 flex items-center justify-between shadow-[2px_2px_0_#000]">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-black mb-0.5">{t.totalAmount}</p>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase">{bill.l.length} {bill.l.length === 1 ? "item" : "items"}</p>
                                </div>
                                <p className="text-2xl font-black text-black leading-none">{fmtINR(grandTotal)}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t-2 border-dashed border-zinc-200 px-6 py-6 text-center bg-zinc-50/50">
                            <p className="text-xs font-black text-black mb-1">{t.thank}</p>
                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-4 leading-relaxed">{t.generated}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl shadow-[1.5px_1.5px_0_#000]">
                                <div className="w-4 h-4 bg-black rounded flex items-center justify-center">
                                    <span className="text-white text-[8px] font-black">A</span>
                                </div>
                                <span className="text-[10px] font-bold text-black uppercase tracking-wide">{t.poweredBy}</span>
                            </div>
                        </div>
                    </div>

                    {/* Download button */}
                    <button
                        onClick={() => window.print()}
                        className="ig-btn no-print mt-5 w-full flex items-center justify-center gap-2 bg-black hover:bg-zinc-900 text-white border-2 border-black py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_#000]"
                    >
                        <Download size={14} />
                        {t.download}
                    </button>

                    <p className="no-print text-center text-[9px] text-zinc-500 font-semibold uppercase tracking-wider mt-5 leading-relaxed">
                        This receipt was generated digitally - no paper needed.<br />
                        Browser-processed client receipt.
                    </p>
                </div>

                {/* ══════════════════════════════════════════════════════════
                    PRINT-ONLY RECEIPT
                ══════════════════════════════════════════════════════════ */}
                <div className="print-only" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: "#09090b", border: "2px solid #000000", width: "100%" }}>
                    <div style={{ background: "#000", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#fff", fontSize: "16px", fontWeight: 905, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tax Invoice</span>
                        <span style={{ color: "#71717a", fontSize: "10px", fontWeight: 650 }}>Powered by AssetNest</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "2px solid #000" }}>
                        <div style={{ padding: "14px 20px", borderRight: "2px solid #000" }}>
                            <div style={{ fontSize: "15px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{bill.s}</div>
                            {bill.a && <div style={{ fontSize: "11px", color: "#52525b", marginBottom: "3px" }}>{bill.a}</div>}
                            {bill.p && <div style={{ fontSize: "11px", color: "#52525b", marginBottom: "3px" }}>📞 {bill.p}</div>}
                            {bill.g && <div style={{ fontSize: "11px", color: "#52525b", fontWeight: 600 }}>GSTIN: {bill.g}</div>}
                        </div>
                        <div style={{ padding: "14px 20px", background: "#f9fafb" }}>
                            <div style={{ marginBottom: "10px" }}>
                                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: "3px" }}>{t.invoiceNo}</div>
                                <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace" }}>{bill.i}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a", marginBottom: "3px" }}>{t.dateTime}</div>
                                <div style={{ fontSize: "11px", fontWeight: 600, color: "#3f3f46" }}>{fmtDate(bill.d)}</div>
                            </div>
                        </div>
                    </div>

                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                        <thead>
                            <tr style={{ background: "#f4f4f5", borderBottom: "2px solid #000" }}>
                                <th style={{ padding: "8px 12px", textAlign: "left",   fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>#</th>
                                <th style={{ padding: "8px 8px",  textAlign: "left",   fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>{t.item}</th>
                                <th style={{ padding: "8px 8px",  textAlign: "center", fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>{t.qty}</th>
                                <th style={{ padding: "8px 8px",  textAlign: "right",  fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>Rate</th>
                                <th style={{ padding: "8px 8px",  textAlign: "right",  fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>Taxable</th>
                                <th style={{ padding: "8px 8px",  textAlign: "center", fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>GST%</th>
                                <th style={{ padding: "8px 12px", textAlign: "right",  fontSize: "9px", fontWeight: 750, textTransform: "uppercase", color: "#52525b" }}>{t.amount}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.l.map((item, idx) => {
                                const { base, tax, total } = lineTotal(item);
                                return (
                                    <tr key={idx} style={{ borderBottom: "1px solid #000", background: idx % 2 === 1 ? "#fafafa" : "#fff" }}>
                                        <td style={{ padding: "9px 12px", color: "#a1a1aa", fontSize: "10px" }}>{idx + 1}</td>
                                        <td style={{ padding: "9px 8px", fontWeight: 700 }}>
                                            {txNames?.[idx] ?? item.n}
                                            {item.t > 0 && <span style={{ fontSize: "9px", color: "#71717a", fontWeight: 400, marginLeft: "6px" }}>(tax {fmtINR(tax)})</span>}
                                        </td>
                                        <td style={{ padding: "9px 8px", textAlign: "center" }}>{item.q}</td>
                                        <td style={{ padding: "9px 8px", textAlign: "right" }}>{fmtINR(item.r)}</td>
                                        <td style={{ padding: "9px 8px", textAlign: "right" }}>{fmtINR(base)}</td>
                                        <td style={{ padding: "9px 8px", textAlign: "center" }}>{item.t > 0 ? `${item.t}%` : "-"}</td>
                                        <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700 }}>{fmtINR(total)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "2px solid #000" }}>
                        <div style={{ minWidth: "260px", padding: "14px 20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#52525b", paddingBottom: "6px", marginBottom: "6px", borderBottom: "1px dashed #000" }}>
                                <span>{t.subtotal}</span>
                                <span style={{ fontWeight: 650 }}>{fmtINR(subtotal)}</span>
                            </div>
                            {gstBreakdown.map((g, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#71717a", marginBottom: "3px" }}>
                                        <span>{t.cgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                        <span>{fmtINR(g.half)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#71717a", marginBottom: "3px" }}>
                                        <span>{t.sgst} @ {g.rate / 2}% {t.on} {fmtINR(g.taxable)}</span>
                                        <span>{fmtINR(g.half)}</span>
                                    </div>
                                </div>
                            ))}
                            {totalTax > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#52525b", marginTop: "4px", paddingTop: "6px", borderTop: "1px dashed #000" }}>
                                    <span>{t.totalTax}</span>
                                    <span style={{ fontWeight: 650 }}>{fmtINR(totalTax)}</span>
                                </div>
                            )}
                            <div style={{ marginTop: "12px", padding: "10px 14px", background: "#f8f8f8", border: "2px solid #000", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "10px", fontWeight: 750, textTransform: "uppercase" }}>{t.totalAmount}</span>
                                <span style={{ fontSize: "20px", fontWeight: 900 }}>{fmtINR(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: "2px solid #000", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb" }}>
                        <div>
                            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700 }}>{t.thank}</p>
                            <p style={{ margin: "2px 0 0", fontSize: "9px", color: "#71717a" }}>{t.generated}</p>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "9px", color: "#71717a", textTransform: "uppercase", lineHeight: "1.4" }}>
                            Powered by<br /><strong style={{ color: "#000", fontSize: "10px" }}>AssetNest</strong>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BillViewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F4ECD8] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <BillViewer />
        </Suspense>
    );
}
