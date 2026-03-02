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
const LANGS: { code: LangCode; native: string; label: string }[] = [
    { code: "en", native: "English", label: "English" },
    { code: "hi", native: "हिन्दी", label: "Hindi" },
    { code: "ml", native: "മലയാളം", label: "Malayalam" },
    { code: "te", native: "తెలుగు", label: "Telugu" },
    { code: "ta", native: "தமிழ்", label: "Tamil" },
    { code: "kn", native: "ಕನ್ನಡ", label: "Kannada" },
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
    const tax = (base * item.t) / 100;
    return { base, tax, total: base + tax };
}

// ── Google Translate (unofficial public endpoint, no key needed) ───────────────
async function translateBatch(texts: string[], targetLang: string): Promise<string[]> {
    if (targetLang === "en") return texts;
    const results: string[] = [];
    for (const text of texts) {
        if (!text.trim()) { results.push(text); continue; }
        try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            const data = await res.json();
            // Shape: [ [ ["translated", "src", ...], ... ], ..., "src_lang" ]
            const translated = (data[0] as string[][]).map(seg => seg[0]).join("");
            results.push(translated || text);
        } catch {
            results.push(text); // fallback: original
        }
    }
    return results;
}

// ── Bill Viewer ───────────────────────────────────────────────────────────────
function BillViewer() {
    const searchParams = useSearchParams();
    const [bill, setBill] = useState<BillPayload | null>(null);
    const [error, setError] = useState(false);
    const [lang, setLang] = useState<LangCode>("en");
    const [translating, setTranslating] = useState(false);
    const [txNames, setTxNames] = useState<string[] | null>(null); // translated item names
    const [txShop, setTxShop] = useState<string | null>(null);   // translated shop name
    const printRef = useRef<HTMLDivElement>(null);

    // ── Decode bill from URL ───────────────────────────────────────────────────
    useEffect(() => {
        const d = searchParams.get("d");
        if (!d) { setError(true); return; }
        const data = decode(d);
        if (!data) { setError(true); return; }
        setBill(data);
    }, [searchParams]);

    // ── Translate when language changes ───────────────────────────────────────
    useEffect(() => {
        if (!bill) return;
        if (lang === "en") {
            setTxNames(null);
            setTxShop(null);
            return;
        }
        setTranslating(true);
        const names = bill.l.map(it => it.n);
        // Translate item names + shop name in parallel
        Promise.all([
            translateBatch(names, lang),
            translateBatch([bill.s], lang).then(r => r[0]),
        ]).then(([translatedNames, translatedShop]) => {
            setTxNames(translatedNames);
            setTxShop(translatedShop);
            setTranslating(false);
        }).catch(() => setTranslating(false));
    }, [lang, bill]);

    // ── Print / Download ──────────────────────────────────────────────────────
    const handleDownload = () => window.print();

    const t = UI[lang];

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
            <div className="text-center">
                <div className="text-5xl mb-4">🧾</div>
                <p className="text-white font-black text-lg mb-2">{t.noData}</p>
                <p className="text-zinc-500 text-sm">{t.noDataSub}</p>
            </div>
        </div>
    );

    // ── Loading state ─────────────────────────────────────────────────────────
    if (!bill) return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // ── Compute totals ────────────────────────────────────────────────────────
    const subtotal = bill.l.reduce((s, it) => s + lineTotal(it).base, 0);
    const totalTax = bill.l.reduce((s, it) => s + lineTotal(it).tax, 0);
    const grandTotal = subtotal + totalTax;
    const rates = [0, 5, 12, 18, 28];
    const gstBreakdown = rates.map(rate => {
        const taxable = bill.l.filter(it => it.t === rate).reduce((s, it) => s + lineTotal(it).base, 0);
        return { rate, taxable, half: (taxable * rate) / 200 };
    }).filter(x => x.taxable > 0);

    return (
        <>
            {/* ── Print styles ── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; margin: 0; }
                    .receipt-wrapper { max-width: 100% !important; padding: 0 !important; }
                    .receipt-card { box-shadow: none !important; border-radius: 0 !important; }
                    @page { margin: 0.5cm; }
                }
            `}} />

            <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 flex flex-col items-center py-6 px-4">

                {/* ── Language Switcher ── */}
                <div className="no-print w-full max-w-md mb-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Globe size={13} className="text-zinc-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Language / भाषा</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {LANGS.map(l => (
                            <button
                                key={l.code}
                                onClick={() => setLang(l.code)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition-all ${lang === l.code
                                        ? "bg-emerald-500 border-emerald-500 text-black"
                                        : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                                    }`}
                            >
                                {l.native}
                            </button>
                        ))}
                    </div>
                    {translating && (
                        <div className="flex items-center gap-2 mt-2">
                            <Loader2 size={12} className="text-emerald-400 animate-spin" />
                            <span className="text-[10px] text-emerald-400 font-medium">{t.translating}</span>
                        </div>
                    )}
                </div>

                {/* ── Receipt card ── */}
                <div className="receipt-wrapper w-full max-w-md" ref={printRef}>

                    {/* Badge */}
                    <div className="no-print flex items-center justify-center gap-2 mb-5">
                        <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-black text-sm font-black">₹</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t.title}</span>
                    </div>

                    {/* Main receipt */}
                    <div className="receipt-card bg-white rounded-3xl overflow-hidden shadow-2xl shadow-black/50">

                        {/* Shop Header */}
                        <div className="bg-zinc-950 px-6 py-6 text-center">
                            <p className="text-xl font-black text-white mb-1 uppercase tracking-wide">
                                {txShop || bill.s}
                            </p>
                            {bill.a && <p className="text-xs text-zinc-400 font-medium leading-relaxed">{bill.a}</p>}
                            <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
                                {bill.p && <p className="text-[11px] text-zinc-500">📞 {bill.p}</p>}
                                {bill.g && <p className="text-[10px] text-zinc-600 font-mono">GST: {bill.g}</p>}
                            </div>
                        </div>

                        {/* Invoice meta */}
                        <div className="bg-zinc-100 px-6 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{t.invoiceNo}</p>
                                <p className="text-xs font-black text-zinc-800 font-mono">{bill.i}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{t.dateTime}</p>
                                <p className="text-xs font-bold text-zinc-700">{fmtDate(bill.d)}</p>
                            </div>
                        </div>

                        {/* Items table */}
                        <div className="px-5 py-4">
                            {/* Header */}
                            <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 pb-2 border-b-2 border-zinc-200 mb-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{t.item}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-center">{t.qty}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">{t.amount}</p>
                            </div>

                            {/* Rows */}
                            <div className="divide-y divide-zinc-100">
                                {bill.l.map((item, idx) => {
                                    const { base, tax, total } = lineTotal(item);
                                    const displayName = txNames?.[idx] ?? item.n;
                                    return (
                                        <div key={idx} className="py-2.5 grid grid-cols-[1fr_auto_auto] gap-x-3 items-start">
                                            <div>
                                                <p className={`text-sm font-bold text-zinc-900 ${translating ? "opacity-50" : ""}`}>
                                                    {displayName}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 font-medium">
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

                            {/* Divider */}
                            <div className="my-3 border-t-2 border-dashed border-zinc-300" />

                            {/* Tax summary */}
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
                            <div className="bg-zinc-950 rounded-2xl px-5 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t.totalAmount}</p>
                                    <p className="text-[10px] text-zinc-600">{bill.l.length} {bill.l.length === 1 ? "item" : "items"}</p>
                                </div>
                                <p className="text-3xl font-black text-emerald-400">{fmtINR(grandTotal)}</p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 text-center">
                            <p className="text-xs font-black text-zinc-800 mb-1">{t.thank}</p>
                            <p className="text-[10px] text-zinc-400 font-medium mb-3">{t.generated}</p>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-zinc-200 rounded-full">
                                <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center">
                                    <span className="text-black text-[8px] font-black">A</span>
                                </div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.poweredBy}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Download button ── */}
                    <button
                        onClick={handleDownload}
                        className="no-print mt-5 w-full flex items-center justify-center gap-2.5 bg-emerald-500 text-black py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Download size={16} />
                        {t.download}
                    </button>

                    <p className="no-print text-center text-[10px] text-zinc-700 font-medium mt-5 leading-relaxed">
                        This receipt was shared digitally — no paper needed.<br />
                        No personal data is collected or stored.
                    </p>
                </div>
            </div>
        </>
    );
}

// ── Page (wrapped in Suspense for useSearchParams) ────────────────────────────
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
