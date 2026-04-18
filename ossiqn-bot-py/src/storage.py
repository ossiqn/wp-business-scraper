import os
import json
import csv
import sqlite3
from .utils import zaman_damgasi

class Storage:
    def __init__(self, data_dizini="data"):
        self.data_dizini = data_dizini
        os.makedirs(data_dizini, exist_ok=True)
        self.db_yolu = os.path.join(data_dizini, "isletmeler.db")
        self._db_baslat()

    def _db_baslat(self):
        with sqlite3.connect(self.db_yolu) as c:
            c.executescript("""
                CREATE TABLE IF NOT EXISTS isletmeler (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    ad              TEXT NOT NULL,
                    adres           TEXT,
                    telefon         TEXT,
                    web_sitesi      TEXT,
                    puan            TEXT,
                    yorum_sayisi    TEXT,
                    enlem           TEXT,
                    boylam          TEXT,
                    kategoriler     TEXT,
                    sorgu           TEXT,
                    sehir           TEXT,
                    sektor          TEXT,
                    wp_id           INTEGER DEFAULT NULL,
                    wp_eklendi      INTEGER DEFAULT 0,
                    ekleme_tarihi   TEXT DEFAULT (datetime('now','localtime'))
                );
                CREATE INDEX IF NOT EXISTS idx_ad_adres   ON isletmeler(ad, adres);
                CREATE INDEX IF NOT EXISTS idx_wp         ON isletmeler(wp_eklendi);
                CREATE INDEX IF NOT EXISTS idx_sehir      ON isletmeler(sehir);
                CREATE INDEX IF NOT EXISTS idx_sektor     ON isletmeler(sektor);
            """)

    def duplicate_mi(self, ad, adres):
        with sqlite3.connect(self.db_yolu) as c:
            r = c.execute(
                "SELECT id FROM isletmeler WHERE LOWER(TRIM(ad))=LOWER(TRIM(?)) AND LOWER(TRIM(adres))=LOWER(TRIM(?))",
                (ad, adres)
            ).fetchone()
            return r is not None

    def toplu_kaydet(self, isletmeler):
        yeni = 0
        with sqlite3.connect(self.db_yolu) as c:
            for i in isletmeler:
                if self.duplicate_mi(i.get("ad",""), i.get("adres","")):
                    continue
                c.execute(
                    """INSERT INTO isletmeler
                       (ad,adres,telefon,web_sitesi,puan,yorum_sayisi,enlem,boylam,kategoriler,sorgu,sehir,sektor)
                       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (i.get("ad",""), i.get("adres",""), i.get("telefon",""),
                     i.get("web_sitesi",""), i.get("puan",""), i.get("yorum_sayisi",""),
                     i.get("enlem",""), i.get("boylam",""), i.get("kategoriler",""),
                     i.get("sorgu",""), i.get("sehir",""), i.get("sektor",""))
                )
                yeni += 1
        return yeni

    def wp_eklenmemisleri_getir(self):
        with sqlite3.connect(self.db_yolu) as c:
            c.row_factory = sqlite3.Row
            return [dict(r) for r in c.execute("SELECT * FROM isletmeler WHERE wp_eklendi=0").fetchall()]

    def wp_eklendi_isaretle(self, db_id, wp_id):
        with sqlite3.connect(self.db_yolu) as c:
            c.execute("UPDATE isletmeler SET wp_eklendi=1, wp_id=? WHERE id=?", (wp_id, db_id))

    def istatistik(self):
        with sqlite3.connect(self.db_yolu) as c:
            toplam   = c.execute("SELECT COUNT(*) FROM isletmeler").fetchone()[0]
            eklenmis = c.execute("SELECT COUNT(*) FROM isletmeler WHERE wp_eklendi=1").fetchone()[0]
            bekleyen = c.execute("SELECT COUNT(*) FROM isletmeler WHERE wp_eklendi=0").fetchone()[0]
        return {"toplam": toplam, "eklenmis": eklenmis, "bekleyen": bekleyen}

    def sehir_istatistik(self):
        with sqlite3.connect(self.db_yolu) as c:
            return c.execute(
                "SELECT sehir, COUNT(*) as toplam, SUM(wp_eklendi) as eklenmis FROM isletmeler GROUP BY sehir ORDER BY toplam DESC"
            ).fetchall()

    def sektor_istatistik(self):
        with sqlite3.connect(self.db_yolu) as c:
            return c.execute(
                "SELECT sektor, COUNT(*) as toplam FROM isletmeler GROUP BY sektor ORDER BY toplam DESC"
            ).fetchall()

    def sorgu_gecmisi(self):
        with sqlite3.connect(self.db_yolu) as c:
            return c.execute(
                "SELECT sorgu, COUNT(*) as sayi FROM isletmeler GROUP BY sorgu ORDER BY sayi DESC LIMIT 30"
            ).fetchall()

    def csv_export(self, sadece_bekleyenler=False):
        sorgu = "SELECT * FROM isletmeler WHERE wp_eklendi=0" if sadece_bekleyenler else "SELECT * FROM isletmeler"
        dosya = os.path.join(self.data_dizini, f"export_{zaman_damgasi()}.csv")
        with sqlite3.connect(self.db_yolu) as c:
            c.row_factory = sqlite3.Row
            satirlar = [dict(r) for r in c.execute(sorgu).fetchall()]
        if not satirlar:
            return None, 0
        with open(dosya, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=satirlar[0].keys())
            w.writeheader()
            w.writerows(satirlar)
        return dosya, len(satirlar)

    def json_export(self):
        dosya = os.path.join(self.data_dizini, f"export_{zaman_damgasi()}.json")
        with sqlite3.connect(self.db_yolu) as c:
            c.row_factory = sqlite3.Row
            satirlar = [dict(r) for r in c.execute("SELECT * FROM isletmeler").fetchall()]
        with open(dosya, "w", encoding="utf-8") as f:
            json.dump(satirlar, f, ensure_ascii=False, indent=2)
        return dosya, len(satirlar)
