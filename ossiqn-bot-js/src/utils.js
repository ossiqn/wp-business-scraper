import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";

export const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

export function zamandamgasi() {
    return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

export function tarihStr() {
    return new Date().toLocaleString("tr-TR");
}

export function sureFormatla(ms) {
    const s = Math.round(ms / 1000);
    if (s < 60)   return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}dk ${s % 60}s`;
    return `${Math.floor(s / 3600)}sa ${Math.floor((s % 3600) / 60)}dk`;
}

export function logYaz(dosya, satir) {
    try {
        mkdirSync(dirname(dosya), { recursive: true });
        appendFileSync(dosya, `[${tarihStr()}] ${satir}\n`, "utf-8");
    } catch {}
}
