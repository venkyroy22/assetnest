"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Plus, Trash2, X, Camera, ScanLine,
    RefreshCw, Smartphone, Settings, Check, Edit3,
    Receipt, Store, CameraOff, Package, Copy,
} from "lucide-react";
import QRCode from "qrcode";

// ── Types ─────────────────────────────────────────────────────────────────────
type GstRate = 0 | 5 | 12 | 18 | 28;

interface BillItem {
    id: string;
    name: string;
    qty: number;
    unitPrice: number;
    gstRate: GstRate;
}

interface ShopInfo {
    name: string;
    address: string;
    gstNumber: string;
    phone: string;
}

interface BillPayload {
    s: string;    // shop name
    a?: string;   // address
    g?: string;   // GST number
    p?: string;   // phone
    i: string;    // invoice number
    d: string;    // date-time ISO
    l: Array<{ n: string; q: number; r: number; t: number }>;
}

interface CatalogItem { name: string; unitPrice: number; gstRate: GstRate; }
type Catalog = Record<string, CatalogItem>;

// ── Constants ─────────────────────────────────────────────────────────────────
const GST_RATES: GstRate[] = [0, 5, 12, 18, 28];
const DEFAULT_SHOP: ShopInfo = { name: "", address: "", gstNumber: "", phone: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function genInvNo() {
    const n = new Date();
    const p = (x: number) => x.toString().padStart(2, "0");
    return `INV-${n.getFullYear().toString().slice(-2)}${p(n.getMonth() + 1)}${p(n.getDate())}-${((Math.random() * 9000 + 1000) | 0)}`;
}

function fmtINR(n: number) {
    return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function itemTotals(item: BillItem) {
    const base = item.qty * item.unitPrice;
    const tax = (base * item.gstRate) / 100;
    return { base, tax, total: base + tax };
}

function encodeBill(p: BillPayload): string {
    try { return btoa(encodeURIComponent(JSON.stringify(p))); } catch { return ""; }
}

function loadLS<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
    const [shopInfo, setShopInfo] = useState<ShopInfo>(DEFAULT_SHOP);
    const [items, setItems] = useState<BillItem[]>([]);
    const [invoiceNo, setInvoiceNo] = useState("");  // set in useEffect to avoid SSR mismatch
    const [catalog, setCatalog] = useState<Catalog>({});

    // Scanner
    const [scanning, setScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState<"idle" | "starting" | "active" | "error">("idle");
    const [scanError, setScanError] = useState("");

    // Form
    const [formName, setFormName] = useState("");
    const [formBarcode, setFormBarcode] = useState("");
    const [formQty, setFormQty] = useState("1");
    const [formPrice, setFormPrice] = useState("");
    const [formGst, setFormGst] = useState<GstRate>(18);
    const [editId, setEditId] = useState<string | null>(null);

    // QR / share
    const [showQR, setShowQR] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [billUrl, setBillUrl] = useState("");
    const [copied, setCopied] = useState(false);

    // Shop editor
    const [shopOpen, setShopOpen] = useState(false);
    const [tmpShop, setTmpShop] = useState<ShopInfo>(DEFAULT_SHOP);

    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<{ stop: () => void } | null>(null);  // IScannerControls from ZXing

    // Load persisted data — client only (avoids hydration mismatch)
    useEffect(() => {
        setInvoiceNo(genInvNo());
        setShopInfo(loadLS("billing_shop", DEFAULT_SHOP));
        setCatalog(loadLS("billing_catalog", {}));
    }, []);

    // ── Barcode scanner (ZXing — works on all browsers) ───────────────────────
    const [pendingStart, setPendingStart] = useState(false);

    const stopScanner = useCallback(() => {
        if (controlsRef.current) {
            try { controlsRef.current.stop(); } catch { }
            controlsRef.current = null;
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setScanning(false);
        setPendingStart(false);
        setScanStatus("idle");
    }, []);

    // Step 1: user clicks → set scanning:true so video mounts, flag pendingStart
    const startScanner = useCallback(() => {
        setScanStatus("starting");
        setScanError("");
        setScanning(true);     // render video element now
        setPendingStart(true); // useEffect will fire once video is in DOM
    }, []);

    // Step 2: after render (videoRef is now valid), kick off ZXing
    useEffect(() => {
        if (!pendingStart || !videoRef.current) return;
        setPendingStart(false);

        (async () => {
            try {
                const { BrowserMultiFormatReader, BarcodeFormat } = await import("@zxing/browser");
                const { DecodeHintType: HintType } = await import("@zxing/library");

                const hints = new Map();
                hints.set(HintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
                    BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
                    BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
                    BarcodeFormat.CODABAR, BarcodeFormat.ITF,
                    BarcodeFormat.QR_CODE,
                ]);
                hints.set(HintType.TRY_HARDER, true);

                const reader = new BrowserMultiFormatReader(hints);

                // Prefer rear camera on phones
                const devices = await BrowserMultiFormatReader.listVideoInputDevices();
                const rearCam = devices.find(d => /back|rear|environment/i.test(d.label));
                const deviceId = rearCam?.deviceId || devices[devices.length - 1]?.deviceId || undefined;

                setScanStatus("active");

                // decodeFromVideoDevice returns IScannerControls — store it for stopScanner
                const controls = await reader.decodeFromVideoDevice(
                    deviceId,
                    videoRef.current!,
                    (result, _err, cbControls) => {
                        if (result) {
                            const code = result.getText();
                            cbControls.stop();
                            controlsRef.current = null;
                            stopScanner();
                            setFormBarcode(code);
                            const hit = loadLS<Catalog>("billing_catalog", {})[code];
                            if (hit) {
                                setFormName(hit.name);
                                setFormPrice(hit.unitPrice.toString());
                                setFormGst(hit.gstRate);
                            }
                        }
                    }
                );
                controlsRef.current = controls;
            } catch (e: unknown) {
                console.error("Scanner error:", e);
                const msg = e instanceof Error ? e.message : String(e);
                setScanError(
                    msg.includes("Permission") || msg.includes("NotAllowed")
                        ? "Camera permission denied. Please allow camera access."
                        : "Could not start camera. Try typing the barcode manually."
                );
                setScanStatus("error");
                setScanning(false);
            }
        })();
    }, [pendingStart, stopScanner]);

    // ── Item actions ───────────────────────────────────────────────────────────
    const addItem = () => {
        const name = formName.trim();
        const price = parseFloat(formPrice);
        const qty = Math.max(1, parseInt(formQty) || 1);
        if (!name || isNaN(price) || price <= 0) return;

        if (formBarcode.trim()) {
            const newCat = { ...catalog, [formBarcode.trim()]: { name, unitPrice: price, gstRate: formGst } };
            setCatalog(newCat);
            saveLS("billing_catalog", newCat);
        }

        if (editId) {
            setItems(prev => prev.map(it => it.id === editId
                ? { ...it, name, qty, unitPrice: price, gstRate: formGst } : it));
            setEditId(null);
        } else {
            setItems(prev => [...prev, { id: crypto.randomUUID(), name, qty, unitPrice: price, gstRate: formGst }]);
        }
        resetForm();
    };

    const resetForm = () => {
        setFormName(""); setFormBarcode(""); setFormQty("1");
        setFormPrice(""); setFormGst(18); setEditId(null);
    };

    const startEdit = (item: BillItem) => {
        setEditId(item.id);
        setFormName(item.name); setFormQty(item.qty.toString());
        setFormPrice(item.unitPrice.toString()); setFormGst(item.gstRate);
        setFormBarcode("");
    };

    const removeItem = (id: string) => setItems(p => p.filter(i => i.id !== id));

    // ── Totals ────────────────────────────────────────────────────────────────
    const subtotal = items.reduce((s, it) => s + itemTotals(it).base, 0);
    const totalTax = items.reduce((s, it) => s + itemTotals(it).tax, 0);
    const grandTotal = subtotal + totalTax;

    const gstBreakdown = GST_RATES.map(rate => {
        const taxable = items.filter(it => it.gstRate === rate).reduce((s, it) => s + itemTotals(it).base, 0);
        return { rate, taxable, cgst: (taxable * rate) / 200, sgst: (taxable * rate) / 200 };
    }).filter(x => x.taxable > 0);

    // ── Generate QR ───────────────────────────────────────────────────────────
    const generateQR = async () => {
        if (items.length === 0) return;
        const payload: BillPayload = {
            s: shopInfo.name || "My Shop",
            a: shopInfo.address || undefined,
            g: shopInfo.gstNumber || undefined,
            p: shopInfo.phone || undefined,
            i: invoiceNo,
            d: new Date().toISOString(),
            l: items.map(it => ({ n: it.name, q: it.qty, r: it.unitPrice, t: it.gstRate })),
        };
        const siteUrl = window.location.origin;
        const url = `${siteUrl}/tools/billing/view?d=${encodeBill(payload)}`;
        setBillUrl(url);
        try {
            const dataUrl = await QRCode.toDataURL(url, {
                width: 512, margin: 2, errorCorrectionLevel: "M",
                color: { dark: "#000000", light: "#ffffff" },
            });
            setQrDataUrl(dataUrl);
            setShowQR(true);
        } catch (e) { console.error(e); }
    };

    const saveShop = () => {
        setShopInfo(tmpShop);
        saveLS("billing_shop", tmpShop);
        setShopOpen(false);
    };

    const newBill = () => {
        setItems([]); setInvoiceNo(genInvNo());
        setShowQR(false); setQrDataUrl(""); setBillUrl("");
        resetForm();
    };

    const copyLink = async () => {
        await navigator.clipboard.writeText(billUrl).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#fafafc] text-zinc-900 pb-32 font-sans antialiased">

            {/* ── Header ── */}
            <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
                <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-zinc-950/20">
                            <Receipt size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Merchant Hub</p>
                            <p className="text-sm font-black text-black leading-tight truncate max-w-[180px]">
                                {shopInfo.name || "Configure Shop" }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100 hidden sm:inline">
                            {invoiceNo}
                        </span>
                        <button
                            onClick={() => { setTmpShop(shopInfo); setShopOpen(true); }}
                            className="p-2.5 bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-black transition-all rounded-xl shadow-sm"
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={newBill}
                            className="p-2.5 bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-black transition-all rounded-xl shadow-lg shadow-black/10"
                            title="New Bill"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

                {/* ── Barcode Scanner — ZXing (works on all browsers) ── */}
                <div className="border border-zinc-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <button
                        onClick={scanning ? stopScanner : startScanner}
                        className={`w-full flex items-center justify-between p-4 transition-all ${scanning ? "text-red-500" : "text-zinc-600 hover:text-black active:bg-zinc-50"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${scanning ? "bg-red-500/10 border-red-500/30" :
                                scanStatus === "error" ? "bg-amber-500/10 border-amber-500/30" :
                                    "bg-zinc-800 border-zinc-700"
                                }`}>
                                {scanning ? <CameraOff size={18} /> : <Camera size={18} />}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black">
                                    {scanning ? "Stop Scanner" : "Scan Barcode"}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-medium">
                                    {scanStatus === "starting" ? "Starting camera…" :
                                        scanStatus === "active" ? "Scanning… point camera at barcode" :
                                            scanStatus === "error" ? (scanError || "Camera error") :
                                                "Works on all browsers — Chrome, Safari, Firefox"}
                                </p>
                            </div>
                        </div>
                        <ScanLine size={18} className={scanning ? "text-red-500 animate-pulse" : "text-zinc-300"} />
                    </button>

                    {/* Video feed — always in DOM so videoRef is always valid.
                         CSS visibility toggled by scanning state. */}
                    <div className={scanning ? "px-4 pb-4" : "hidden"}>
                        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                autoPlay
                            />
                            {/* Scanner frame overlay */}
                            {scanning && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="relative w-52 h-36">
                                        <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg" />
                                        {/* Animated scan line */}
                                        <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" style={{ top: "45%" }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium mt-2 text-center">
                            Hold barcode steady inside the green frame
                        </p>
                    </div>

                    {scanStatus === "error" && scanError && !scanning && (
                        <div className="px-4 pb-4 pt-0">
                            <p className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
                                {scanError}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Add Item Form ── */}
                <div className="border border-zinc-200 bg-white rounded-2xl p-6 space-y-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            {editId ? "Edit Item" : "Add Item"}
                        </span>
                    </div>

                    {/* Barcode field (shows when scanned barcode or typed) */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                            Barcode / SKU <span className="text-zinc-700 normal-case font-medium">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={formBarcode}
                            onChange={e => {
                                setFormBarcode(e.target.value);
                                const hit = catalog[e.target.value.trim()];
                                if (hit) {
                                    setFormName(hit.name);
                                    setFormPrice(hit.unitPrice.toString());
                                    setFormGst(hit.gstRate);
                                }
                            }}
                            placeholder="Manually enter or scan…"
                            className="w-full bg-zinc-50 border border-zinc-200 focus:border-black rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                        />
                        {formBarcode && catalog[formBarcode.trim()] && (
                            <p className="text-[10px] text-emerald-600 font-black mt-2">
                                ✓ Found in your catalog — auto-filled
                            </p>
                        )}
                    </div>

                    {/* Item Name */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addItem()}
                            placeholder="e.g. Fresh Milk 1L"
                            className="w-full bg-zinc-50 border border-zinc-200 focus:border-black rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    {/* Price, Qty, GST */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formPrice}
                                onChange={e => setFormPrice(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addItem()}
                                placeholder="0.00"
                                className="w-full bg-zinc-50 border border-zinc-200 focus:border-black rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">Qty</label>
                            <input
                                type="number"
                                min="1"
                                value={formQty}
                                onChange={e => setFormQty(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 focus:border-black rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1.5">GST %</label>
                            <select
                                value={formGst}
                                onChange={e => setFormGst(Number(e.target.value) as GstRate)}
                                className="w-full bg-zinc-50 border border-zinc-200 focus:border-black rounded-xl px-2 py-3 text-sm font-bold text-zinc-900 outline-none transition-all cursor-pointer"
                            >
                                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={addItem}
                            disabled={!formName.trim() || !formPrice}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-black py-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                        >
                            {editId ? <><Check size={16} /> Update Item</> : <><Plus size={16} /> Add Item</>}
                        </button>
                        {(editId || formName || formBarcode) && (
                            <button
                                onClick={resetForm}
                                className="p-4 border border-zinc-200 text-zinc-400 hover:border-zinc-400 hover:text-black transition-all rounded-xl hover:bg-zinc-50"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Bill Items ── */}
                {items.length > 0 && (
                    <div className="border border-zinc-200 bg-white rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                            <div className="flex items-center gap-2">
                                <Receipt size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    Bill Items ({items.length})
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                {invoiceNo}
                            </span>
                        </div>

                        {/* Items list */}
                        <div className="divide-y divide-zinc-100">
                            {items.map((item, idx) => {
                                const { base, tax, total } = itemTotals(item);
                                return (
                                    <div key={item.id} className="flex items-start gap-4 px-6 py-4 hover:bg-zinc-50/50 transition-all group">
                                        <span className="text-[10px] font-black text-zinc-300 mt-1.5 w-4 shrink-0 font-mono">0{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-black truncate">{item.name}</p>
                                            <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-wide">
                                                {fmtINR(item.unitPrice)} × {item.qty}
                                                {item.gstRate > 0 && ` + GST ${item.gstRate}%`}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-black">{fmtINR(total)}</p>
                                            {item.gstRate > 0 && (
                                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">tax {fmtINR(tax)}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEdit(item)} className="p-2 text-zinc-300 hover:text-black hover:bg-zinc-100 transition-all rounded-lg">
                                                <Edit3 size={14} />
                                            </button>
                                            <button onClick={() => removeItem(item.id)} className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bill Summary */}
                        <div className="border-t border-zinc-100 bg-zinc-50/30 px-6 py-5 space-y-2.5">
                            <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span className="text-zinc-600">{fmtINR(subtotal)}</span>
                            </div>

                            {gstBreakdown.map(g => (
                                <div key={g.rate} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-[0.05em]">
                                        <span>CGST {g.rate / 2}% (on {g.rate === 0 ? 'Exempt' : fmtINR(g.taxable)})</span>
                                        <span>{fmtINR(g.cgst)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-[0.05em]">
                                        <span>SGST {g.rate / 2}% (on {g.rate === 0 ? 'Exempt' : fmtINR(g.taxable)})</span>
                                        <span>{fmtINR(g.sgst)}</span>
                                    </div>
                                </div>
                            ))}

                            {totalTax > 0 && (
                                <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest pt-1">
                                    <span>Total Tax</span>
                                    <span className="text-zinc-600">{fmtINR(totalTax)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-4 mt-2 border-t border-zinc-200 items-center">
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-black">Grand Total</span>
                                <span className="text-2xl font-black text-emerald-600">{fmtINR(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Generate QR CTA ── */}
                {items.length > 0 && (
                    <button
                        onClick={generateQR}
                        className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black py-5 rounded-2xl text-sm font-black uppercase tracking-[0.1em] hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-2xl shadow-emerald-500/20"
                    >
                        <Smartphone size={20} />
                        Generate Customer QR Code
                    </button>
                )}

                {/* ── Empty state ── */}
                {items.length === 0 && (
                    <div className="text-center py-20 bg-white border border-zinc-200 rounded-[2rem] shadow-sm">
                        <div className="w-20 h-20 bg-zinc-50 border border-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Receipt size={32} className="text-zinc-300" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-2">Checkout Empty</p>
                        <p className="text-sm text-zinc-400 font-bold max-w-[200px] mx-auto leading-relaxed">
                            Scan a product or add items manually to begin.
                        </p>
                    </div>
                )}
            </div>

            <footer className="max-w-4xl mx-auto px-6 py-10 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-300">
                    Smart Billing System — Safe, Fast, Digital
                </p>
            </footer>

            {/* ── QR Modal ── */}
            {showQR && qrDataUrl && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShowQR(false)}>
                    <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)] border border-white"
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <ScanLine size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-0.5">Share Receipt</p>
                                    <p className="text-sm font-black text-black">Customer QR Code</p>
                                </div>
                            </div>
                            <button onClick={() => setShowQR(false)}
                                className="p-2 text-zinc-300 hover:text-black transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* QR Code */}
                        <div className="bg-white p-3 rounded-3xl mb-8 border-[3px] border-zinc-50 shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrDataUrl} alt="Bill QR Code" className="w-full h-auto" />
                        </div>

                        {/* Total reminder */}
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                                <p className="text-3xl font-black text-black">{fmtINR(grandTotal)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{invoiceNo}</p>
                                <p className="text-[10px] text-zinc-500 font-bold mt-1">
                                    {new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                        </div>

                        {/* Copy link */}
                        <button onClick={copyLink}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg ${copied ? "bg-emerald-500 text-black shadow-emerald-500/20" : "bg-black text-emerald-400 shadow-black/20"}`}>
                            {copied ? <><Check size={14} /> Link Copied!</> : <><Copy size={14} /> Copy Receipt Link</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Shop Settings Modal ── */}
            {shopOpen && (
                <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setShopOpen(false)}>
                    <div className="bg-white border border-white rounded-[2rem] p-8 w-full max-w-sm shadow-[0_32px_128px_-12px_rgba(0,0,0,0.3)]"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-100 rounded-2xl flex items-center justify-center">
                                    <Store size={20} className="text-zinc-600" />
                                </div>
                                <p className="text-base font-black text-black">Shop Profile</p>
                            </div>
                            <button onClick={() => setShopOpen(false)}
                                className="p-2 text-zinc-300 hover:text-black transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Business Name *", key: "name", placeholder: "e.g. Ravi General Store" },
                                { label: "Business Address", key: "address", placeholder: "Area, City, State" },
                                { label: "GST Number", key: "gstNumber", placeholder: "e.g. 22AAAAA0000A1Z5" },
                                { label: "Public Phone", key: "phone", placeholder: "e.g. +91 9876543210" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 block mb-1.5">{f.label}</label>
                                    <input
                                        type="text"
                                        value={tmpShop[f.key as keyof ShopInfo]}
                                        onChange={e => setTmpShop(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full bg-zinc-50 border border-zinc-100 focus:border-black rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none transition-all placeholder:text-zinc-300"
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={saveShop}
                            className="mt-8 w-full flex items-center justify-center gap-3 bg-emerald-500 text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                            <Check size={16} /> Save Business Profile
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

