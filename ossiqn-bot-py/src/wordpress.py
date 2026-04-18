import time
import requests
import config

class WordPressClient:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = (config.WP_USER, config.WP_PASS)
        self.session.headers.update({"Content-Type": "application/json"})
        self.api_url = f"{config.WP_URL}/wp-json/wp/v2/{config.WP_POST_TYPE}"

    def baglanti_test(self):
        try:
            r = self.session.get(f"{config.WP_URL}/wp-json/wp/v2/users/me", timeout=10)
            return r.status_code == 200, r.json() if r.status_code == 200 else {}
        except Exception:
            return False, {}

    def kategori_listesi(self):
        try:
            r = self.session.get(
                f"{config.WP_URL}/wp-json/wp/v2/categories",
                params={"per_page": 100, "_fields": "id,name,count"},
                timeout=10
            )
            return r.json() if r.status_code == 200 else []
        except Exception:
            return []

    def baslik_var_mi(self, baslik):
        try:
            r = self.session.get(
                self.api_url,
                params={"search": baslik, "per_page": 1, "_fields": "id,title"},
                timeout=15
            )
            if r.status_code == 200:
                for post in r.json():
                    if post.get("title", {}).get("rendered", "").strip().lower() == baslik.strip().lower():
                        return True
        except Exception:
            pass
        return False

    def _icerik_olustur(self, isletme):
        tel    = isletme.get("telefon")    or "—"
        web    = isletme.get("web_sitesi") or "—"
        adres  = isletme.get("adres")      or "—"
        puan   = isletme.get("puan")       or "—"
        yorum  = isletme.get("yorum_sayisi", "")
        sehir  = isletme.get("sehir", "")
        sektor = isletme.get("sektor", "")
        enlem  = isletme.get("enlem", "")
        boylam = isletme.get("boylam", "")
        harita = f"https://maps.google.com/?q={enlem},{boylam}" if enlem and boylam else ""
        web_link    = f'<a href="{web}" target="_blank" rel="nofollow">{web}</a>' if web != "—" else "—"
        harita_link = f'<p><strong>🗺️ Harita:</strong> <a href="{harita}" target="_blank" rel="nofollow">Google Haritada Gör</a></p>' if harita else ""
        sehir_chip  = f'<span class="firma-sehir">{sehir}</span>' if sehir else ""
        sektor_chip = f'<span class="firma-sektor">{sektor}</span>' if sektor else ""
        return (
            f'<div class="firma-rehber-kart">'
            + (f'<p>{sehir_chip} {sektor_chip}</p>' if sehir or sektor else "")
            + f'<p><strong>📍 Adres:</strong> {adres}</p>'
            f'<p><strong>📞 Telefon:</strong> {tel}</p>'
            f'<p><strong>🌐 Web Sitesi:</strong> {web_link}</p>'
            f'<p><strong>⭐ Puan:</strong> {puan}' + (f' ({yorum} yorum)' if yorum else '') + '</p>'
            + harita_link
            + f'</div>'
        )

    def _meta_olustur(self, isletme):
        return {
            "firma_telefon":     isletme.get("telefon", ""),
            "firma_adres":       isletme.get("adres", ""),
            "firma_web":         isletme.get("web_sitesi", ""),
            "firma_puan":        isletme.get("puan", ""),
            "firma_yorum":       isletme.get("yorum_sayisi", ""),
            "firma_enlem":       isletme.get("enlem", ""),
            "firma_boylam":      isletme.get("boylam", ""),
            "firma_kategoriler": isletme.get("kategoriler", ""),
            "firma_sehir":       isletme.get("sehir", ""),
            "firma_sektor":      isletme.get("sektor", ""),
            "firma_kaynak":      "google_places_api",
        }

    def _gonder(self, payload, deneme=0):
        if deneme >= config.MAX_DENEME:
            return None
        try:
            r = self.session.post(self.api_url, json=payload, timeout=20)
            if r.status_code == 429:
                time.sleep(15)
                return self._gonder(payload, deneme + 1)
            return r
        except Exception:
            time.sleep(5)
            return self._gonder(payload, deneme + 1)

    def isletme_ekle(self, isletme, ilerleme_cb=None):
        baslik = (isletme.get("ad") or "").strip()
        if not baslik:
            return None, "bos_baslik"
        if self.baslik_var_mi(baslik):
            return None, "mevcut"
        payload = {
            "title":      baslik,
            "content":    self._icerik_olustur(isletme),
            "status":     config.WP_STATUS,
            "categories": [config.WP_KATEGORI_ID],
            "meta":       self._meta_olustur(isletme),
        }
        r = self._gonder(payload)
        if r is None:
            return None, "hata"
        if r.status_code == 201:
            wp_id = r.json().get("id")
            if ilerleme_cb:
                ilerleme_cb("eklendi", baslik, wp_id)
            return wp_id, "eklendi"
        if ilerleme_cb:
            ilerleme_cb("hata", baslik, r.status_code)
        return None, f"hata_{r.status_code}"

    def toplu_ekle(self, isletmeler, storage=None, ilerleme_cb=None):
        eklenen = atlanan = hatali = 0
        for isletme in isletmeler:
            wp_id, durum = self.isletme_ekle(isletme, ilerleme_cb)
            if durum == "eklendi":
                eklenen += 1
                if storage and isletme.get("id"):
                    storage.wp_eklendi_isaretle(isletme["id"], wp_id)
            elif durum == "mevcut":
                atlanan += 1
            else:
                hatali += 1
            time.sleep(0.4)
        return {"eklenen": eklenen, "atlanan": atlanan, "hatali": hatali}
