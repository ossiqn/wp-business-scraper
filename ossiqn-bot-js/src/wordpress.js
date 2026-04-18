import { bekle } from "./utils.js";
import * as cfg  from "../config.js";

export class WordPressClient {
    constructor() {
        this.token   = Buffer.from(`${cfg.WP_USER}:${cfg.WP_PASS}`).toString("base64");
        this.apiUrl  = `${cfg.WP_URL}/wp-json/wp/v2/${cfg.WP_POST_TYPE}`;
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": `Basic ${this.token}`,
        };
    }

    async baglantiTest() {
        try {
            const r = await fetch(`${cfg.WP_URL}/wp-json/wp/v2/users/me`, {
                headers: { Authorization: `Basic ${this.token}` },
                signal:  AbortSignal.timeout(10000),
            });
            if (r.status === 200) {
                const d = await r.json();
                return [true, d];
            }
            return [false, {}];
        } catch {
            return [false, {}];
        }
    }

    async kategoriListesi() {
        try {
            const r = await fetch(
                `${cfg.WP_URL}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,count`,
                { headers: this.headers, signal: AbortSignal.timeout(10000) }
            );
            return r.ok ? r.json() : [];
        } catch {
            return [];
        }
    }

    async baslikVarMi(baslik) {
        try {
            const r = await fetch(
                `${this.apiUrl}?search=${encodeURIComponent(baslik)}&per_page=1&_fields=id,title`,
                { headers: this.headers, signal: AbortSignal.timeout(15000) }
            );
            if (!r.ok) return false;
            const posts = await r.json();
            return posts.some(
                (p) => p.title?.rendered?.trim().toLowerCase() === baslik.trim().toLowerCase()
            );
        } catch {
            return false;
        }
    }

    _icerikOlustur(i) {
        const tel    = i.telefon    || "—";
        const web    = i.web_sitesi || "—";
        const adres  = i.adres      || "—";
        const puan   = i.puan       || "—";
        const yorum  = i.yorum_sayisi;
        const harita = i.enlem && i.boylam ? `https://maps.google.com/?q=${i.enlem},${i.boylam}` : "";
        const webLink    = web !== "—" ? `<a href="${web}" target="_blank" rel="nofollow">${web}</a>` : "—";
        const haritaLink = harita ? `<p><strong>🗺️ Harita:</strong> <a href="${harita}" target="_blank" rel="nofollow">Google Haritada Gör</a></p>` : "";
        const chips = [
            i.sehir  ? `<span class="firma-sehir">${i.sehir}</span>`   : "",
            i.sektor ? `<span class="firma-sektor">${i.sektor}</span>` : "",
        ].filter(Boolean).join(" ");
        return (
            `<div class="firma-rehber-kart">`
            + (chips ? `<p>${chips}</p>` : "")
            + `<p><strong>📍 Adres:</strong> ${adres}</p>`
            + `<p><strong>📞 Telefon:</strong> ${tel}</p>`
            + `<p><strong>🌐 Web Sitesi:</strong> ${webLink}</p>`
            + `<p><strong>⭐ Puan:</strong> ${puan}${yorum ? ` (${yorum} yorum)` : ""}</p>`
            + haritaLink
            + `</div>`
        );
    }

    _metaOlustur(i) {
        return {
            firma_telefon:     i.telefon     ?? "",
            firma_adres:       i.adres        ?? "",
            firma_web:         i.web_sitesi   ?? "",
            firma_puan:        i.puan         ?? "",
            firma_yorum:       i.yorum_sayisi ?? "",
            firma_enlem:       i.enlem        ?? "",
            firma_boylam:      i.boylam       ?? "",
            firma_kategoriler: i.kategoriler  ?? "",
            firma_sehir:       i.sehir        ?? "",
            firma_sektor:      i.sektor       ?? "",
            firma_kaynak:      "google_places_api",
        };
    }

    async _gonder(payload, deneme = 0) {
        if (deneme >= cfg.MAX_DENEME) return null;
        try {
            const r = await fetch(this.apiUrl, {
                method:  "POST",
                headers: this.headers,
                body:    JSON.stringify(payload),
                signal:  AbortSignal.timeout(20000),
            });
            if (r.status === 429) { await bekle(15000); return this._gonder(payload, deneme + 1); }
            return r;
        } catch {
            await bekle(5000);
            return this._gonder(payload, deneme + 1);
        }
    }

    async isletmeEkle(isletme, ilerlemeCb = null) {
        const baslik = (isletme.ad ?? "").trim();
        if (!baslik)                        return [null, "bos_baslik"];
        if (await this.baslikVarMi(baslik)) return [null, "mevcut"];
        const payload = {
            title:      baslik,
            content:    this._icerikOlustur(isletme),
            status:     cfg.WP_STATUS,
            categories: [cfg.WP_KATEGORI_ID],
            meta:       this._metaOlustur(isletme),
        };
        const r = await this._gonder(payload);
        if (!r) return [null, "hata"];
        if (r.status === 201) {
            const d = await r.json();
            ilerlemeCb?.("eklendi", baslik, d.id);
            return [d.id, "eklendi"];
        }
        ilerlemeCb?.("hata", baslik, r.status);
        return [null, `hata_${r.status}`];
    }

    async topluEkle(liste, storage = null, ilerlemeCb = null) {
        let eklenen = 0, atlanan = 0, hatali = 0;
        for (const isletme of liste) {
            const [wpId, durum] = await this.isletmeEkle(isletme, ilerlemeCb);
            if      (durum === "eklendi") { eklenen++; if (storage && isletme.id) storage.wpEklendiIsaretle(isletme.id, wpId); }
            else if (durum === "mevcut")  atlanan++;
            else                          hatali++;
            await bekle(400);
        }
        return { eklenen, atlanan, hatali };
    }
}
