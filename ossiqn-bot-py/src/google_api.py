import time
import requests
import config

def _api_iste(headers, payload, deneme=0):
    if deneme >= config.MAX_DENEME:
        return None
    try:
        r = requests.post(config.PLACES_URL, headers=headers, json=payload, timeout=25)
        if r.status_code == 429:
            time.sleep(10 * (deneme + 1))
            return _api_iste(headers, payload, deneme + 1)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.Timeout:
        time.sleep(5)
        return _api_iste(headers, payload, deneme + 1)
    except Exception:
        return None

def google_isletmeleri_cek(sorgu, sehir="", sektor="", maks_sayfa=None, ilerleme_cb=None):
    if maks_sayfa is None:
        maks_sayfa = config.MAKS_SAYFA
    sonuclar    = []
    sayfa_token = ""
    sayac       = 0
    headers     = {
        "Content-Type":     "application/json",
        "X-Goog-Api-Key":  config.GOOGLE_API_KEY,
        "X-Goog-FieldMask": config.FIELD_MASK,
    }
    while sayac < maks_sayfa:
        payload = {"textQuery": sorgu, "languageCode": "tr", "maxResultCount": 20}
        if sayfa_token:
            payload["pageToken"] = sayfa_token
        data = _api_iste(headers, payload)
        if not data:
            break
        for place in data.get("places", []):
            if place.get("businessStatus", "OPERATIONAL") != "OPERATIONAL":
                continue
            isletme = {
                "ad":           place.get("displayName", {}).get("text", ""),
                "adres":        place.get("formattedAddress", ""),
                "telefon":      place.get("nationalPhoneNumber", ""),
                "web_sitesi":   place.get("websiteUri", ""),
                "puan":         str(place.get("rating", "")),
                "yorum_sayisi": str(place.get("userRatingCount", 0)),
                "enlem":        str(place.get("location", {}).get("latitude", "")),
                "boylam":       str(place.get("location", {}).get("longitude", "")),
                "kategoriler":  ", ".join(place.get("types", [])),
                "sorgu":        sorgu,
                "sehir":        sehir,
                "sektor":       sektor,
            }
            sonuclar.append(isletme)
            if ilerleme_cb:
                ilerleme_cb(isletme)
        sayfa_token = data.get("nextPageToken", "")
        if not sayfa_token:
            break
        sayac += 1
        time.sleep(config.ISTEK_ARALIK)
    return sonuclar
