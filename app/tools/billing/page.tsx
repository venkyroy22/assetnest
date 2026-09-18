"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Plus, Trash2, Printer, Check, X, Camera, RefreshCw, Smartphone, 
  Receipt, Search, Settings, ScanLine, Tag, ArrowLeft, Store, 
  HelpCircle, ShieldCheck, Download, Share2, Edit3, ExternalLink,
  ChevronDown, Copy, Layers, Sparkles, CheckCircle2
} from "lucide-react";
import HelpModal from "@/components/HelpModal";
import QRCode from "qrcode";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#333333",
  surface:     "#3a3a3a",
  surfaceHi:   "#444444",
  surfaceHov:  "#505050",
  border:      "#555555",
  borderDim:   "#2a2a2a",
  accent:      "#4db8d4",
  accentDark:  "#2a7a8f",
  accentDim:   "rgba(77,184,212,0.15)",
  textPri:     "#cccccc",
  textSec:     "#999999",
  muted:       "#777777",
  danger:      "#cc4444",
  success:     "#7dcea0",
  font:        "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
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

// ─── Constants ─────────────────────────────────────────────────────────────────
const GST_RATES: GstRate[] = [0, 5, 12, 18, 28];
const DEFAULT_SHOP: ShopInfo = { name: "My Store", address: "", gstNumber: "", phone: "" };

// ─── Helpers ───────────────────────────────────────────────────────────────────
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
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

function saveLS(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 8px", borderRadius: 2,
      background: T.surface, border: `1px solid ${T.border}`,
      fontSize: 10, fontWeight: 400, color: "#aaa",
    }}>
      {icon}{label}
    </span>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3,
      padding: "8px 10px", cursor: "pointer", transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ fontSize: 11, fontWeight: 400, color: T.textPri, margin: 0, display: "flex", gap: 6, alignItems: "flex-start" }}>
          <span style={{ color: T.accent }}>Q:</span><span>{question}</span>
        </h4>
        <span style={{ color: T.textSec, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", fontSize: 9, flexShrink: 0 }}>▼</span>
      </div>
      <div style={{ maxHeight: open ? 500 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "all 0.2s", marginTop: open ? 8 : 0 }}>
        <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.5, margin: 0, paddingLeft: 18, fontWeight: 400 }}>{answer}</p>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function BillingPage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo>(DEFAULT_SHOP);
  const [items, setItems] = useState<BillItem[]>([]);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [catalog, setCatalog] = useState<Catalog>({});

  // Scanner states
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "starting" | "active" | "error">("idle");
  const [scanError, setScanError] = useState("");
  const [pendingStart, setPendingStart] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formQty, setFormQty] = useState("1");
  const [formPrice, setFormPrice] = useState("");
  const [formGst, setFormGst] = useState<GstRate>(18);
  const [editId, setEditId] = useState<string | null>(null);

  // QR / Modal states
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [billUrl, setBillUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Shop editor & help
  const [shopOpen, setShopOpen] = useState(false);
  const [tmpShop, setTmpShop] = useState<ShopInfo>(DEFAULT_SHOP);
  const [showHelp, setShowHelp] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  // Load initial data on mount
  useEffect(() => {
    setIsClient(true);
    setInvoiceNo(genInvNo());
    setShopInfo(loadLS("billing_shop", DEFAULT_SHOP));
    setCatalog(loadLS("billing_catalog", {}));
  }, []);

  // ── Barcode scanner (ZXing) ─────────────────────────
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
            ? "Camera permission denied. Please allow camera access in your browser."
            : "Could not access video device. You can type the barcode or SKU manually."
        );
        setScanStatus("error");
        setScanning(false);
      }
    })();
  }, [pendingStart, stopScanner]);

  // ── Item actions ─────────────────────────────────────
  const resetForm = () => {
    setFormName("");
    setFormBarcode("");
    setFormQty("1");
    setFormPrice("");
    setFormGst(18);
    setEditId(null);
  };

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
      setItems(prev => [...prev, { id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name, qty, unitPrice: price, gstRate: formGst }]);
    }
    resetForm();
  };

  const startEdit = (item: BillItem) => {
    setEditId(item.id);
    setFormName(item.name);
    setFormQty(item.qty.toString());
    setFormPrice(item.unitPrice.toString());
    setFormGst(item.gstRate);
    setFormBarcode("");
  };

  const removeItem = (id: string) => setItems(p => p.filter(i => i.id !== id));

  // ── Totals ───────────────────────────────────────────
  const subtotal = items.reduce((s, it) => s + itemTotals(it).base, 0);
  const totalTax = items.reduce((s, it) => s + itemTotals(it).tax, 0);
  const grandTotal = subtotal + totalTax;

  const gstBreakdown = GST_RATES.map(rate => {
    const taxable = items.filter(it => it.gstRate === rate).reduce((s, it) => s + itemTotals(it).base, 0);
    return { rate, taxable, cgst: (taxable * rate) / 200, sgst: (taxable * rate) / 200 };
  }).filter(x => x.taxable > 0);

  // ── Generate QR ─────────────────────────────────────
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
        width: 480,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch (e) {
      console.error("QR Generation error:", e);
    }
  };

  const saveShop = () => {
    setShopInfo(tmpShop);
    saveLS("billing_shop", tmpShop);
    setShopOpen(false);
  };

  const newBill = () => {
    if (items.length > 0 && !confirm("Start a new invoice? Current unsaved items will be cleared.")) return;
    setItems([]);
    setInvoiceNo(genInvNo());
    setShowQR(false);
    setQrDataUrl("");
    setBillUrl("");
    resetForm();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(billUrl).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isClient) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${T.accent}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.textPri, display: "flex", flexDirection: "column" }}>
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="no-print" style={{
        height: 48, background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", position: "sticky", top: 0, zIndex: 40, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/tools" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            color: T.textSec, textDecoration: "none", fontSize: 12,
            padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
            border: `1px solid ${T.border}`, transition: "color 0.15s",
          }}>
            <ArrowLeft size={13} /> Back
          </Link>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 4, background: T.accentDim,
              border: `1px solid ${T.accent}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.accent,
            }}>
              <Receipt size={13} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 500, color: T.textPri }}>Smart Billing & POS</span>
              <span style={{ fontSize: 10, color: T.textSec, marginLeft: 8 }}>GST Ready</span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={() => { setTmpShop(shopInfo); setShopOpen(true); }}
            title="Configure Store Profile & GSTIN"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 9px", borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11,
              cursor: "pointer",
            }}
          >
            <Store size={12} style={{ color: T.accent }} />
            <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {shopInfo.name || "Configure Shop"}
            </span>
          </button>

          <button
            onClick={newBill}
            title="Create New Blank Bill"
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={12} /> New Bill
          </button>

          {items.length > 0 && (
            <button
              onClick={handlePrint}
              title="Print Receipt (Thermal or A4)"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
                border: `1px solid ${T.border}`, color: T.textPri, fontSize: 11,
                cursor: "pointer",
              }}
            >
              <Printer size={12} /> Print
            </button>
          )}

          <button
            onClick={() => setShowHelp(true)}
            title="Help & Documentation"
            style={{
              width: 28, height: 28, borderRadius: 3, background: T.surfaceHi,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.textSec, cursor: "pointer",
            }}
          >
            <HelpCircle size={14} />
          </button>
        </div>
      </header>

      {/* ── Main Workspace ──────────────────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 960, width: "100%", margin: "0 auto", padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
        
        {/* ── Store & Invoice Status Ribbon ── */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
          padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4, background: T.surfaceHi,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: T.accent, flexShrink: 0,
            }}>
              <Store size={16} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.textPri }}>{shopInfo.name || "Default Store"}</span>
                {shopInfo.gstNumber && (
                  <span style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 2,
                    background: T.accentDim, border: `1px solid ${T.accent}`, color: T.accent,
                    fontFamily: "monospace",
                  }}>
                    GSTIN: {shopInfo.gstNumber}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: T.textSec, margin: "2px 0 0" }}>
                {shopInfo.address ? `${shopInfo.address} • ` : ""}{shopInfo.phone ? `${shopInfo.phone}` : "No phone specified"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 9, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>Invoice Reference</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: T.accent, fontWeight: 600 }}>{invoiceNo}</span>
            </div>
            <button
              onClick={() => { setTmpShop(shopInfo); setShopOpen(true); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "4px 8px", borderRadius: 3, background: T.surfaceHi,
                border: `1px solid ${T.border}`, color: T.textPri, fontSize: 10,
                cursor: "pointer",
              }}
            >
              <Settings size={11} /> Edit Profile
            </button>
          </div>
        </div>

        {/* ── Barcode Scanner Card ── */}
        <div className="no-print" style={{
          background: T.surface, border: `1px solid ${scanning ? T.accent : T.border}`,
          borderRadius: 4, overflow: "hidden", transition: "border-color 0.15s",
        }}>
          <div style={{
            padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
            background: scanning ? T.accentDim : T.surfaceHi, borderBottom: scanning ? `1px solid ${T.accent}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 3,
                background: scanning ? T.accent : T.surface,
                border: `1px solid ${scanning ? T.accent : T.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: scanning ? "#111" : T.accent,
              }}>
                <Camera size={13} />
              </div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>
                  {scanning ? "Live Camera Scanner Active" : "Barcode & QR Scanner"}
                </span>
                <span style={{ fontSize: 10, color: T.textSec, marginLeft: 8 }}>
                  {scanStatus === "starting" ? "Starting camera…" :
                   scanStatus === "active" ? "Point camera at item barcode" :
                   scanStatus === "error" ? "Camera device error" :
                   "Auto-detects EAN-13, UPC, Code 128, QR"}
                </span>
              </div>
            </div>

            <button
              onClick={scanning ? stopScanner : startScanner}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 3,
                background: scanning ? T.danger : T.accent,
                border: "none", color: "#111", fontSize: 11, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <ScanLine size={13} />
              {scanning ? "Stop Camera" : "Scan Barcode"}
            </button>
          </div>

          {/* Scanner Viewport */}
          {scanning && (
            <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: T.bg }}>
              <div style={{
                position: "relative", width: "100%", maxWidth: 440, aspectRatio: "16/9",
                background: "#111", borderRadius: 4, overflow: "hidden", border: `1px solid ${T.border}`,
              }}>
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  muted
                  playsInline
                  autoPlay
                />
                {/* Viewfinder crosshairs */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    position: "relative", width: 220, height: 120,
                    border: `1px solid rgba(77,184,212,0.4)`,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                  }}>
                    {/* Corner Reticles */}
                    <div style={{ position: "absolute", top: -1, left: -1, width: 14, height: 14, borderTop: `2px solid ${T.accent}`, borderLeft: `2px solid ${T.accent}` }} />
                    <div style={{ position: "absolute", top: -1, right: -1, width: 14, height: 14, borderTop: `2px solid ${T.accent}`, borderRight: `2px solid ${T.accent}` }} />
                    <div style={{ position: "absolute", bottom: -1, left: -1, width: 14, height: 14, borderBottom: `2px solid ${T.accent}`, borderLeft: `2px solid ${T.accent}` }} />
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 14, height: 14, borderBottom: `2px solid ${T.accent}`, borderRight: `2px solid ${T.accent}` }} />
                    {/* Laser line */}
                    <div style={{
                      position: "absolute", left: 4, right: 4, height: 1.5,
                      background: T.accent, top: "50%",
                      boxShadow: `0 0 8px ${T.accent}`,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 10, color: T.textSec }}>
                Hold the item still with barcode centered in the reticle
              </span>
            </div>
          )}

          {scanStatus === "error" && scanError && !scanning && (
            <div style={{ padding: "8px 14px", background: "rgba(204,68,68,0.1)", borderTop: `1px solid ${T.danger}`, fontSize: 11, color: T.danger }}>
              {scanError}
            </div>
          )}
        </div>

        {/* ── Item Entry Form ── */}
        <div className="no-print" style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
          padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.textPri, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {editId ? "Edit Item in Invoice" : "Add Item to Invoice"}
            </span>
            {editId && (
              <span style={{ fontSize: 10, color: T.accent }}>
                Editing mode active
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            {/* Barcode / SKU field */}
            <div>
              <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                Barcode / SKU (Optional)
              </label>
              <div style={{ position: "relative" }}>
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
                  placeholder="Scan or type barcode"
                  style={{
                    width: "100%", padding: "6px 8px", background: T.surfaceHi,
                    border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                    fontSize: 11, outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = T.accent}
                  onBlur={e => e.currentTarget.style.borderColor = T.border}
                />
              </div>
              {formBarcode && catalog[formBarcode.trim()] && (
                <span style={{ fontSize: 9, color: T.success, display: "block", marginTop: 2 }}>
                  ✓ Catalog auto-fill recognized
                </span>
              )}
            </div>

            {/* Product Title */}
            <div style={{ gridColumn: "span 1" }}>
              <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                Product Title <span style={{ color: T.danger }}>*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                placeholder="e.g. Organic Green Tea 100g"
                style={{
                  width: "100%", padding: "6px 8px", background: T.surfaceHi,
                  border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                  fontSize: 11, outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
            {/* Unit Price */}
            <div>
              <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                Unit Price (₹) <span style={{ color: T.danger }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                placeholder="0.00"
                style={{
                  width: "100%", padding: "6px 8px", background: T.surfaceHi,
                  border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                  fontSize: 11, outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
            </div>

            {/* Qty */}
            <div>
              <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                Qty
              </label>
              <input
                type="number"
                min="1"
                value={formQty}
                onChange={e => setFormQty(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addItem()}
                style={{
                  width: "100%", padding: "6px 8px", background: T.surfaceHi,
                  border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                  fontSize: 11, outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                onBlur={e => e.currentTarget.style.borderColor = T.border}
              />
            </div>

            {/* GST Rate */}
            <div>
              <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                GST Rate
              </label>
              <select
                value={formGst}
                onChange={e => setFormGst(Number(e.target.value) as GstRate)}
                style={{
                  width: "100%", padding: "6px 8px", background: T.surfaceHi,
                  border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                  fontSize: 11, outline: "none", cursor: "pointer", boxSizing: "border-box",
                }}
              >
                {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
              </select>
            </div>

            {/* Add / Cancel buttons */}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={addItem}
                disabled={!formName.trim() || !formPrice}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 3,
                  background: !formName.trim() || !formPrice ? T.surfaceHi : T.accent,
                  border: `1px solid ${!formName.trim() || !formPrice ? T.border : T.accent}`,
                  color: !formName.trim() || !formPrice ? T.muted : "#111",
                  fontSize: 11, fontWeight: 600,
                  cursor: !formName.trim() || !formPrice ? "not-allowed" : "pointer",
                  height: 31,
                }}
              >
                {editId ? <Check size={13} /> : <Plus size={13} />}
                {editId ? "Update Item" : "Add Line"}
              </button>

              {(editId || formName || formBarcode) && (
                <button
                  onClick={resetForm}
                  title="Clear inputs"
                  style={{
                    width: 31, height: 31, borderRadius: 3,
                    background: T.surfaceHi, border: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: T.textSec, cursor: "pointer",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Bill Items Table & Receipt Preview ── */}
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
          overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
            background: T.surfaceHi, display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Receipt size={13} style={{ color: T.accent }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>
                Invoice Items ({items.length})
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: T.textSec }}>
              <span>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {items.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: T.bg, borderBottom: `1px solid ${T.borderDim}`, color: T.textSec }}>
                    <th style={{ padding: "8px 12px", width: 30 }}>#</th>
                    <th style={{ padding: "8px 12px" }}>Item Description</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Rate</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>GST</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Total</th>
                    <th className="no-print" style={{ padding: "8px 12px", width: 60, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const { base, tax, total } = itemTotals(item);
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${T.borderDim}`, background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "8px 12px", color: T.muted }}>{idx + 1}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 500, color: T.textPri }}>{item.name}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "monospace" }}>{fmtINR(item.unitPrice)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontFamily: "monospace" }}>{item.qty}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: T.textSec, fontSize: 10 }}>
                          {item.gstRate > 0 ? `${item.gstRate}% (${fmtINR(tax)})` : "0%"}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: T.textPri, fontFamily: "monospace" }}>
                          {fmtINR(total)}
                        </td>
                        <td className="no-print" style={{ padding: "8px 12px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: 4 }}>
                            <button
                              onClick={() => startEdit(item)}
                              title="Edit item"
                              style={{
                                background: "transparent", border: "none", color: T.textSec,
                                cursor: "pointer", padding: "2px", display: "flex",
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = T.accent}
                              onMouseLeave={e => e.currentTarget.style.color = T.textSec}
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              title="Delete line"
                              style={{
                                background: "transparent", border: "none", color: T.textSec,
                                cursor: "pointer", padding: "2px", display: "flex",
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = T.danger}
                              onMouseLeave={e => e.currentTarget.style.color = T.textSec}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary / Tax Calculation Card */}
              <div style={{
                background: T.surfaceHi, borderTop: `1px solid ${T.border}`,
                padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSec }}>
                  <span>Taxable Subtotal (Before GST)</span>
                  <span style={{ fontFamily: "monospace", color: T.textPri }}>{fmtINR(subtotal)}</span>
                </div>

                {gstBreakdown.map(g => (
                  <div key={g.rate} style={{
                    display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textSec,
                    paddingLeft: 8, borderLeft: `2px solid ${T.accent}`,
                  }}>
                    <span>CGST @ {(g.rate / 2).toFixed(1)}% + SGST @ {(g.rate / 2).toFixed(1)}% on {fmtINR(g.taxable)}</span>
                    <span style={{ fontFamily: "monospace" }}>{fmtINR(g.cgst + g.sgst)}</span>
                  </div>
                ))}

                {totalTax > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textSec }}>
                    <span>Total GST Amount</span>
                    <span style={{ fontFamily: "monospace", color: T.textPri }}>{fmtINR(totalTax)}</span>
                  </div>
                )}

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  paddingTop: 8, marginTop: 4, borderTop: `1px dashed ${T.border}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.textPri, textTransform: "uppercase" }}>
                    Grand Total
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: T.accent, fontFamily: "monospace" }}>
                    {fmtINR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: T.muted, fontSize: 12 }}>
              <Receipt size={24} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No items added to invoice yet</p>
              <p style={{ fontSize: 10, margin: "4px 0 0", color: T.textSec }}>
                Scan a barcode or enter item title and price above to start billing
              </p>
            </div>
          )}
        </div>

        {/* ── Generate Customer QR CTA ── */}
        {items.length > 0 && (
          <div className="no-print" style={{ display: "flex", gap: 10 }}>
            <button
              onClick={generateQR}
              style={{
                flex: 1, padding: "10px", borderRadius: 4,
                background: T.accent, border: "none", color: "#111",
                fontSize: 12, fontWeight: 600, display: "flex",
                alignItems: "center", justifyContent: "center", gap: 6,
                cursor: "pointer", transition: "opacity 0.15s",
              }}
            >
              <Smartphone size={14} />
              Generate Customer QR Code Receipt
            </button>

            <button
              onClick={handlePrint}
              style={{
                padding: "10px 16px", borderRadius: 4,
                background: T.surfaceHi, border: `1px solid ${T.border}`,
                color: T.textPri, fontSize: 12, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer",
              }}
            >
              <Printer size={14} />
              Print Invoice
            </button>
          </div>
        )}
      </main>

      {/* ── SEO & Specs Documentation Section ──────────────────────────────── */}
      <section className="no-print" style={{
        background: T.surface, borderTop: `1px solid ${T.border}`,
        padding: "24px 20px", marginTop: "auto",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Chip icon={<ShieldCheck size={11} style={{ color: T.accent }} />} label="100% Client-Side POS Architecture" />
            <Chip icon={<Smartphone size={11} style={{ color: T.accent }} />} label="Contactless QR Receipts" />
            <Chip icon={<Receipt size={11} style={{ color: T.accent }} />} label="Full GST Breakdown (CGST + SGST)" />
            <Chip icon={<ScanLine size={11} style={{ color: T.accent }} />} label="Integrated Barcode & Camera Scanner" />
          </div>

          {/* 6 Features Grid */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              Point of Sale & Invoicing Capabilities
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Smartphone size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Paperless QR Receipts</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Embed the entire invoice payload directly into a mobile-friendly QR code. Customers simply scan with any camera app to view their bill.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <ScanLine size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Barcode Catalog Auto-Fill</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Scan products using your webcam or phone camera. Products are automatically indexed into local memory for instant subsequent lookups.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Receipt size={13} style={{ color: T.success }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Automated GST Tax Splitting</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Supports all GST slabs (0%, 5%, 12%, 18%, 28%). Automatically computes CGST and SGST shares per taxable bracket.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <ShieldCheck size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Offline & Zero-Database Privacy</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Transactions, customer names, and catalog history are stored locally in your browser. No third-party data tracking or cloud lock-in.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Printer size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Thermal & Standard Print Ready</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Built-in print stylesheets automatically strip UI buttons and optimize bills for thermal POS rolls and standard A4 invoice sheets.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Sparkles size={13} style={{ color: T.accent }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textPri }}>Multilingual Customer View</span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Customer receipt view includes instant translation across major Indian languages (English, Hindi, Telugu, Tamil, Malayalam, Kannada).
                </p>
              </div>
            </div>
          </div>

          {/* 3-Step Timeline */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              How to Create and Issue Invoices
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 1</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Configure Store Profile</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Click "Configure Shop" to set your business name, address, contact number, and legal GSTIN number.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 2</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Scan or Add Items</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Scan product barcodes with your camera or enter the description, price, quantity, and GST slab manually.
                </p>
              </div>

              <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.accent, marginBottom: 2 }}>STEP 3</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, marginBottom: 4 }}>Generate QR or Print</div>
                <p style={{ fontSize: 11, color: T.textSec, lineHeight: 1.4, margin: 0 }}>
                  Click "Generate Customer QR" for a contactless paperless receipt, or click "Print" for physical paper invoices.
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              AssetNest Smart Billing vs Commercial POS Software
            </h3>
            <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: T.surfaceHi, borderBottom: `1px solid ${T.border}` }}>
                    <th style={{ padding: "8px 10px", color: T.textPri, fontWeight: 600 }}>Feature</th>
                    <th style={{ padding: "8px 10px", color: T.accent, fontWeight: 600 }}>AssetNest Smart Billing</th>
                    <th style={{ padding: "8px 10px", color: T.textSec, fontWeight: 600 }}>Commercial POS / Billing Apps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Cost & Subscriptions</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>100% Free Forever</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>₹500 - ₹2,000 / month</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Hardware Requirements</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Runs in any browser (Phone/PC)</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Dedicated POS terminals or scanners</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Barcode Scanning</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Built-in camera scanner (0 hardware)</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Requires USB/Bluetooth hardware scanner</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.borderDim}` }}>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Data Privacy</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>100% Client-side local storage</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Sales metrics stored on vendor cloud</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "7px 10px", color: T.textPri }}>Customer Receipt</td>
                    <td style={{ padding: "7px 10px", color: T.success }}>Paperless QR + Print support</td>
                    <td style={{ padding: "7px 10px", color: T.textSec }}>Paper thermal receipt only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive FAQs */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, marginBottom: 10 }}>
              Frequently Asked Questions
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <FAQItem 
                question="How does the customer view their receipt without an account?" 
                answer="When you click 'Generate Customer QR Code Receipt', the bill details are encoded safely into the link query parameters. The customer scans the QR code with their default smartphone camera and the receipt opens immediately with full item and GST breakdown." 
              />
              <FAQItem 
                question="Can I save items so I don't have to retype them every time?" 
                answer="Yes! Whenever you scan or type a barcode/SKU along with product name, price, and GST rate, AssetNest automatically caches it in your local catalog. Future scans of the same barcode will autofill the item instantly." 
              />
              <FAQItem 
                question="How does the GST calculation work?" 
                answer="AssetNest calculates taxable value and automatically splits the tax equally between Central GST (CGST) and State GST (SGST) based on the standard GST slabs: 0%, 5%, 12%, 18%, and 28%." 
              />
              <FAQItem 
                question="Can I print physical receipts on a thermal POS roll printer?" 
                answer="Yes! Click 'Print' or press Ctrl+P. The built-in print CSS suppresses navigation headers, controls, and buttons, formatting the document cleanly for both 80mm/58mm thermal rolls and standard A4 printers." 
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── QR Receipt Modal ────────────────────────────────────────────────── */}
      {showQR && qrDataUrl && (
        <div 
          className="no-print"
          onClick={() => setShowQR(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
              padding: 20, width: "100%", maxWidth: 360, display: "flex", flexDirection: "column",
              gap: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 10, color: T.textSec, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contactless Receipt</span>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: T.textPri, margin: "2px 0 0" }}>Customer QR Code</h4>
              </div>
              <button 
                onClick={() => setShowQR(false)}
                style={{ background: "none", border: "none", color: T.textSec, cursor: "pointer", padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* High-contrast QR Container */}
            <div style={{
              background: "#ffffff", padding: 12, borderRadius: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${T.border}`,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Bill QR Code" style={{ width: 220, height: 220, objectFit: "contain" }} />
            </div>

            {/* Summary card */}
            <div style={{
              background: T.bg, border: `1px solid ${T.borderDim}`, borderRadius: 3,
              padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <span style={{ fontSize: 10, color: T.textSec }}>{items.length} items total</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.accent, fontFamily: "monospace" }}>{fmtINR(grandTotal)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, color: T.textSec, fontFamily: "monospace" }}>{invoiceNo}</span>
                <span style={{ fontSize: 9, color: T.muted, display: "block" }}>{new Date().toLocaleDateString("en-IN")}</span>
              </div>
            </div>

            <p style={{ fontSize: 10, color: T.textSec, textAlign: "center", margin: 0 }}>
              Point any smartphone camera to view the interactive multilingual invoice.
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={copyLink}
                style={{
                  flex: 1, padding: "8px", borderRadius: 3,
                  background: T.surfaceHi, border: `1px solid ${T.border}`,
                  color: T.textPri, fontSize: 11, fontWeight: 500,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  cursor: "pointer",
                }}
              >
                {copied ? <><Check size={12} style={{ color: T.success }} /> Link Copied!</> : <><Copy size={12} /> Copy URL</>}
              </button>

              <button
                onClick={() => {
                  setShowQR(false);
                  handlePrint();
                }}
                style={{
                  padding: "8px 14px", borderRadius: 3,
                  background: T.accent, border: "none",
                  color: "#111", fontSize: 11, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  cursor: "pointer",
                }}
              >
                <Printer size={12} /> Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shop Settings Modal ─────────────────────────────────────────────── */}
      {shopOpen && (
        <div 
          className="no-print"
          onClick={() => setShopOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 600,
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
              padding: 20, width: "100%", maxWidth: 380, display: "flex", flexDirection: "column",
              gap: 12, boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Store size={15} style={{ color: T.accent }} />
                <h4 style={{ fontSize: 13, fontWeight: 600, color: T.textPri, margin: 0 }}>Configure Store Profile</h4>
              </div>
              <button 
                onClick={() => setShopOpen(false)}
                style={{ background: "none", border: "none", color: T.textSec, cursor: "pointer", padding: 4 }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Shop / Store Name *", key: "name", placeholder: "e.g. Metro Supermarket" },
                { label: "Store Address", key: "address", placeholder: "e.g. 42 MG Road, Bangalore" },
                { label: "GSTIN Identification Number", key: "gstNumber", placeholder: "e.g. 29AAAAA0000A1Z5" },
                { label: "Contact Phone Number", key: "phone", placeholder: "e.g. +91 98765 43210" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, color: T.textSec, display: "block", marginBottom: 3 }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={tmpShop[f.key as keyof ShopInfo]}
                    onChange={e => setTmpShop(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{
                      width: "100%", padding: "6px 8px", background: T.surfaceHi,
                      border: `1px solid ${T.border}`, borderRadius: 3, color: T.textPri,
                      fontSize: 11, outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = T.accent}
                    onBlur={e => e.currentTarget.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={saveShop}
              style={{
                marginTop: 6, padding: "9px", borderRadius: 3,
                background: T.accent, border: "none", color: "#111",
                fontSize: 12, fontWeight: 600, display: "flex",
                alignItems: "center", justifyContent: "center", gap: 5,
                cursor: "pointer",
              }}
            >
              <Check size={13} /> Save Store Details
            </button>
          </div>
        </div>
      )}

      {/* ── Help / Technical Specs Modal ────────────────────────────────────── */}
      <HelpModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
        title="Smart Billing Technical Specs"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, color: T.textPri, fontSize: 12, lineHeight: 1.5 }}>
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: T.accent, margin: "0 0 4px 0" }}>Contactless Point of Sale</h4>
            <p style={{ margin: 0, color: T.textSec }}>
              AssetNest Smart Billing offers an instant, zero-hardware billing and invoice generation system running purely in the browser.
            </p>
          </div>

          <div style={{ background: T.surfaceHi, padding: 10, borderRadius: 4, border: `1px solid ${T.border}` }}>
            <h5 style={{ fontSize: 12, fontWeight: 600, color: T.textPri, margin: "0 0 6px 0" }}>Key Capabilities</h5>
            <ul style={{ margin: 0, paddingLeft: 18, color: T.textSec, display: "flex", flexDirection: "column", gap: 4 }}>
              <li><strong>ZXing Barcode Engine</strong>: Scans standard 1D product barcodes (EAN-13, UPC, Code 128) and 2D QR codes via camera.</li>
              <li><strong>Local Catalog Memory</strong>: Automatically remembers previously scanned barcodes and prices.</li>
              <li><strong>URL Base64 Compression</strong>: Compresses customer receipt data directly into the link so no server storage is necessary.</li>
              <li><strong>GST Compliance</strong>: Automatic taxable value calculation and dual CGST/SGST splitting across 0%, 5%, 12%, 18%, 28% brackets.</li>
              <li><strong>Thermal & A4 Print CSS</strong>: Clean print stylesheets for thermal roll printers or PDF export.</li>
            </ul>
          </div>
        </div>
      </HelpModal>

      {/* ── Print Stylesheet ────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.3; } }
        @media print {
          .no-print { display: none !important; }
          body, html { background: #fff !important; color: #000 !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          table { width: 100% !important; color: #000 !important; }
          th, td { border-color: #ddd !important; color: #000 !important; }
        }
      `}} />
    </div>
  );
}
