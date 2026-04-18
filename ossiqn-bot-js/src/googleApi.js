import { bekle } from "./utils.js";
import * as cfg  from "../config.js";

async function apiIste(payload, deneme = 0) {
    if (deneme >= cfg.MAX_DENEME) return null;
    try {
        const r = await fetch(cfg.PLACES_URL, {
            method:  "POST",
            headers: {
                "Content-Type":     "application/json",
                "X-Goog-Api-Key":  cfg.GOOGLE_API_KEY,
                "X-Goog-FieldMask": cfg.FIELD_MASK,
            },
            body:   JSON.stringify(payload),
            signal: AbortSignal.timeout(25000),
        });
        if (r.status === 429) {
            await bekle(10000 * (deneme + 1));
            return apiIste(payload, deneme + 1);
        }
        if (!r.ok) return null;
        return r.json();
    } catch {
        await bekle(5000);
        return apiIste(payload, deneme + 1);
    }
}

export async function googleIsletmeleriCek(sorgu, { sehir = "", sektor = "", maksimumSayfa = cfg.MAKS_SAYFA, ilerlemeCb = null } = {}) {
    const sonuclar = [];
    let sayfaToken = "";
    let sayac      = 0;

    while (sayac < maksimumSayfa) {
        const payload = { textQuery: sorgu, languageCode: "tr", maxResultCount: 20 };
        if (sayfaToken) payload.pageToken = sayfaToken;

        const data = await apiIste(payload);
        if (!data) break;

        for (const place of data.places ?? []) {
            if ((place.businessStatus ?? "OPERATIONAL") !== "OPERATIONAL") continue;
            const isletme = {
                ad:           place.displayName?.text            ?? "",
                adres:        place.formattedAddress             ?? "",
                telefon:      place.nationalPhoneNumber          ?? "",
                web_sitesi:   place.websiteUri                   ?? "",
                puan:         String(place.rating                ?? ""),
                yorum_sayisi: String(place.userRatingCount       ?? 0),
                enlem:        String(place.location?.latitude    ?? ""),
                boylam:       String(place.location?.longitude   ?? ""),
                kategoriler:  (place.types ?? []).join(", "),
                sorgu,
                sehir,
                sektor,
            };
            sonuclar.push(isletme);
            ilerlemeCb?.(isletme);
        }

        sayfaToken = data.nextPageToken ?? "";
        if (!sayfaToken) break;
        sayac++;
        await bekle(cfg.ISTEK_ARALIK);
    }

    return sonuclar;
}
