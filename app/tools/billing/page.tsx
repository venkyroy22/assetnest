"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Plus, Trash2, X, Camera, ScanLine,
    RefreshCw, Smartphone, Settings, Check, Edit3,
    Receipt, Store, CameraOff, Package, Copy, ArrowLeft, HelpCircle, StoreIcon
} from "lucide-react";
import { Accordion, AccordionItem } from "@/components/Accordion";
import HelpModal from "@/components/HelpModal";
import { Info } from "lucide-react";
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

// Fixed encoding to safely work with special/Unicode characters
function encodeBill(p: BillPayload): string {
    try {
        const jsonStr = JSON.stringify(p);
        const utf8Bytes = new TextEncoder().encode(jsonStr);
        let binaryStr = "";
        utf8Bytes.forEach(b => binaryStr += String.fromCharCode(b));
        return btoa(binaryStr);
    } catch {
        return "";
    }
}

function loadLS<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
function saveLS(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;900&family=DM+Sans:wght@500;700&display=swap');

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(1px, 1px) !important;
  box-shadow: none !important;
}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
    const [shopInfo, setShopInfo] = useState<ShopInfo>(DEFAULT_SHOP);
    const [items, setItems] = useState<BillItem[]>([]);
    const [invoiceNo, setInvoiceNo] = useState("");  
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
    const [showHelp, setShowHelp] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<{ stop: () => void } | null>(null);  

    // Load persisted data — client only
    useEffect(() => {
        setInvoiceNo(genInvNo());
        setShopInfo(loadLS("billing_shop", DEFAULT_SHOP));
        setCatalog(loadLS("billing_catalog", {}));
    }, []);

    // ── Barcode scanner (ZXing) ───────────────────────
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

    const startScanner = useCallback(() => {
        setScanStatus("starting");
        setScanError("");
        setScanning(true);     
        setPendingStart(true); 
    }, []);

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

                const devices = await BrowserMultiFormatReader.listVideoInputDevices();
                const rearCam = devices.find(d => /back|rear|environment/i.test(d.label));
                const deviceId = rearCam?.deviceId || devices[devices.length - 1]?.deviceId || undefined;

                setScanStatus("active");

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
            s: shopInfo.name || "My Store",
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
        <div className="min-h-screen bg-[#F4ECD8] text-black pb-32 font-sans ig-root relative overflow-x-hidden">
            <style>{GLOBAL_STYLES}</style>

            {/* ── Header ── */}
            <div className="bg-[#F4ECD8] border-b-2 border-black sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/tools"
                            className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-xs shadow-[2px_2px_0_#000] hover:bg-zinc-50"
                        >
                            <ArrowLeft size={12} strokeWidth={2.5} /> BACK
                        </Link>
                        
                        <div className="h-6 w-px bg-black hidden xs:block" />

                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider leading-none mb-1">
                                Smart Billing
                            </span>
                            <h2 className="text-xs sm:text-sm font-black text-black leading-none truncate max-w-[140px] sm:max-w-none uppercase ig-display">
                                {shopInfo.name || "Configure Shop" }
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-tight text-zinc-500 hidden sm:inline uppercase">
                            {invoiceNo}
                        </span>
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border-2 border-black shadow-[2px_2px_0_#000]">
                            <button
                                onClick={() => { setTmpShop(shopInfo); setShopOpen(true); }}
                                className="w-8 h-8 flex items-center justify-center text-black hover:bg-zinc-100 rounded-lg transition-all"
                                title="Shop Settings"
                            >
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={newBill}
                                className="w-8 h-8 flex items-center justify-center text-black hover:bg-zinc-100 rounded-lg transition-all"
                                title="New Bill"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">

                {/* ── Barcode Scanner ── */}
                <div className="border-2 border-black bg-white rounded-3xl overflow-hidden shadow-[4px_4px_0_#000] text-black">
                    <button
                        onClick={scanning ? stopScanner : startScanner}
                        className={`w-full flex items-center justify-between p-4 transition-all ${
                            scanning ? "bg-red-50 text-red-650" : "text-black hover:bg-zinc-50"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border-2 border-black ${
                                scanning ? "bg-red-100" :
                                scanStatus === "error" ? "bg-zinc-100" :
                                "bg-[#fde047]"
                            }`}>
                                {scanning ? <CameraOff size={18} /> : <Camera size={18} />}
                            </div>
                            <div className="text-left">
                                <h3 className="text-sm font-black uppercase tracking-tight ig-display">
                                    {scanning ? "Stop Scanner" : "Scan Barcode"}
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
                                    {scanStatus === "starting" ? "Starting camera…" :
                                        scanStatus === "active" ? "Scanning… point camera at barcode" :
                                        scanStatus === "error" ? (scanError || "Camera error") :
                                        "Supports UPC, EAN, CODE-128 & QR Codes"}
                                </p>
                            </div>
                        </div>
                        <ScanLine size={18} className={scanning ? "text-red-600 animate-pulse" : "text-black"} />
                    </button>

                    {/* Video feed */}
                    <div className={scanning ? "px-4 pb-4 bg-white" : "hidden"}>
                        <div className="relative bg-zinc-950 rounded-2xl overflow-hidden aspect-video border-2 border-black shadow-[2px_2px_0_#000]">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                autoPlay
                            />
                            {scanning && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="relative w-48 h-32">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
                                        <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" style={{ top: "45%" }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-zinc-550 font-bold uppercase mt-2 text-center tracking-wider">
                            Align the barcode inside the camera frame
                        </p>
                    </div>

                    {scanStatus === "error" && scanError && !scanning && (
                        <div className="px-4 pb-4 pt-0">
                            <p className="text-xs font-bold text-red-650 bg-red-50 border-2 border-black rounded-2xl px-4 py-2.5">
                                {scanError}
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Add Item Form ── */}
                <div className="border-2 border-black bg-white rounded-3xl p-5 sm:p-6 space-y-4 shadow-[4px_4px_0_#000] text-black">
                    <div className="flex items-center gap-2 mb-2">
                        <Package size={14} className="text-zinc-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-zinc-500 ig-display">
                            {editId ? "Edit Receipt Item" : "Add Receipt Item"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Barcode field */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                                Barcode / SKU <span className="text-zinc-400 font-bold">(Optional)</span>
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
                                placeholder="Scan or type product barcode"
                                className="w-full bg-zinc-50 border-2 border-black rounded-xl px-4 py-2.5 text-xs font-bold outline-none placeholder:text-zinc-400"
                            />
                            {formBarcode && catalog[formBarcode.trim()] && (
                                <p className="text-[9px] text-emerald-700 font-black uppercase tracking-wider mt-1">
                                    ✓ Auto-filled from catalog records
                                </p>
                            )}
                        </div>

                        {/* Item Name */}
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
                                Product Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addItem()}
                                placeholder="e.g. Organic Green Tea 100g"
                                className="w-full bg-zinc-50 border-2 border-black rounded-xl px-4 py-2.5 text-xs font-bold outline-none placeholder:text-zinc-400"
                            />
                        </div>
                    </div>

                    {/* Price, Qty, GST */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">
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
                                className="w-full bg-zinc-50 border-2 border-black rounded-xl px-3 py-2.5 text-xs font-bold outline-none placeholder:text-zinc-400"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">Qty</label>
                            <input
                                type="number"
                                min="1"
                                value={formQty}
                                onChange={e => setFormQty(e.target.value)}
                                className="w-full bg-zinc-50 border-2 border-black rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block mb-1.5">GST Rate</label>
                            <select
                                value={formGst}
                                onChange={e => setFormGst(Number(e.target.value) as GstRate)}
                                className="w-full bg-zinc-50 border-2 border-black rounded-xl px-2 py-2.5 text-xs font-bold outline-none cursor-pointer"
                            >
                                {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={addItem}
                            disabled={!formName.trim() || !formPrice}
                            className="ig-btn h-12 flex-1 flex items-center justify-center gap-2 bg-[#fde047] text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[3px_3px_0_#000]"
                        >
                            {editId ? <><Check size={14} strokeWidth={2.5} /> Update Item</> : <><Plus size={14} strokeWidth={2.5} /> Add Item</>}
                        </button>
                        {(editId || formName || formBarcode) && (
                            <button
                                onClick={resetForm}
                                className="ig-btn w-12 h-12 flex items-center justify-center border-2 border-black bg-white hover:bg-zinc-50 transition-all rounded-xl shadow-[2px_2px_0_#000] text-black"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Bill Items ── */}
                {items.length > 0 && (
                    <div className="border-2 border-black bg-white rounded-3xl overflow-hidden shadow-[4px_4px_0_#000] text-black">
                        <div className="px-5 py-3 border-b-2 border-black bg-zinc-55 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Receipt size={14} className="text-black" />
                                <span className="text-xs font-black uppercase tracking-wider ig-display">
                                    Current Invoice Items ({items.length})
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-550">
                                {invoiceNo}
                            </span>
                        </div>

                        {/* Items list */}
                        <div className="divide-y-2 divide-black">
                            {items.map((item, idx) => {
                                const { base, tax, total } = itemTotals(item);
                                return (
                                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-zinc-50/50 transition-all">
                                        <span className="text-[10px] font-black text-zinc-400 w-4 shrink-0 text-center">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-black text-black truncate">{item.name}</p>
                                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                                {fmtINR(item.unitPrice)} × {item.qty}
                                                {item.gstRate > 0 && ` + GST ${item.gstRate}%`}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-black">{fmtINR(total)}</p>
                                            {item.gstRate > 0 && (
                                                <p className="text-[9px] text-zinc-500 font-bold uppercase">tax {fmtINR(tax)}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <button onClick={() => startEdit(item)} className="ig-btn p-1.5 border border-black rounded bg-white hover:bg-zinc-50 text-black shadow-[1px_1px_0_#000]">
                                                <Edit3 size={12} />
                                            </button>
                                            <button onClick={() => removeItem(item.id)} className="ig-btn p-1.5 border border-black rounded bg-red-100 hover:bg-red-200 text-red-650 shadow-[1px_1px_0_#000]">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bill Summary */}
                        <div className="border-t-2 border-black bg-zinc-50/55 px-5 py-4 space-y-2">
                            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                <span>Subtotal (Before Tax)</span>
                                <span className="font-black text-black">{fmtINR(subtotal)}</span>
                            </div>

                            {gstBreakdown.map(g => (
                                <div key={g.rate} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        <span>CGST @ {g.rate / 2}% on {fmtINR(g.taxable)}</span>
                                        <span>{fmtINR(g.cgst)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                                        <span>SGST @ {g.rate / 2}% on {fmtINR(g.taxable)}</span>
                                        <span>{fmtINR(g.sgst)}</span>
                                    </div>
                                </div>
                            ))}

                            {totalTax > 0 && (
                                <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    <span>Cumulative Tax Amount</span>
                                    <span className="font-black text-black">{fmtINR(totalTax)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-3 border-t-2 border-dashed border-black">
                                <span className="text-xs font-black uppercase tracking-wider text-black ig-display">Grand Total</span>
                                <span className="text-xl font-black text-black leading-none">{fmtINR(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Generate QR CTA ── */}
                {items.length > 0 && (
                    <button
                        onClick={generateQR}
                        className="ig-btn h-12 w-full flex items-center justify-center gap-2 bg-[#fde047] text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[3px_3px_0_#000]"
                    >
                        <Smartphone size={16} />
                        Generate Customer QR Receipt
                    </button>
                )}

                {/* ── Empty state ── */}
                {items.length === 0 && (
                    <div className="text-center py-16 bg-white border-2 border-black rounded-3xl shadow-[4px_4px_0_#000]">
                        <div className="w-14 h-14 bg-zinc-50 border-2 border-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0_#000]">
                            <Receipt size={24} className="text-black" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-black ig-display">No Bill Items</h4>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
                            Scan a barcode or add details manually to start
                        </p>
                    </div>
                )}
            </div>

            <HelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                title="Paperless Billing Guide"
            >
                <div className="max-w-2xl mx-auto space-y-8 py-4 text-black text-left">
                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Instant Contactless Invoicing</h3>
                        <p className="text-sm text-zinc-650 leading-relaxed font-medium">
                            Smart Invoicing provides small business owners and retail operators a fast, 100% private route to draft bills. By embedding customer-facing QR receipts, we bypass standard paper printer workflows.
                        </p>
                    </section>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="space-y-2 p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000]">
                            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5"><ScanLine size={13}/> Barcode Reading</h4>
                            <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                                Decodes standard product identifiers (EAN, UPC, Code 39) client-side. Autofills information if the code matches inventory catalog histories.
                            </p>
                        </section>
                        
                        <section className="space-y-2 p-4 bg-zinc-50 border-2 border-black rounded-2xl shadow-[2px_2px_0_#000]">
                            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5"><Smartphone size={13}/> Mobile Receipts</h4>
                            <p className="text-[11px] text-zinc-600 font-semibold leading-relaxed">
                                Encrypts the entire transaction data directly within the URL. Generating a QR allows the client to scan and view their GST-split receipt immediately.
                            </p>
                        </section>
                    </div>

                    <section className="space-y-3">
                        <h3 className="text-lg font-bold text-black ig-display">Frequently Asked Questions</h3>
                        <Accordion>
                            <AccordionItem title="Where is shop data stored?">
                                Everything is hosted locally inside your browser cookies/LocalStorage. No transactional info ever touches external databases.
                            </AccordionItem>
                            <AccordionItem title="Are barcodes required to add items?">
                                Not at all. Simply leave the Barcode/SKU input blank and type the product name and price directly.
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>
            </HelpModal>

            {/* ── QR Receipt Modal ── */}
            {showQR && qrDataUrl && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#000]/40 backdrop-blur-sm"
                    onClick={() => setShowQR(false)}>
                    <div className="bg-white border-2 border-black rounded-[2rem] p-6 w-full max-w-sm shadow-[8px_8px_0_#000] text-black"
                        onClick={e => e.stopPropagation()}>

                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Contactless Receipt</p>
                                <h3 className="text-base font-black uppercase tracking-tight ig-display text-black">Scan QR Code</h3>
                            </div>
                            <button onClick={() => setShowQR(false)}
                                className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg text-black shadow-[1.5px_1.5px_0_#000]">
                                <X size={14} />
                            </button>
                        </div>

                        {/* QR Code Graphic */}
                        <div className="bg-white p-3 border-2 border-black rounded-2xl mb-4 shadow-inner flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={qrDataUrl} alt="Bill QR Code" className="w-64 h-64 object-contain" />
                        </div>

                        {/* Total details */}
                        <div className="flex items-center justify-between mb-4 px-1 bg-zinc-50 border-2 border-black p-3 rounded-xl">
                            <div>
                                <p className="text-[9px] font-black uppercase text-zinc-500">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                                <p className="text-xl font-black text-black leading-none">{fmtINR(grandTotal)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-zinc-400">{invoiceNo}</p>
                                <p className="text-[9px] font-black text-zinc-400 mt-0.5">
                                    {new Date().toLocaleDateString("en-IN")}
                                </p>
                            </div>
                        </div>

                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider text-center mb-4 leading-relaxed">
                            Point a mobile camera to access the digital receipt URL instantly.
                        </p>

                        <button onClick={copyLink}
                            className="ig-btn w-full flex items-center justify-center gap-1.5 py-3.5 bg-white hover:bg-zinc-50 text-black border-2 border-black rounded-xl text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_#000]">
                            {copied ? <><Check size={13} strokeWidth={2.5} /> Link Copied!</> : <><Copy size={13} /> Copy Receipt Link</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Shop Settings Modal ── */}
            {shopOpen && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-[#000]/40 backdrop-blur-sm"
                    onClick={() => setShopOpen(false)}>
                    <div className="bg-white border-2 border-black rounded-[2.5rem] p-6 w-full max-w-sm shadow-[8px_8px_0_#000] text-black"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <StoreIcon size={16} className="text-black" />
                                <h3 className="text-sm font-black uppercase tracking-tight ig-display">Configure Shop</h3>
                            </div>
                            <button onClick={() => setShopOpen(false)}
                                className="p-1.5 border-2 border-black hover:bg-zinc-100 rounded-lg text-black shadow-[1.5px_1.5px_0_#000]">
                                <X size={14} />
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {[
                                { label: "Shop / Store Name *", key: "name", placeholder: "e.g. Ravi Grocery Hub" },
                                { label: "Store Address", key: "address", placeholder: "e.g. Sector-4, New Delhi" },
                                { label: "GSTIN Identification Number", key: "gstNumber", placeholder: "e.g. 07AAAAA1111A1Z0" },
                                { label: "Contact Phone Number", key: "phone", placeholder: "e.g. +91 99999 88888" },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500 block mb-1">{f.label}</label>
                                    <input
                                        type="text"
                                        value={tmpShop[f.key as keyof ShopInfo]}
                                        onChange={e => setTmpShop(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full bg-zinc-50 border-2 border-black rounded-xl px-4 py-2.5 text-xs font-bold outline-none placeholder:text-zinc-450 text-black"
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={saveShop}
                            className="ig-btn mt-5 w-full flex items-center justify-center gap-2 bg-[#fde047] text-black border-2 border-black py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_#000]">
                            <Check size={13} strokeWidth={2.5} /> Save Shop Info
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
