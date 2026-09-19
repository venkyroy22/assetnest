"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { 
  ArrowLeft, HelpCircle, QrCode, Shield, Zap, Check, Download, 
  Copy, Image as ImageIcon, Smile, Star, Trash2,
  Link as LinkIcon, Wifi, Contact, MessageCircle, Mail, MessageSquareText,
  Phone, Calendar, MapPin, CreditCard, Coins, AlertTriangle, Heart
} from "lucide-react";
import HelpModal from "@/components/HelpModal";

/* ─────────────────────────────────────────
   DESIGN TOKENS
   ───────────────────────────────────────── */
const T = {
  bg: "#333333",
  surface: "#3a3a3a",
  surfaceRaised: "#444444",
  surfaceHigh: "#4a4a4a",
  border: "#2a2a2a",
  borderMid: "#2a2a2a",
  borderHigh: "#505050",
  accent: "#4db8d4",
  accentDim: "rgba(77,184,212,0.15)",
  accentGlow: "rgba(77,184,212,0.25)",
  text: "#cccccc",
  textSub: "#999999",
  textMuted: "#777777",
  danger: "#cc4444",
  dangerDim: "rgba(204,68,68,0.15)",
  warning: "#d4a843",
  radius: { sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 },
  font: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

const FG_PRESETS = ["#000000", "#1e293b", "#1e3a8a", "#581c87", "#881337", "#064e3b", "#7c2d12", "#134e4a"];
const BG_PRESETS = ["#ffffff", "#f8fafc", "#fffbeb", "#f0fdf4", "#eff6ff", "#fdf4ff", "#fff7ed", "#f0fdfa"];

const QUICK_PRESETS = [
  { label: "Minimal", fg: "#000000", bg: "#ffffff", pattern: "rounded", corner: "square" },
  { label: "Matrix",  fg: "#16a34a", bg: "#ffffff", pattern: "rounded", corner: "dots" },
  { label: "Ocean",   fg: "#1e3a8a", bg: "#eff6ff", pattern: "dots",    corner: "rounded" },
  { label: "Forest",  fg: "#064e3b", bg: "#f0fdf4", pattern: "rounded", corner: "rounded" },
  { label: "Rose",    fg: "#881337", bg: "#fff1f2", pattern: "dots",    corner: "rounded" },
  { label: "Royal",   fg: "#581c87", bg: "#fdf4ff", pattern: "rounded", corner: "dots" },
];

type PatternType = "square" | "dots" | "rounded" | "star" | "emoji" | "logo";
type CornerType  = "square" | "dots" | "rounded" | "heart";
type ContentType = "url" | "wifi" | "vcard" | "whatsapp" | "email" | "sms" | "phone" | "event" | "geo" | "upi" | "crypto";

interface WifiData { ssid: string; password: string; encryption: "WPA" | "WEP" | "nopass"; hidden: boolean; }
interface VCardData { firstName: string; lastName: string; phone: string; email: string; company: string; title: string; website: string; address: string; }
interface WhatsAppData { phone: string; message: string; }
interface EmailData { to: string; subject: string; body: string; }
interface SMSData { phone: string; message: string; }
interface PhoneData { phone: string; }
interface EventData { title: string; startDate: string; startTime: string; endDate: string; endTime: string; location: string; description: string; }
interface GeoData { latitude: string; longitude: string; }
interface UPIData { vpa: string; name: string; amount: string; note: string; }
interface CryptoData { coin: "bitcoin" | "ethereum" | "litecoin"; address: string; amount: string; }

const CONTENT_TYPE_LIST: { id: ContentType; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "url", label: "URL", icon: <LinkIcon size={16} strokeWidth={1.8} />, desc: "Website link" },
  { id: "wifi", label: "Wi-Fi", icon: <Wifi size={16} strokeWidth={1.8} />, desc: "Network credentials" },
  { id: "vcard", label: "vCard", icon: <Contact size={16} strokeWidth={1.8} />, desc: "Contact card" },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={16} strokeWidth={1.8} />, desc: "Direct chat" },
  { id: "email", label: "Email", icon: <Mail size={16} strokeWidth={1.8} />, desc: "Compose email" },
  { id: "sms", label: "SMS", icon: <MessageSquareText size={16} strokeWidth={1.8} />, desc: "Text message" },
  { id: "phone", label: "Phone", icon: <Phone size={16} strokeWidth={1.8} />, desc: "Direct call" },
  { id: "event", label: "Event", icon: <Calendar size={16} strokeWidth={1.8} />, desc: "Calendar event" },
  { id: "geo", label: "Location", icon: <MapPin size={16} strokeWidth={1.8} />, desc: "GPS coordinates" },
  { id: "upi", label: "UPI", icon: <CreditCard size={16} strokeWidth={1.8} />, desc: "UPI payment" },
  { id: "crypto", label: "Crypto", icon: <Coins size={16} strokeWidth={1.8} />, desc: "Wallet payment" },
];

function buildPayload(
  contentType: ContentType,
  urlData: string,
  wifiData: WifiData,
  vcardData: VCardData,
  whatsappData: WhatsAppData,
  emailData: EmailData,
  smsData: SMSData,
  phoneData: PhoneData,
  eventData: EventData,
  geoData: GeoData,
  upiData: UPIData,
  cryptoData: CryptoData,
): string {
  switch (contentType) {
    case "url": return urlData;
    case "wifi": {
      const { ssid, password, encryption, hidden } = wifiData;
      if (!ssid) return "";
      const esc = (s: string) => s.replace(/[\\;,:\"]/g, "\\$&");
      return `WIFI:S:${esc(ssid)};T:${encryption};P:${esc(password)};H:${hidden ? "true" : "false"};;`;
    }
    case "vcard": {
      const v = vcardData;
      if (!v.firstName && !v.lastName) return "";
      let card = `BEGIN:VCARD\nVERSION:3.0\n`;
      card += `N:${v.lastName};${v.firstName};;;\nFN:${v.firstName}${v.firstName && v.lastName ? " " : ""}${v.lastName}\n`;
      if (v.phone) card += `TEL:${v.phone}\n`;
      if (v.email) card += `EMAIL:${v.email}\n`;
      if (v.company) card += `ORG:${v.company}\n`;
      if (v.title) card += `TITLE:${v.title}\n`;
      if (v.website) card += `URL:${v.website}\n`;
      if (v.address) card += `ADR:;;${v.address};;;;\n`;
      card += `END:VCARD`;
      return card;
    }
    case "whatsapp": {
      const { phone, message } = whatsappData;
      if (!phone) return "";
      let wa = `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
      if (message) wa += `?text=${encodeURIComponent(message)}`;
      return wa;
    }
    case "email": {
      const { to, subject, body } = emailData;
      if (!to) return "";
      let mailto = `mailto:${to}`;
      const params: string[] = [];
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      if (params.length) mailto += `?${params.join("&")}`;
      return mailto;
    }
    case "sms": {
      const { phone, message } = smsData;
      if (!phone) return "";
      return `smsto:${phone}:${message}`;
    }
    case "phone": {
      if (!phoneData.phone) return "";
      return `tel:${phoneData.phone}`;
    }
    case "event": {
      const e = eventData;
      if (!e.title) return "";
      const fmtDT = (d: string, t: string) => {
        if (!d) return "";
        return d.replace(/-/g, "") + "T" + (t ? t.replace(/:/g, "") + "00" : "000000");
      };
      let ev = `BEGIN:VEVENT\nSUMMARY:${e.title}\n`;
      if (e.startDate) ev += `DTSTART:${fmtDT(e.startDate, e.startTime)}\n`;
      if (e.endDate) ev += `DTEND:${fmtDT(e.endDate, e.endTime)}\n`;
      if (e.location) ev += `LOCATION:${e.location}\n`;
      if (e.description) ev += `DESCRIPTION:${e.description}\n`;
      ev += `END:VEVENT`;
      return ev;
    }
    case "geo": {
      const { latitude, longitude } = geoData;
      if (!latitude || !longitude) return "";
      return `geo:${latitude},${longitude}`;
    }
    case "upi": {
      const { vpa, name, amount, note } = upiData;
      if (!vpa) return "";
      let u = `upi://pay?pa=${encodeURIComponent(vpa)}`;
      if (name) u += `&pn=${encodeURIComponent(name)}`;
      if (amount) u += `&am=${amount}`;
      u += `&cu=INR`;
      if (note) u += `&tn=${encodeURIComponent(note)}`;
      return u;
    }
    case "crypto": {
      const { coin, address, amount } = cryptoData;
      if (!address) return "";
      let uri = `${coin}:${address}`;
      if (amount) uri += `?amount=${amount}`;
      return uri;
    }
    default: return urlData;
  }
}


/* ─────────────────────────────────────────
   CANVAS QR RENDERER
   ───────────────────────────────────────── */
interface QRRendererProps {
  url: string;
  fgColor: string;
  bgColor: string;
  patternType: PatternType;
  cornerType: CornerType;
  emojiChar: string;
  patternLogo: string | null;
  centerLogo: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasRefMobile?: React.RefObject<HTMLCanvasElement | null>;
  transparentBg: boolean;
  customCornerColor: boolean;
  cornerFgColor: string;
}

function useQRRenderer({ url, fgColor, bgColor, patternType, cornerType, emojiChar, patternLogo, centerLogo, canvasRef, canvasRefMobile, transparentBg, customCornerColor, cornerFgColor }: QRRendererProps) {
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = rej; i.src = src; });

  const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number) => {
    let rot = (Math.PI / 2) * 3, step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer); rot += step;
      ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner); rot += step;
    }
    ctx.lineTo(cx, cy - outer); ctx.closePath(); ctx.fill();
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const d = Math.min(w, h), k = x + w / 2;
    ctx.beginPath(); ctx.moveTo(k, y + d / 4);
    ctx.quadraticCurveTo(k, y, x + w / 4, y); ctx.quadraticCurveTo(x, y, x, y + d / 2.25);
    ctx.quadraticCurveTo(x, y + d * 0.65, k, y + d); ctx.quadraticCurveTo(x + w, y + d * 0.65, x + w, y + d / 2.25);
    ctx.quadraticCurveTo(x + w, y, x + w * 0.75, y); ctx.quadraticCurveTo(k, y, k, y + d / 4); ctx.fill();
  };

  const render = useCallback(async (targetCanvas?: HTMLCanvasElement | null) => {
    const drawOnCanvas = async (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const size = canvas.width === 2048 ? 2048 : 1024;
      canvas.width = size; canvas.height = size;

      let matrix: any;
      try {
        const qr = (QRCode as any).create(url || "https://assetnest.gloyas.com", { errorCorrectionLevel: "H" });
        matrix = qr.modules;
      } catch { return; }

      const margin = size * 0.05;
      const inner = size - margin * 2;
      const mc = matrix.size;
      const cell = inner / mc;

      let pImg: HTMLImageElement | null = null, cImg: HTMLImageElement | null = null;
      if (patternType === "logo" && patternLogo) { try { pImg = await loadImage(patternLogo); } catch {} }
      if (centerLogo) { try { cImg = await loadImage(centerLogo); } catch {} }

      let logoBounds: any = null;
      if (cImg) {
        const maxLogo = inner * 0.22;
        const ratio = cImg.width / cImg.height;
        const cw = ratio > 1 ? maxLogo : maxLogo * ratio;
        const ch = ratio > 1 ? maxLogo / ratio : maxLogo;
        const pad = margin * 0.6;
        logoBounds = { cx2: size / 2, cy2: size / 2, cw, ch, radius: Math.max(cw, ch) / 2 + pad };
      }

      if (transparentBg) {
        ctx.clearRect(0, 0, size, size);
      } else {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }
      ctx.fillStyle = fgColor; ctx.textAlign = "center"; ctx.textBaseline = "middle";

      const drawFinder = (sx: number, sy: number) => {
        const x = margin + sx * cell, y = margin + sy * cell;
        const s7 = 7 * cell, s5 = 5 * cell, s3 = 3 * cell;
        const activeCornerFg = customCornerColor ? cornerFgColor : fgColor;
        ctx.fillStyle = activeCornerFg;
        
        if (cornerType === "rounded") {
          const r = cell * 2;
          ctx.beginPath(); ctx.roundRect(x, y, s7, s7, r); ctx.fill();
          
          if (transparentBg) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.roundRect(x + cell, y + cell, s5, s5, r - cell); ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          } else {
            ctx.fillStyle = bgColor;
            ctx.beginPath(); ctx.roundRect(x + cell, y + cell, s5, s5, r - cell); ctx.fill();
          }
          
          ctx.fillStyle = activeCornerFg;
          ctx.beginPath(); ctx.roundRect(x + cell * 2, y + cell * 2, s3, s3, cell); ctx.fill();
        } else if (cornerType === "dots") {
          const cx2 = x + s7 / 2, cy2 = y + s7 / 2;
          ctx.beginPath(); ctx.arc(cx2, cy2, s7 / 2, 0, Math.PI * 2); ctx.fill();
          
          if (transparentBg) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.arc(cx2, cy2, s5 / 2, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          } else {
            ctx.fillStyle = bgColor;
            ctx.beginPath(); ctx.arc(cx2, cy2, s5 / 2, 0, Math.PI * 2); ctx.fill();
          }
          
          ctx.fillStyle = activeCornerFg;
          ctx.beginPath(); ctx.arc(cx2, cy2, s3 / 2, 0, Math.PI * 2); ctx.fill();
        } else if (cornerType === "heart") {
          ctx.beginPath(); ctx.roundRect(x, y, s7, s7, cell * 0.5); ctx.fill();
          
          if (transparentBg) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.roundRect(x + cell, y + cell, s5, s5, 0); ctx.fill();
            ctx.globalCompositeOperation = "source-over";
          } else {
            ctx.fillStyle = bgColor;
            ctx.beginPath(); ctx.roundRect(x + cell, y + cell, s5, s5, 0); ctx.fill();
          }
          
          ctx.fillStyle = activeCornerFg;
          drawHeart(ctx, x + s7/2 - (s3*1.15)/2, y + s7/2 - (s3*1.15)/2, s3*1.15, s3*1.15);
        } else {
          ctx.fillRect(x, y, s7, s7);
          
          if (transparentBg) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "#000000";
            ctx.fillRect(x + cell, y + cell, s5, s5);
            ctx.globalCompositeOperation = "source-over";
          } else {
            ctx.fillStyle = bgColor;
            ctx.fillRect(x + cell, y + cell, s5, s5);
          }
          
          ctx.fillStyle = activeCornerFg;
          ctx.fillRect(x + cell * 2, y + cell * 2, s3, s3);
        }
      };

      for (let r = 0; r < mc; r++) {
        for (let c = 0; c < mc; c++) {
          if (!matrix.data[r * mc + c]) continue;
          const cx2 = margin + c * cell + cell / 2;
          const cy2 = margin + r * cell + cell / 2;
          const x = margin + c * cell, y = margin + r * cell;
          if ((r <= 6 && c <= 6) || (r <= 6 && c >= mc - 7) || (r >= mc - 7 && c <= 6)) continue;
          if (logoBounds) {
            const dist = Math.sqrt((cx2 - logoBounds.cx2) ** 2 + (cy2 - logoBounds.cy2) ** 2);
            if (dist < logoBounds.radius + cell * 0.4) continue;
          }
          ctx.fillStyle = fgColor;
          if (patternType === "square") ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell), Math.ceil(cell));
          else if (patternType === "rounded") { ctx.beginPath(); ctx.roundRect(x, y, cell, cell, cell * 0.35); ctx.fill(); }
          else if (patternType === "dots") { ctx.beginPath(); ctx.arc(cx2, cy2, (cell/2)*0.85, 0, Math.PI*2); ctx.fill(); }
          else if (patternType === "star") drawStar(ctx, cx2, cy2, 5, cell/1.8, cell/3.8);
          else if (patternType === "emoji") { ctx.font = `${cell*0.95}px Arial`; ctx.fillText(emojiChar||"✦", cx2, cy2 + cell*0.1); }
          else if (patternType === "logo" && pImg) {
            const pr = pImg.width / pImg.height;
            const pw = pr > 1 ? cell : cell * pr, ph = pr > 1 ? cell / pr : cell;
            ctx.drawImage(pImg, x + (cell-pw)/2, y + (cell-ph)/2, pw, ph);
          } else ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell), Math.ceil(cell));
        }
      }

      drawFinder(0, 0); drawFinder(mc - 7, 0); drawFinder(0, mc - 7);

      if (cImg && logoBounds) {
        const { cx2, cy2, cw, ch, radius } = logoBounds;
        if (transparentBg) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "#000000";
          ctx.beginPath(); ctx.arc(cx2, cy2, radius, 0, Math.PI*2); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        } else {
          ctx.fillStyle = bgColor;
          ctx.beginPath(); ctx.arc(cx2, cy2, radius, 0, Math.PI*2); ctx.fill();
        }
        ctx.drawImage(cImg, cx2 - cw/2, cy2 - ch/2, cw, ch);
      }
    };

    if (targetCanvas) {
      await drawOnCanvas(targetCanvas);
      return;
    }
    if (canvasRef?.current) {
      await drawOnCanvas(canvasRef.current);
    }
    if (canvasRefMobile?.current) {
      await drawOnCanvas(canvasRefMobile.current);
    }
  }, [url, fgColor, bgColor, patternType, emojiChar, patternLogo, centerLogo, cornerType, canvasRef, canvasRefMobile, transparentBg, customCornerColor, cornerFgColor]);

  useEffect(() => { render(null); }, [render]);

  const download = async () => {
    const c = document.createElement("canvas"); c.width = 2048; c.height = 2048;
    await render(c);
    const filename = "qr-code.png";
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = filename; a.click();

    window.dispatchEvent(new CustomEvent("assetnest-download", {
      detail: {
        filename: filename,
        size: "2048 × 2048px"
      }
    }));
  };

  const getDataURL = () => {
    const canvas = canvasRef?.current || canvasRefMobile?.current;
    return canvas ? canvas.toDataURL("image/png") : null;
  };

  return { download, getDataURL };
}

/* ─────────────────────────────────────────
   COLOR SWATCH PICKER (Neobrutalist)
   ───────────────────────────────────────── */
interface ColorPickerProps {
  label: string;
  value: string;
  presets: string[];
  onChange: (val: string) => void;
}

function ColorPicker({ label, value, presets, onChange }: ColorPickerProps) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 400, color: "#999", letterSpacing: "normal", marginBottom: 6, fontFamily: T.font }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
        {presets.map(c => (
          <button key={c} onClick={() => onChange(c)} style={{
            width: 22, height: 22, borderRadius: "50%", background: c,
            border: `2px solid ${value === c ? "#ccc" : "transparent"}`,
            outline: value === c ? "1px solid rgba(255,255,255,0.2)" : "none",
            outlineOffset: 1,
            cursor: "pointer", transition: "all 0.15s",
            transform: value === c ? "scale(1.1)" : "scale(1)",
            flexShrink: 0,
          }} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative", width: 28, height: 28, borderRadius: 2, overflow: "hidden", border: "1px solid #555", flexShrink: 0 }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)}
            style={{ position: "absolute", inset: -8, width: 44, height: 44, cursor: "pointer", border: "none" }} />
        </div>
        <input type="text" value={value.toUpperCase()} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "3px 6px", background: "#2a2a2a", border: "1px solid #555", borderRadius: 2, fontSize: 11, fontFamily: "monospace", color: "#ccc", outline: "none", fontWeight: 400 }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   OPTION PILL ROW (Neobrutalist)
   ───────────────────────────────────────── */
interface OptionPillsProps {
  options: { id: string; label: string; icon: React.ReactNode }[];
  value: string;
  onChange: (val: any) => void;
  small?: boolean;
}

function OptionPills({ options, value, onChange, small = false }: OptionPillsProps) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 4, padding: "6px 8px",
            minWidth: small ? 64 : 56, flex: small ? "1 1 64px" : "1 1 56px",
            borderRadius: 3,
            border: active ? "1px solid #666" : "1px solid #444",
            background: active ? "#505050" : "#3a3a3a",
            color: active ? "#ffffff" : "#999",
            fontSize: 10, fontWeight: 400, letterSpacing: "normal",
            cursor: "pointer", transition: "all 0.12s",
            textTransform: "none",
          }}>
            <div style={{ opacity: active ? 1 : 0.5 }}>{o.icon}</div>
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   FILE UPLOAD SLOT (Neobrutalist)
   ───────────────────────────────────────── */
interface UploadSlotProps {
  label: string;
  value: string | null;
  onUpload: (val: string | null) => void;
  onClear: () => void;
  accept?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function UploadSlot({ label, value, onUpload, onClear, accept = "image/*", inputRef }: UploadSlotProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input type="file" accept={accept} ref={inputRef} style={{ display: "none" }}
        onChange={() => {
          const file = inputRef.current?.files?.[0]; if (!file) return;
          const reader = new FileReader(); reader.onload = e => onUpload(e.target?.result as string); reader.readAsDataURL(file);
        }} />
      <button onClick={() => inputRef.current?.click()} style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "6px 10px",
        background: value ? "rgba(77,184,120,0.15)" : "#3a3a3a",
        border: `1px dashed ${value ? "#4db878" : "#666"}`,
        borderRadius: 3, color: value ? "#7dcea0" : "#999",
        fontSize: 11, fontWeight: 400, cursor: "pointer", transition: "all 0.15s",
      }}>
        {Icons.Upload(13)}
        <span>{value ? "✓ Uploaded" : label}</span>
      </button>
      {value && (
        <button onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = ""; }} style={{
          padding: "6px", background: "rgba(204,68,68,0.15)", border: "1px solid #555",
          borderRadius: 3, color: "#cc6666", cursor: "pointer", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {Icons.Trash(13)}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   TOGGLE SWITCH (Neobrutalist)
   ───────────────────────────────────────── */
interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

function ToggleSwitch({ label, checked, onChange, description }: ToggleSwitchProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, textAlign: "left" }}>
        <span style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>{label}</span>
        {description && <span style={{ fontSize: 10, color: "#777" }}>{description}</span>}
      </div>
      <button 
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 18, borderRadius: 9,
          background: checked ? "#4db8d4" : "#2a2a2a",
          border: "1px solid #555",
          cursor: "pointer", position: "relative",
          transition: "all 0.2s ease",
          flexShrink: 0, padding: 0,
          outline: "none",
        }}
      >
        <div 
          style={{
            width: 12, height: 12, borderRadius: "50%",
            background: checked ? "#fff" : "#888",
            position: "absolute", 
            top: "50%",
            transform: "translateY(-50%)",
            left: checked ? 20 : 3,
            transition: "all 0.2s ease",
          }}
        />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   ICON INLINES
   ───────────────────────────────────────── */
interface IconProps {
  d: string;
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}

const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none", strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d={d} />
  </svg>
);

const Icons = {
  Download: (s=18) => <Icon size={s} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  Copy:    (s=16) => <Icon size={s} d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2H8zM12 11v6M9 14h6" />,
  Check:   (s=16) => <Icon size={s} d="M20 6 9 17l-5-5" />,
  Upload:  (s=16) => <Icon size={s} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  Trash:   (s=16) => <Icon size={s} d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />,
  Expand:  (s=18) => <Icon size={s} d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  Close:   (s=20) => <Icon size={s} d="M18 6 6 18M6 6l12 12" />,
  Grid:    (s=20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{ display: "block" }}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Palette: (s=20) => <Icon size={s} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.53-.21-1.01-.54-1.37a.996.996 0 0 1 .75-1.63H16c3.31 0 6-2.69 6-6 0-4.96-4.48-9-10-9zm-5 9c-.83 0-1.5-.67-1.5-1.5S6.17 8 7 8s1.5.67 1.5 1.5S7.83 11 7 11zm3-4c-.83 0-1.5-.67-1.5-1.5S9.17 5 10 5s1.5.67 1.5 1.5S10.83 7 10 7zm4 0c-.83 0-1.5-.67-1.5-1.5S13.17 5 14 5s1.5.67 1.5 1.5S14.83 7 14 7zm3 4c-.83 0-1.5-.67-1.5-1.5S16.17 8 17 8s1.5.67 1.5 1.5S17.83 11 17 11z" fill="currentColor" stroke="none"/>,
  Corner:  (s=20) => <Icon size={s} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM16 16m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0" />,
  Image:   (s=20) => <Icon size={s} d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7M16 5h6M19 2v6M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 20" />,
  Shield:  (s=14) => <Icon size={s} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  Zap:     (s=11) => <Icon size={s} d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  Link:    (s=16) => <Icon size={s} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
  Star:    (s=16) => <Icon size={s} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  Smile:   (s=16) => <Icon size={s} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />,
};

/* ─────────────────────────────────────────
   SMALL SHARED COMPONENTS
   ───────────────────────────────────────── */
interface SectionLabelProps {
  children: React.ReactNode;
}

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <div style={{ fontSize: 11, fontWeight: 400, color: "#999", letterSpacing: "normal", marginBottom: 6, fontFamily: T.font }}>
      {children}
    </div>
  );
}

interface StatPillProps {
  label: string;
  value: string;
}

function StatPill({ label, value }: StatPillProps) {
  return (
    <div style={{ padding: "3px 6px", background: "#3a3a3a", border: "1px solid #555", borderRadius: 2, textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>{value}</div>
      <div style={{ fontSize: 9, color: "#888", letterSpacing: "normal", fontWeight: 400 }}>{label}</div>
    </div>
  );
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  small?: boolean;
}

function Chip({ icon, label, small = false }: ChipProps) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 6px" : "3px 8px",
      borderRadius: 2, background: "#3a3a3a",
      border: "1px solid #555",
      fontSize: small ? 10 : 10, fontWeight: 400, color: "#aaa", letterSpacing: "normal",
    }}>
      {icon}{label}
    </span>
  );
}

function ScanTip() {
  return (
    <div style={{
      padding: "6px 8px", background: "#3a3a3a",
      border: "1px solid #555", borderRadius: 2,
      display: "flex", gap: 8, alignItems: "flex-start",
    }}>
      <Zap size={14} color="#d4a843" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 11, fontWeight: 400, color: "#d4a843", marginBottom: 2, fontFamily: T.font }}>Scannability tip</div>
        <div style={{ fontSize: 10, color: "#888", lineHeight: 1.5, fontWeight: 400 }}>
          Star and emoji patterns may struggle on older scanners. Use high contrast colors and ensure corner markers are clear.
        </div>
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      onClick={() => setIsOpen(!isOpen)}
      style={{
        background: "#3a3a3a",
        border: "1px solid #555",
        borderRadius: 3,
        padding: "8px 10px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h4 style={{ 
          fontSize: 11, 
          fontWeight: 400, 
          color: "#ccc", 
          margin: 0, 
          display: "flex", 
          gap: 6,
          textAlign: "left",
          alignItems: "flex-start",
        }}>
          <span style={{ color: "#4db8d4" }}>Q:</span> 
          <span>{question}</span>
        </h4>
        <div style={{ 
          color: "#888",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s ease",
          flexShrink: 0,
          display: "flex",
          fontWeight: 400,
          fontSize: 9,
        }}>
          ▼
        </div>
      </div>
      <div style={{
        maxHeight: isOpen ? 500 : 0,
        opacity: isOpen ? 1 : 0,
        overflow: "hidden",
        transition: "all 0.2s ease",
        pointerEvents: isOpen ? "auto" : "none",
        marginTop: isOpen ? 8 : 0,
      }}>
        <p style={{ 
          fontSize: 11, 
          color: "#999", 
          lineHeight: 1.5, 
          margin: 0, 
          paddingLeft: 18,
          textAlign: "left",
          fontWeight: 400,
        }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

interface URLInputProps {
  url: string;
  setUrl: (val: string) => void;
  copied: boolean;
  onCopy: () => void;
}

function URLInput({ url, setUrl, copied, onCopy }: URLInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{
      background: "#3a3a3a",
      border: "1px solid #555",
      borderRadius: 3,
      padding: "8px 10px",
    }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 400, color: "#888", letterSpacing: "normal", marginBottom: 4, textAlign: "left", fontFamily: T.font }}>
        Destination URL
      </label>
      <div 
        className="qr-input-box"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#2a2a2a",
          border: `1px solid ${isFocused ? "#4db8d4" : "#555"}`,
          borderRadius: 2,
          padding: "6px 8px",
          boxShadow: isFocused ? "0 0 0 1px rgba(77, 184, 212, 0.25)" : "none",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        <span style={{ color: isFocused ? "#4db8d4" : "#888", flexShrink: 0, display: "flex", alignItems: "center", transition: "color 0.15s" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="https://your-link.com"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 11,
            color: "#ccc",
            fontFamily: T.font,
            fontWeight: 400,
            minWidth: 0,
            lineHeight: "16px",
          }}
        />
        {url && (
          <button 
            type="button"
            onClick={onCopy} 
            style={{
              padding: "2px 7px",
              background: copied ? "rgba(77,184,120,0.2)" : "#383838",
              border: `1px solid ${copied ? "#7dcea0" : "#555"}`,
              borderRadius: 2,
              color: copied ? "#7dcea0" : "#ccc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 400,
              transition: "all 0.12s",
              fontFamily: T.font,
              whiteSpace: "nowrap",
            }}
            title="Copy URL"
          >
            {copied
              ? <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M20 6 9 17l-5-5"/></svg> Copied</>
              : <><svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2H8z"/></svg> Copy</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   FORM STYLES & COMPONENTS
   ───────────────────────────────────────── */
const formInputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 8px", background: "#2a2a2a",
  border: "1px solid #555", borderRadius: 2, fontSize: 11,
  color: "#ccc", outline: "none", fontFamily: T.font, fontWeight: 400,
  colorScheme: "dark",
};

const formLabelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 400, color: "#888",
  letterSpacing: "normal", marginBottom: 3, textAlign: "left", fontFamily: T.font,
};

function ContentTypeSelector({ value, onChange }: { value: ContentType; onChange: (v: ContentType) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "6px 8px" }}>
      <label style={{ ...formLabelStyle, marginBottom: 6 }}>Content Type</label>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {CONTENT_TYPE_LIST.map(ct => {
          const active = value === ct.id;
          return (
            <button key={ct.id} onClick={() => onChange(ct.id)} title={ct.desc} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "5px 6px", minWidth: 52, borderRadius: 3, flexShrink: 0,
              border: active ? "1px solid #4db8d4" : "1px solid #444",
              background: active ? "rgba(77,184,212,0.15)" : "#333",
              color: active ? "#4db8d4" : "#999",
              fontSize: 9, fontWeight: 400, cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
            }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 18 }}>{ct.icon}</span>
              <span>{ct.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={formLabelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""}
        style={formInputStyle} />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label style={formLabelStyle}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ""} rows={rows}
        style={{ ...formInputStyle, resize: "vertical", minHeight: 40 }} />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label style={formLabelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ ...formInputStyle, cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function WifiForm({ data, onChange }: { data: WifiData; onChange: (d: WifiData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="Network Name (SSID)" value={data.ssid} onChange={v => onChange({ ...data, ssid: v })} placeholder="MyWiFiNetwork" />
      <FormInput label="Password" value={data.password} onChange={v => onChange({ ...data, password: v })} placeholder="Enter password" type="password" />
      <FormSelect label="Encryption" value={data.encryption} onChange={v => onChange({ ...data, encryption: v as "WPA" | "WEP" | "nopass" })} options={[
        { value: "WPA", label: "WPA / WPA2 / WPA3" },
        { value: "WEP", label: "WEP" },
        { value: "nopass", label: "None (Open Network)" },
      ]} />
      <ToggleSwitch label="Hidden Network" checked={data.hidden} onChange={v => onChange({ ...data, hidden: v })} description="SSID is not broadcast" />
    </div>
  );
}

function VCardForm({ data, onChange }: { data: VCardData; onChange: (d: VCardData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FormInput label="First Name" value={data.firstName} onChange={v => onChange({ ...data, firstName: v })} placeholder="John" />
        <FormInput label="Last Name" value={data.lastName} onChange={v => onChange({ ...data, lastName: v })} placeholder="Doe" />
      </div>
      <FormInput label="Phone" value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+1 234 567 8900" type="tel" />
      <FormInput label="Email" value={data.email} onChange={v => onChange({ ...data, email: v })} placeholder="john@example.com" type="email" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FormInput label="Company" value={data.company} onChange={v => onChange({ ...data, company: v })} placeholder="Acme Inc." />
        <FormInput label="Job Title" value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Designer" />
      </div>
      <FormInput label="Website" value={data.website} onChange={v => onChange({ ...data, website: v })} placeholder="https://example.com" type="url" />
      <FormInput label="Address" value={data.address} onChange={v => onChange({ ...data, address: v })} placeholder="123 Main St, City" />
    </div>
  );
}

function WhatsAppForm({ data, onChange }: { data: WhatsAppData; onChange: (d: WhatsAppData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="Phone Number (with country code)" value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+919876543210" type="tel" />
      <FormTextarea label="Pre-filled Message (optional)" value={data.message} onChange={v => onChange({ ...data, message: v })} placeholder="Hello! I'd like to know more..." rows={2} />
    </div>
  );
}

function EmailForm({ data, onChange }: { data: EmailData; onChange: (d: EmailData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="Recipient Email" value={data.to} onChange={v => onChange({ ...data, to: v })} placeholder="hello@example.com" type="email" />
      <FormInput label="Subject" value={data.subject} onChange={v => onChange({ ...data, subject: v })} placeholder="Meeting Follow-up" />
      <FormTextarea label="Body" value={data.body} onChange={v => onChange({ ...data, body: v })} placeholder="Write your message..." rows={3} />
    </div>
  );
}

function SMSForm({ data, onChange }: { data: SMSData; onChange: (d: SMSData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="Phone Number" value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+1234567890" type="tel" />
      <FormTextarea label="Message" value={data.message} onChange={v => onChange({ ...data, message: v })} placeholder="Your SMS message..." rows={2} />
    </div>
  );
}

function PhoneForm({ data, onChange }: { data: PhoneData; onChange: (d: PhoneData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="Phone Number" value={data.phone} onChange={v => onChange({ ...data, phone: v })} placeholder="+1234567890" type="tel" />
      <div style={{ fontSize: 10, color: "#888", lineHeight: 1.5, fontWeight: 400, padding: "4px 0" }}>
        Scanning this QR code will prompt the user to dial this number directly.
      </div>
    </div>
  );
}

function EventForm({ data, onChange }: { data: EventData; onChange: (d: EventData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="Event Title" value={data.title} onChange={v => onChange({ ...data, title: v })} placeholder="Team Meeting" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FormInput label="Start Date" value={data.startDate} onChange={v => onChange({ ...data, startDate: v })} type="date" />
        <FormInput label="Start Time" value={data.startTime} onChange={v => onChange({ ...data, startTime: v })} type="time" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FormInput label="End Date" value={data.endDate} onChange={v => onChange({ ...data, endDate: v })} type="date" />
        <FormInput label="End Time" value={data.endTime} onChange={v => onChange({ ...data, endTime: v })} type="time" />
      </div>
      <FormInput label="Location" value={data.location} onChange={v => onChange({ ...data, location: v })} placeholder="Room 101, Building A" />
      <FormTextarea label="Description" value={data.description} onChange={v => onChange({ ...data, description: v })} placeholder="Meeting agenda..." rows={2} />
    </div>
  );
}

function GeoForm({ data, onChange }: { data: GeoData; onChange: (d: GeoData) => void }) {
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange({ latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }),
      () => { /* silently fail */ }
    );
  };
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FormInput label="Latitude" value={data.latitude} onChange={v => onChange({ ...data, latitude: v })} placeholder="37.7749" />
        <FormInput label="Longitude" value={data.longitude} onChange={v => onChange({ ...data, longitude: v })} placeholder="-122.4194" />
      </div>
      <button onClick={handleUseCurrentLocation} style={{
        padding: "6px 10px", background: "#333", border: "1px dashed #666", borderRadius: 3,
        color: "#4db8d4", fontSize: 10, fontWeight: 400, cursor: "pointer", fontFamily: T.font,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <MapPin size={13} strokeWidth={2} />
        <span>Use Current Location</span>
      </button>
    </div>
  );
}

function UPIForm({ data, onChange }: { data: UPIData; onChange: (d: UPIData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormInput label="UPI ID / VPA" value={data.vpa} onChange={v => onChange({ ...data, vpa: v })} placeholder="yourname@upi" />
      <FormInput label="Payee Name" value={data.name} onChange={v => onChange({ ...data, name: v })} placeholder="John Doe" />
      <FormInput label="Amount ₹ (optional)" value={data.amount} onChange={v => onChange({ ...data, amount: v })} placeholder="Leave empty for open amount" />
      <div style={{ fontSize: 10, color: "#888", lineHeight: 1.5, fontWeight: 400, padding: "0 0 2px" }}>
        Leave amount blank to let the payer enter any amount when scanning.
      </div>
      <FormInput label="Transaction Note" value={data.note} onChange={v => onChange({ ...data, note: v })} placeholder="Payment for..." />
    </div>
  );
}

function CryptoForm({ data, onChange }: { data: CryptoData; onChange: (d: CryptoData) => void }) {
  return (
    <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
      <FormSelect label="Cryptocurrency" value={data.coin} onChange={v => onChange({ ...data, coin: v as "bitcoin" | "ethereum" | "litecoin" })} options={[
        { value: "bitcoin", label: "Bitcoin (BTC)" },
        { value: "ethereum", label: "Ethereum (ETH)" },
        { value: "litecoin", label: "Litecoin (LTC)" },
      ]} />
      <FormInput label="Wallet Address" value={data.address} onChange={v => onChange({ ...data, address: v })} placeholder="bc1qxy2kgdygjrsqtzq2n0yrf..." />
      <FormInput label="Amount (optional)" value={data.amount} onChange={v => onChange({ ...data, amount: v })} placeholder="0.001" />
    </div>
  );
}

interface PreviewCardProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  previewPulsed: boolean;
  onExpand: () => void;
  onDownload: () => void;
  transparentBg: boolean;
  setTransparentBg: (val: boolean) => void;
}

function PreviewCard({ canvasRef, previewPulsed, onExpand, onDownload, transparentBg, setTransparentBg }: PreviewCardProps) {
  return (
    <div style={{
      background: "#3a3a3a", border: "1px solid #555",
      borderRadius: 3, padding: 10,
    }}>
      {/* Canvas */}
      <div 
        className={`${previewPulsed ? "qr-preview-pulse" : ""} ${transparentBg ? "transparent-checkered" : ""}`} 
        onClick={onExpand} 
        style={{
          background: transparentBg ? undefined : "#fff", 
          borderRadius: 2, padding: 6, cursor: "pointer",
          aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", transition: "transform 0.15s",
          position: "relative",
          border: "1px solid #555",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.005)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#fff", fontSize: 11, fontWeight: 400, opacity: 0, transition: "opacity 0.15s", borderRadius: 2 }}
          onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "0"; }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ display: "block" }}><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          Full size
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, margin: "8px 0" }}>
        {[["Level H", "Error Corr."], ["2048px", "Resolution"], ["PNG", "Format"]].map(([v, l]) => (
          <div key={l} style={{ textAlign: "center", padding: "4px 4px", background: "#444", borderRadius: 2, border: "1px solid #555" }}>
            <div style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>{v}</div>
            <div style={{ fontSize: 9, color: "#888", marginTop: 1, fontWeight: 400 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Transparent Background Quick Toggle */}
      <div style={{
        margin: "8px 0",
        padding: "8px 10px",
        background: "#323232",
        border: "1px solid #555",
        borderRadius: 3,
      }}>
        <ToggleSwitch 
          label="Transparent Background" 
          checked={transparentBg} 
          onChange={setTransparentBg}
          description="Remove background for overlaying on design assets"
        />
      </div>

      {/* Download */}
      <button onClick={onDownload} style={{
        width: "100%", padding: "7px 10px", background: "#4db8d4",
        border: "none", borderRadius: 3, color: "#1a1a1a",
        fontSize: 11, fontWeight: 500, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontFamily: T.font,
      }}>
        {Icons.Download(14)} Export 2048×2048
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   SEO QR TYPE DESCRIPTIONS & KEYWORDS
   ───────────────────────────────────────── */
const QR_TYPE_SEO_DATA = [
  {
    id: "url",
    title: "Website & Link QR Code",
    icon: <LinkIcon size={15} strokeWidth={2} />,
    description: "Instantly routes scanners to any website, landing page, portfolio, social profile, or digital menu. Opens automatically in the user's default browser.",
    keywords: ["url qr code generator", "website qr code maker", "link to qr code", "free custom link qr", "web page qr code"],
  },
  {
    id: "wifi",
    title: "Wi-Fi Access QR Code",
    icon: <Wifi size={15} strokeWidth={2} />,
    description: "Enables guests and customers to join your Wi-Fi network instantly without typing complex passwords. Encodes SSID, security type (WPA/WEP), and password.",
    keywords: ["wifi qr code generator", "connect to wifi qr", "wifi password qr code", "scan to join wifi", "guest wifi qr maker"],
  },
  {
    id: "vcard",
    title: "vCard Digital Business Card",
    icon: <Contact size={15} strokeWidth={2} />,
    description: "Stores complete contact information—name, phone number, email, company, job title, and website. Scanners can save you directly into their address book with a single tap.",
    keywords: ["vcard qr code generator", "digital business card qr", "contact qr code", "electronic business card", "qr business card maker"],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Direct Chat QR Code",
    icon: <MessageCircle size={15} strokeWidth={2} />,
    description: "Opens a direct chat window in WhatsApp with your phone number and an optional pre-filled message. Ideal for customer service, inquiries, and lead generation.",
    keywords: ["whatsapp qr code generator", "direct whatsapp qr", "whatsapp click to chat qr", "scan to chat whatsapp", "whatsapp business qr"],
  },
  {
    id: "email",
    title: "Email Draft QR Code",
    icon: <Mail size={15} strokeWidth={2} />,
    description: "Launches the user's native email client with recipient address, subject line, and draft message body already filled in. Streamlines support requests, RSVPs, and feedback.",
    keywords: ["email qr code generator", "mailto qr code maker", "send email qr code", "prefilled email qr", "contact email qr code"],
  },
  {
    id: "sms",
    title: "SMS Text Message QR Code",
    icon: <MessageSquareText size={15} strokeWidth={2} />,
    description: "Triggers the native SMS messaging app with a pre-configured phone number and pre-written message template. Great for SMS opt-in marketing, alerts, and customer text support.",
    keywords: ["sms qr code generator", "text message qr code", "scan to send sms", "prefilled sms qr", "mobile message qr maker"],
  },
  {
    id: "phone",
    title: "Direct Phone Call QR Code",
    icon: <Phone size={15} strokeWidth={2} />,
    description: "Prompts smartphones to dial your phone number immediately when scanned. Perfect for print ads, brochures, delivery boxes, and storefront signage.",
    keywords: ["phone call qr code", "click to call qr", "call us qr code generator", "telephone qr code maker", "direct dial qr code"],
  },
  {
    id: "event",
    title: "Calendar Event QR Code",
    icon: <Calendar size={15} strokeWidth={2} />,
    description: "Encodes date, start/end time, location, and meeting agenda. Users can add webinars, meetings, concerts, and festivals straight to their calendar in one click.",
    keywords: ["event qr code generator", "calendar event qr code", "add to calendar qr", "meeting invite qr code", "webinar event qr maker"],
  },
  {
    id: "geo",
    title: "Location & GPS Maps QR Code",
    icon: <MapPin size={15} strokeWidth={2} />,
    description: "Encodes precise latitude and longitude coordinates that launch Google Maps, Apple Maps, or Waze. Gives customers pinpoint navigation to your physical storefront or event venue.",
    keywords: ["location qr code generator", "gps qr code maker", "google maps qr code", "scan for directions qr", "geo coordinates qr code"],
  },
  {
    id: "upi",
    title: "UPI Payment QR Code",
    icon: <CreditCard size={15} strokeWidth={2} />,
    description: "Generates an NPCI-compliant UPI payment QR code compatible with Google Pay, PhonePe, Paytm, and BHIM. Supports pre-set amounts, payee name, and payment notes.",
    keywords: ["upi qr code generator", "bhim upi qr maker", "scan and pay qr code", "google pay phonepe qr", "cashless payment qr generator"],
  },
  {
    id: "crypto",
    title: "Cryptocurrency Wallet QR Code",
    icon: <Coins size={15} strokeWidth={2} />,
    description: "Encodes wallet addresses for Bitcoin (BTC), Ethereum (ETH), and Litecoin (LTC) with optional payment amounts. Eliminates risky manual address typing.",
    keywords: ["crypto qr code generator", "bitcoin qr code maker", "ethereum qr code generator", "crypto wallet qr", "btc scan to pay qr"],
  },
];

/* ─────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────── */
export default function QRStudio() {
  const [url, setUrl] = useState("");
  const [contentType, setContentType] = useState<ContentType>("url");
  const [wifiData, setWifiData] = useState<WifiData>({ ssid: "", password: "", encryption: "WPA", hidden: false });
  const [vcardData, setVcardData] = useState<VCardData>({ firstName: "", lastName: "", phone: "", email: "", company: "", title: "", website: "", address: "" });
  const [whatsappData, setWhatsappData] = useState<WhatsAppData>({ phone: "", message: "" });
  const [emailData, setEmailData] = useState<EmailData>({ to: "", subject: "", body: "" });
  const [smsData, setSmsData] = useState<SMSData>({ phone: "", message: "" });
  const [phoneData, setPhoneData] = useState<PhoneData>({ phone: "" });
  const [eventData, setEventData] = useState<EventData>({ title: "", startDate: "", startTime: "", endDate: "", endTime: "", location: "", description: "" });
  const [geoData, setGeoData] = useState<GeoData>({ latitude: "", longitude: "" });
  const [upiData, setUpiData] = useState<UPIData>({ vpa: "", name: "", amount: "", note: "" });
  const [cryptoData, setCryptoData] = useState<CryptoData>({ coin: "bitcoin", address: "", amount: "" });

  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [patternType, setPatternType] = useState<PatternType>("rounded");
  const [cornerType, setCornerType]   = useState<CornerType>("rounded");
  const [emojiChar, setEmojiChar]     = useState("✦");
  const [patternLogo, setPatternLogo] = useState<string | null>(null);
  const [centerLogo, setCenterLogo]   = useState<string | null>(null);
  const [transparentBg, setTransparentBg] = useState(false);
  const [customCornerColor, setCustomCornerColor] = useState(false);
  const [cornerFgColor, setCornerFgColor] = useState("#000000");

  const [activeTab, setActiveTab]     = useState("pattern");
  const [lightbox, setLightbox]       = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [mounted, setMounted]         = useState(false);
  const [previewPulsed, setPreviewPulsed] = useState(false);
  const [showHelp, setShowHelp]       = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternLogoRef = useRef<HTMLInputElement | null>(null);
  const centerLogoRef  = useRef<HTMLInputElement | null>(null);

  const payload = buildPayload(contentType, url, wifiData, vcardData, whatsappData, emailData, smsData, phoneData, eventData, geoData, upiData, cryptoData);
  const activeContentLabel = CONTENT_TYPE_LIST.find(c => c.id === contentType)?.label || "URL";

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  useEffect(() => {
    setPreviewPulsed(true);
    const t = setTimeout(() => setPreviewPulsed(false), 400);
    return () => clearTimeout(t);
  }, [fgColor, bgColor, patternType, cornerType, emojiChar, patternLogo, centerLogo, transparentBg, customCornerColor, cornerFgColor]);

  const { download, getDataURL } = useQRRenderer({
    url: payload, fgColor, bgColor, patternType, cornerType, emojiChar, patternLogo, centerLogo, canvasRef, canvasRefMobile: mobileCanvasRef, transparentBg, customCornerColor, cornerFgColor
  });

  const handleCopy = async () => {
    if (!payload) return;
    await navigator.clipboard.writeText(payload);
    setCopied(true); setTimeout(() => setCopied(false), 2200);
  };

  const openLightbox = () => {
    const src = getDataURL(); if (!src) return;
    setLightboxSrc(src); setLightbox(true);
  };

  const applyPreset = (p: { fg: string; bg: string; pattern: string; corner: string }) => {
    setFgColor(p.fg); setBgColor(p.bg); setPatternType(p.pattern as PatternType); setCornerType(p.corner as CornerType);
  };

  const renderContentForm = () => {
    switch (contentType) {
      case "url": return <URLInput url={url} setUrl={setUrl} copied={copied} onCopy={handleCopy} />;
      case "wifi": return <WifiForm data={wifiData} onChange={setWifiData} />;
      case "vcard": return <VCardForm data={vcardData} onChange={setVcardData} />;
      case "whatsapp": return <WhatsAppForm data={whatsappData} onChange={setWhatsappData} />;
      case "email": return <EmailForm data={emailData} onChange={setEmailData} />;
      case "sms": return <SMSForm data={smsData} onChange={setSmsData} />;
      case "phone": return <PhoneForm data={phoneData} onChange={setPhoneData} />;
      case "event": return <EventForm data={eventData} onChange={setEventData} />;
      case "geo": return <GeoForm data={geoData} onChange={setGeoData} />;
      case "upi": return <UPIForm data={upiData} onChange={setUpiData} />;
      case "crypto": return <CryptoForm data={cryptoData} onChange={setCryptoData} />;
      default: return <URLInput url={url} setUrl={setUrl} copied={copied} onCopy={handleCopy} />;
    }
  };

  /* ── Tab panel contents ── */
  const tabPanels: { [key: string]: React.ReactNode } = {
    pattern: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <SectionLabel>Dot Style</SectionLabel>
          <OptionPills value={patternType} onChange={setPatternType} options={[
            { id: "square",  label: "Classic", icon: <div style={{ width: 14, height: 14, background: "currentColor" }} /> },
            { id: "rounded", label: "Soft",    icon: <div style={{ width: 14, height: 14, background: "currentColor", borderRadius: 4 }} /> },
            { id: "dots",    label: "Dots",    icon: <div style={{ width: 14, height: 14, background: "currentColor", borderRadius: "50%" }} /> },
            { id: "star",    label: "Stars",   icon: <Star size={14} fill="currentColor" /> },
            { id: "emoji",   label: "Emoji",   icon: <Smile size={14} /> },
            { id: "logo",    label: "Logo",    icon: <ImageIcon size={14} /> },
          ]} />
        </div>

        {patternType === "emoji" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: "#323232", borderRadius: 4, border: "1px solid #555" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#888", flex: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Emoji character</span>
            <input type="text" value={emojiChar}
              onChange={e => { const c = Array.from(e.target.value); setEmojiChar(c.length ? c[c.length - 1] : ""); }}
              style={{ width: 64, textAlign: "center", fontSize: 12, padding: "8px 10px", background: "#3a3a3a", border: "1px solid #555", borderRadius: 4, color: "#ccc", outline: "none", fontWeight: 500 }}
            />
          </div>
        )}

        {patternType === "logo" && (
          <div>
            <SectionLabel>Pattern Logo</SectionLabel>
            <UploadSlot label="Choose dot logo image" value={patternLogo} inputRef={patternLogoRef}
              onUpload={setPatternLogo} onClear={() => setPatternLogo(null)} />
          </div>
        )}

        <div>
          <SectionLabel>Quick Presets</SectionLabel>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
            {QUICK_PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} style={{
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                padding: "6px 8px", background: "#3a3a3a",
                border: "1px solid #555", borderRadius: 4,
                cursor: "pointer", fontFamily: 'system-ui, -apple-system, sans-serif', transition: "all 0.15s",
                boxShadow: "none",
              }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.fg }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.bg, border: "1px solid rgba(0,0,0,0.15)" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#ccc", whiteSpace: "nowrap" }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <ScanTip />
      </div>
    ),

    colors: (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ToggleSwitch 
          label="Transparent Background" 
          checked={transparentBg} 
          onChange={setTransparentBg}
          description="Remove background for overlaying on design assets"
        />
        
        <div style={{ height: 2, background: "#383838", borderStyle: "dashed" }} />

        <ColorPicker label="Foreground Color" value={fgColor} presets={FG_PRESETS} onChange={setFgColor} />
        
        <div style={{ height: 2, background: "#383838", borderStyle: "dashed" }} />

        <div style={{ 
          opacity: transparentBg ? 0.35 : 1, 
          pointerEvents: transparentBg ? "none" : "auto",
          transition: "all 0.25s",
        }}>
          <ColorPicker label="Background Color" value={bgColor} presets={BG_PRESETS} onChange={setBgColor} />
          {transparentBg && (
            <div style={{ fontSize: 11, color: "#ea580c", marginTop: 8, fontWeight: 500, textAlign: "left", fontFamily: 'system-ui, -apple-system, sans-serif', display: "flex", alignItems: "center", gap: 5 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>Background color is hidden (transparent is enabled)</span>
            </div>
          )}
        </div>

        <div style={{ height: 2, background: "#383838", borderStyle: "dashed" }} />

        <ToggleSwitch 
          label="Custom Marker Color" 
          checked={customCornerColor} 
          onChange={setCustomCornerColor}
          description="Style the corner finder markers differently"
        />

        {customCornerColor && (
          <div style={{ marginTop: 12 }}>
            <ColorPicker label="Marker Color" value={cornerFgColor} presets={FG_PRESETS} onChange={setCornerFgColor} />
          </div>
        )}

        <div style={{ height: 2, background: "#383838", borderStyle: "dashed" }} />

        <div style={{ padding: "8px 10px", background: "#3a3a3a", border: "1px solid #555", borderRadius: 4, boxShadow: "none" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#d4a843", marginBottom: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Contrast matters</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6, fontWeight: 500 }}>For reliable scanning, ensure strong contrast between foreground and background. Aim for at least 4:1 contrast ratio.</div>
        </div>
      </div>
    ),

    corners: (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <SectionLabel>Finder Marker Style</SectionLabel>
        <OptionPills small value={cornerType} onChange={setCornerType} options={[
          { id: "square",  label: "Classic", icon: <div style={{ width: 14, height: 14, border: "2px solid currentColor" }} /> },
          { id: "rounded", label: "Rounded", icon: <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderRadius: 4 }} /> },
          { id: "dots",    label: "Circles", icon: <div style={{ width: 14, height: 14, border: "2px solid currentColor", borderRadius: "50%" }} /> },
          { id: "heart",   label: "Heart",   icon: <Heart size={13} fill="currentColor" /> },
        ]} />
        <div style={{ padding: "8px 10px", background: "#323232", border: "1px solid #555", borderRadius: 4, boxShadow: "none" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#ccc", marginBottom: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>What are finder markers?</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6, fontWeight: 500 }}>The three corner squares help scanners detect and orient the QR code. These are always drawn last to ensure maximum scan reliability.</div>
        </div>
      </div>
    ),

    branding: (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <SectionLabel>Center Logo</SectionLabel>
          <UploadSlot label="Upload brand logo" value={centerLogo} inputRef={centerLogoRef}
            onUpload={setCenterLogo} onClear={() => setCenterLogo(null)} />
          {centerLogo && (
            <div style={{ marginTop: 10, padding: "6px 8px", background: "rgba(77,184,120,0.15)", borderRadius: 4, border: "1px solid #555", fontSize: 12, color: "#7dcea0", fontWeight: 500, fontFamily: 'system-ui, -apple-system, sans-serif', boxShadow: "none" }}>
              ✓ Error correction set to Level H - best scan rate with logos
            </div>
          )}
        </div>
        <div style={{ padding: "8px 10px", background: "#323232", border: "1px solid #555", borderRadius: 4, boxShadow: "none" }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#ccc", marginBottom: 4, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Logo guidelines</div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.8, fontWeight: 500 }}>
            • PNG or SVG with transparent background works best<br/>
            • Keep logo under 30% of QR width for reliability<br/>
            • High contrast logos scan more dependably
          </div>
        </div>
      </div>
    ),
  };

  /* ── TABS config ── */
  const tabs = [
    { id: "pattern",  label: "Style",    icon: Icons.Grid(16) },
    { id: "colors",   label: "Colors",   icon: Icons.Palette(16) },
    { id: "corners",  label: "Corners",  icon: Icons.Corner(16) },
    { id: "branding", label: "Brand",    icon: <ImageIcon size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#333] text-[#ccc] font-sans pb-24 relative overflow-hidden ig-root">
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input[type=range] { accent-color: #4db8d4; }
        ::-webkit-scrollbar { display: none; }

        .qr-tab-btn:active { transform: scale(0.9) !important; }
        .qr-dl-btn:active { transform: scale(0.97) !important; }
        .qr-preset-scroll { -webkit-overflow-scrolling: touch; }
        .qr-preview-pulse { animation: qrPulse 0.35s ease-out; }
        @keyframes qrPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.012); }
          100% { transform: scale(1); }
        }

        .transparent-checkered {
          background-color: #ffffff !important;
          background-image: 
            linear-gradient(45deg, #f1f1f3 25%, transparent 25%, transparent 75%, #f1f1f3 75%, #f1f1f3), 
            linear-gradient(45deg, #f1f1f3 25%, transparent 25%, transparent 75%, #f1f1f3 75%, #f1f1f3) !important;
          background-size: 16px 16px !important;
          background-position: 0 0, 8px 8px !important;
        }

        .qr-outer input:not([type=range]):not(.qr-input-box input):focus,
        .qr-outer textarea:focus,
        .qr-outer select:focus {
          border-color: #4db8d4 !important;
          box-shadow: 0 0 0 1px rgba(77, 184, 212, 0.25) !important;
        }
        .qr-input-box:hover {
          border-color: #666;
        }

        /* Desktop grid */
        @media (min-width: 900px) {
          .qr-outer { max-width: 1100px; margin: 0 auto; padding: 32px 40px 80px !important; }
          .qr-desktop-grid { display: grid !important; grid-template-columns: 1fr 400px; gap: 32px; align-items: start; }
          .qr-mobile-only { display: none !important; }
          .qr-desktop-only { display: flex !important; }
          .qr-sidebar-sticky { position: sticky !important; top: 32px; }
          .qr-bottom-safe { display: none !important; }
          .qr-main-content { padding-bottom: 0 !important; }
        }

        @media (max-width: 899px) {
          .qr-desktop-only { display: none !important; }
          .qr-outer { padding: 0 !important; }
        }
      `}</style>

      {/* Header */}
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-4 flex items-center justify-between relative z-10">
        <Link
          href="/tools"
          className="flex items-center gap-1 px-2 py-1 bg-[#3a3a3a] border border-[#555] rounded-sm text-[#aaa] font-normal text-[10px] sm:text-[11px] hover:bg-[#444] transition-colors"
        >
          <ArrowLeft size={11} strokeWidth={2} /> Back
        </Link>
        <div className="flex items-center gap-2 sm:gap-2 relative z-10">
          <div className="w-6 h-6 rounded-sm flex items-center justify-center text-[#aaa] text-xs border border-[#555] bg-[#3a3a3a]">
            <QrCode size={12} />
          </div>
          <span className="text-[11px] sm:text-[13px] font-normal tracking-normal text-[#ccc]">
            QR Code Generator
          </span>
          <button 
            onClick={() => setShowHelp(true)}
            className="p-0.5 bg-[#3a3a3a] border border-[#555] rounded-sm text-[#888] hover:bg-[#444] transition-colors"
            title="Help"
          >
            <HelpCircle size={11} />
          </button>
        </div>
      </header>

      <div className="qr-outer" style={{ position: "relative", zIndex: 1, padding: "0 0 120px" }}>

        {/* ─── DESKTOP LAYOUT ─── */}
        <div className="qr-desktop-grid" style={{ display: "none" }}>
          {/* Left: controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Desktop header description */}
            <div style={{ marginBottom: 8, opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(8px)", transition: "all 0.3s ease" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                <Chip icon={<Shield size={10} />} label="100% Private" />
                <Chip icon={<Zap size={10} />} label="Client-side" />
              </div>
              <h1 style={{ margin: 0, fontSize: 14, fontWeight: 500, lineHeight: 1.2, color: "#ccc", letterSpacing: "normal" }}>
                QR Code Generator
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#888", lineHeight: 1.5, maxWidth: 520, fontWeight: 400 }}>
                Craft pixel-perfect QR codes with custom patterns, brand overlays, and precision color control - processed locally, never uploaded.
              </p>
            </div>

            {/* Content type selector + form */}
            <ContentTypeSelector value={contentType} onChange={setContentType} />
            {renderContentForm()}

            {/* Tab bar (desktop) */}
            <div style={{ display: "flex", gap: 0, background: "#3a3a3a", padding: 2, borderRadius: 3, border: "1px solid #555" }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "5px 6px", borderRadius: 2,
                  background: activeTab === tab.id ? "#505050" : "transparent",
                  border: activeTab === tab.id ? "1px solid #666" : "1px solid transparent",
                  color: activeTab === tab.id ? "#fff" : "#888",
                  fontSize: 11, fontWeight: 400, cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
                }}>
                  <span style={{ opacity: activeTab === tab.id ? 1 : 0.5 }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Panel */}
            <div style={{ background: "#3a3a3a", border: "1px solid #555", borderRadius: 3, padding: 10 }}>
              {tabPanels[activeTab]}
            </div>
          </div>

          {/* Right: sticky preview */}
          <div className="qr-sidebar-sticky">
            <PreviewCard 
              canvasRef={canvasRef} 
              previewPulsed={previewPulsed} 
              onExpand={openLightbox} 
              onDownload={download} 
              transparentBg={transparentBg} 
              setTransparentBg={setTransparentBg}
            />
          </div>
        </div>

        {/* ─── MOBILE LAYOUT ─── */}
        <div className="qr-mobile-only qr-main-content" style={{ display: "flex", flexDirection: "column", paddingBottom: 90 }}>

          {/* Mobile header strip */}
          <div style={{ padding: "10px 16px 0", opacity: mounted ? 1 : 0, transform: mounted ? "none" : "translateY(6px)", transition: "all 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 400, color: "#ccc", letterSpacing: "normal", lineHeight: 1.2 }}>
                  QR Code Generator
                </h1>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#888", fontWeight: 400 }}>Client-side · Zero uploads</p>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <Chip icon={<Shield size={10} />} label="Private" small />
              </div>
            </div>
          </div>

          {/* Content Type + Form (mobile) */}
          <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            <ContentTypeSelector value={contentType} onChange={setContentType} />
            {renderContentForm()}
          </div>

          {/* QR PREVIEW (mobile, compact) */}
          <div style={{ padding: "0 20px", marginBottom: 16 }}>
            <div style={{
              background: "#3a3a3a", border: "1px solid #555",
              borderRadius: 3, padding: 8,
              opacity: mounted ? 1 : 0, transform: mounted ? "none" : "scale(0.98)",
              transition: "all 0.3s ease 0.1s",
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {/* Canvas */}
                <div
                  className={`${previewPulsed ? "qr-preview-pulse" : ""} ${transparentBg ? "transparent-checkered" : ""}`}
                  onClick={openLightbox}
                  style={{
                    width: 100, height: 100, flexShrink: 0,
                    background: transparentBg ? undefined : "#fff", borderRadius: 2, overflow: "hidden",
                    cursor: "pointer", padding: 4,
                    border: "1px solid #555",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <canvas ref={mobileCanvasRef} style={{ width: "100%", height: "100%", display: "block", borderRadius: 2 }} />
                </div>

                {/* Right meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 400, color: "#ccc", marginBottom: 4, lineHeight: 1.3, fontFamily: T.font }}>
                    {payload ? "Ready to scan" : "Enter content below"}
                  </div>
                  {payload && (
                    <div style={{ fontSize: 10, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6, maxWidth: "100%", fontWeight: 400 }}>
                      {contentType === "url" ? url : `${activeContentLabel} QR Code`}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    <StatPill label="Error" value="H" />
                    <StatPill label="Format" value="PNG" />
                    <StatPill label="Res" value="2K" />
                  </div>
                  {/* Expand button */}
                  <button onClick={openLightbox} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 8px", background: "#444",
                    border: "1px solid #555", borderRadius: 2,
                    color: "#ccc", fontSize: 10, fontWeight: 400, cursor: "pointer", fontFamily: T.font,
                  }}>
                    {Icons.Expand(10)} Full preview
                  </button>
                </div>
              </div>

              {/* Transparent Background Quick Toggle on Mobile */}
              <div style={{
                marginTop: 8,
                padding: "8px 10px",
                background: "#323232",
                border: "1px solid #555",
                borderRadius: 2,
              }}>
                <ToggleSwitch 
                  label="Transparent Background" 
                  checked={transparentBg} 
                  onChange={setTransparentBg}
                  description="Remove background for overlaying on design assets"
                />
              </div>
            </div>
          </div>

          {/* TAB BAR (mobile) */}
          <div style={{ padding: "0 16px 4px" }}>
            <div style={{ display: "flex", gap: 0, background: "#3a3a3a", padding: 2, borderRadius: 3, border: "1px solid #555" }}>
              {tabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} className="qr-tab-btn" onClick={() => setActiveTab(tab.id)} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 3, padding: "5px 4px",
                    borderRadius: 2,
                    background: active ? "#505050" : "transparent",
                    border: active ? "1px solid #666" : "1px solid transparent",
                    color: active ? "#fff" : "#888",
                    fontSize: 9, fontWeight: 400, letterSpacing: "normal",
                    cursor: "pointer", transition: "all 0.12s", fontFamily: T.font,
                    textTransform: "none",
                  }}>
                    <span style={{ opacity: active ? 1 : 0.5 }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SETTINGS PANEL (mobile) */}
          <div style={{ padding: "8px 16px 0" }}>
            <div style={{
              background: "#3a3a3a", border: "1px solid #555",
              borderRadius: 3, padding: "8px",
            }}>
              {tabPanels[activeTab]}
            </div>
          </div>
        </div>

        {/* ─── MOBILE BOTTOM BAR ─── */}
        <div className="qr-bottom-safe" style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: "8px 16px 20px",
          background: "linear-gradient(to top, #333 70%, transparent)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <button className="qr-dl-btn" onClick={download} style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 10px",
            background: "#4db8d4",
            border: "none", borderRadius: 3,
            color: "#1a1a1a", fontSize: 11, fontWeight: 500,
            cursor: "pointer", fontFamily: T.font,
            transition: "all 0.12s",
          }}>
            {Icons.Download(14)} Export 2048×2048
          </button>

          <button onClick={handleCopy} style={{
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#3a3a3a", border: "1px solid #555",
            borderRadius: 3, color: copied ? "#7dcea0" : "#ccc",
            cursor: "pointer", transition: "all 0.12s", flexShrink: 0,
          }}>
            {copied ? Icons.Check(14) : Icons.Copy(14)}
          </button>
        </div>


                <div className="flex justify-center py-4">
                </div>

        {/* ─── SEO RICH TEXT SECTION ─── */}
        <div style={{
          marginTop: 64,
          padding: "16px",
          background: "#3a3a3a",
          border: "1px solid #555",
          borderRadius: 4,
          color: "#ccc",
          maxWidth: "100%",
          textAlign: "left",
          position: "relative",
          overflow: "hidden",
          boxShadow: "none",
        }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Top Badges */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
              <Chip icon={<Shield size={11} />} label="100% Private" />
              <Chip icon={<Zap size={11} />} label="Browser-Side" />
              <Chip icon={<Check size={11} />} label="No Watermarks" />
            </div>

            {/* Main Title & Subtitle */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 className="" style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#ccc",
                letterSpacing: "normal",
                margin: "0 0 16px",
                lineHeight: 1.2
              }}>
                Free Custom QR Code Generator with No Watermarks
              </h2>
              <p style={{
                fontSize: 12,
                color: "#888",
                lineHeight: 1.65,
                maxWidth: 720,
                margin: "0 auto",
                fontWeight: 500,
              }}>
                Generate beautiful, high-resolution custom QR codes instantly inside your browser. Processed entirely locally with zero server uploads, offering lifetime active scans with zero redirections.
              </p>
            </div>

            {/* Grid of Key Features */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
              marginBottom: 48
            }}>
              {[
                {
                  title: "100% Private Processing",
                  desc: "All code renderings and image center logo inserts occur purely in client-side memory. Your URLs and uploads are never sent to external servers.",
                  icon: <Shield size={16} />
                },
                {
                  title: "Completely Free",
                  desc: "Enjoy unrestricted access without hidden subscription fees, watermark stamps, or expiry thresholds. Generates permanent static codes.",
                  icon: <Zap size={16} />
                },
                {
                  title: "Extensive Customization",
                  desc: "Create 11 types of QR codes (URL, Wi-Fi, vCard, WhatsApp, Email, SMS, Phone, Calendar, Location, UPI, Crypto) with custom dot patterns, finder markers, branded logo overlays, and precision color control.",
                  icon: <Check size={16} />
                }
              ].map(f => (
                <div key={f.title} style={{
                  padding: 12,
                  background: "#323232",
                  border: "1px solid #555",
                  borderRadius: 4,
                  boxShadow: "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ color: "#4db8d4" }}>{f.icon}</div>
                    <h3 className="" style={{ fontSize: 12, fontWeight: 500, margin: 0, color: "#ccc" }}>{f.title}</h3>
                  </div>
                  <p style={{ fontSize: 12, color: "#888", margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Supported QR Code Types & Formats Section */}
            <div style={{ marginBottom: 48 }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h3 style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#ccc",
                  letterSpacing: "normal",
                  margin: "0 0 8px",
                  lineHeight: 1.3
                }}>
                  Supported QR Code Types & Use Cases
                </h3>
                <p style={{
                  fontSize: 11,
                  color: "#888",
                  maxWidth: 680,
                  margin: "0 auto",
                  lineHeight: 1.6,
                  fontWeight: 400
                }}>
                  Explore our 11 supported static QR code formats. Each type generates standard, platform-compatible payloads that modern iPhone and Android cameras recognize instantly.
                </p>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12
              }}>
                {QR_TYPE_SEO_DATA.map(item => (
                  <div 
                    key={item.id} 
                    style={{
                      padding: "12px 14px",
                      background: "#323232",
                      border: "1px solid #555",
                      borderRadius: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 26,
                        height: 26,
                        borderRadius: 3,
                        background: "rgba(77,184,212,0.12)",
                        border: "1px solid rgba(77,184,212,0.3)",
                        color: "#4db8d4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        {item.icon}
                      </div>
                      <h4 style={{ fontSize: 12, fontWeight: 500, color: "#ddd", margin: 0 }}>
                        {item.title}
                      </h4>
                    </div>

                    <p style={{ fontSize: 11, color: "#888", lineHeight: 1.6, margin: 0, fontWeight: 400, flex: 1 }}>
                      {item.description}
                    </p>

                    <div style={{ paddingTop: 8, borderTop: "1px solid #444", marginTop: "auto" }}>
                      <div style={{ fontSize: 9, color: "#777", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5, fontWeight: 500 }}>
                        Target SEO Keywords
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.keywords.map(kw => (
                          <span 
                            key={kw} 
                            style={{
                              fontSize: 9.5,
                              color: "#aaa",
                              background: "#2a2a2a",
                              border: "1px solid #484848",
                              borderRadius: 2,
                              padding: "2px 6px",
                              lineHeight: "13px",
                              fontFamily: T.font,
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <h3 className="" style={{ fontSize: 12, fontWeight: 500, textAlign: "center", color: "#ccc", marginBottom: 28 }}>
                Frequently Asked Questions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <FAQItem 
                  question="Are these QR codes dynamic or static?" 
                  answer="They are 100% static. Static QR codes encode the destination URL directly into the matrix, which means they never expire and do not route through any third-party redirection servers. They will remain active for as long as your destination link exists." 
                />
                <FAQItem 
                  question="Is there a scan limit or expiration?" 
                  answer="No. Because the codes generated are static and reside entirely in the client-side design, there are no redirects, no click trackers, no count limits, and absolutely no expiration dates. You get unlimited scans forever." 
                />
                <FAQItem 
                  question="Can I use custom branding logos?" 
                  answer="Yes! Under the 'Brand' tab, you can upload any custom brand logo (transparent PNG or SVG recommended). Our engine automatically configures error correction to Level H (High), which allows up to 30% of the QR code area to be covered while remaining fully scannable." 
                />
                <FAQItem 
                  question="What types of QR codes can I create?" 
                  answer="We support 11 content types: URL links, Wi-Fi network credentials, vCard digital business cards, WhatsApp direct chat, Email compose, SMS messages, Phone call, Calendar events, GPS geo-location, UPI payments, and Cryptocurrency wallet addresses. Each type generates a properly formatted payload that phone cameras and QR scanners natively understand." 
                />
                <FAQItem 
                  question="How does the Wi-Fi QR code work?" 
                  answer="When you select the Wi-Fi content type, enter your network name (SSID), password, and encryption type. The generated QR code follows the standard WIFI: protocol. When scanned on iOS or Android, it prompts the user to join your Wi-Fi network instantly without manually typing the password." 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Lightbox / Expanded View Modal */}
      {lightbox && lightboxSrc && (
        <div 
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 460, background: "#3a3a3a", borderRadius: 4, border: "1px solid #555",
              padding: 12, display: "flex", flexDirection: "column", gap: 10, boxShadow: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#ccc", fontFamily: 'system-ui, -apple-system, sans-serif' }}>Full Resolution QR Code</div>
              <button 
                onClick={() => setLightbox(false)} 
                style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", display: "flex", padding: 4 }}
              >
                {Icons.Close(18)}
              </button>
            </div>
            <div 
              className={transparentBg ? "transparent-checkered" : ""}
              style={{ 
                background: transparentBg ? undefined : "#fff", 
                borderRadius: 4, padding: 20, 
                border: "1px solid #555",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <img src={lightboxSrc} alt="QR Code" style={{ width: "100%", height: "auto", display: "block", borderRadius: 4 }} />
            </div>
            <button
              onClick={() => { 
                const filename = "qr-code.png";
                const a = document.createElement("a"); a.href = lightboxSrc!; a.download = filename; a.click(); 
                window.dispatchEvent(new CustomEvent("assetnest-download", {
                  detail: { filename: filename, size: "2048 × 2048px" }
                }));
              }}
              className="ig-btn"
              style={{
                width: "100%", padding: "16px", background: "#2a7a8f", border: "1px solid #555", borderRadius: 4,
                color: "#ccc", fontSize: 12, fontWeight: 500, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: 'system-ui, -apple-system, sans-serif',
                boxShadow: "none",
              }}>
              {Icons.Download(17)} Download PNG
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: "#888", fontWeight: 500 }}>
              {Icons.Shield(12)} Generated in your browser · Zero data sent
            </div>
          </div>
        </div>
      )}

      {/* FAQ Help Modal */}
      <HelpModal 
          isOpen={showHelp} 
          onClose={() => setShowHelp(false)} 
          title="QR Generator Technical Specs"
      >
          <div className="space-y-8 text-left max-w-2xl mx-auto py-4">
              <section className="space-y-3">
                  <h3 className="text-lg font-bold text-[#dcdcdc]">
                      Custom Local QR Architectures
                  </h3>
                  <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                      Craft custom-styled static QR codes for your apps, websites, menus, and marketing collateral. All conversions are rendered using client-side canvas buffers, making them highly secure and privacy-friendly.
                  </p>
              </section>

              <section className="space-y-4">
                  <h3 className="text-lg font-bold text-[#dcdcdc]">Guidelines for Best Scannability</h3>
                  <ul className="space-y-3 text-xs text-zinc-600 leading-relaxed font-medium">
                      <li>• <strong>Strong Contrast:</strong> Always maintain a dark color for the foreground modules and a light color for the background to ensure scannability across standard mobile devices.</li>
                      <li>• <strong>Branding Error Tolerance:</strong> Level H error correction is enabled automatically when adding logos, permitting the code to recover up to 30% of missing or obscured data.</li>
                      <li>• <strong>Pattern Selection:</strong> Complex star or emoji patterns are best for creative collateral but might scan slightly slower on older device cameras. Use rounded or dots patterns for a balanced modern look.</li>
                  </ul>
              </section>
          </div>
      </HelpModal>
    </div>
  );
}
