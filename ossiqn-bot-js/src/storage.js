import Database  from "better-sqlite3";
import { writeFileSync, mkdirSync } from "fs";
import { join }  from "path";
import { zamandamgasi } from "./utils.js";

export class Storage {
    constructor(dataDizini = "data") {
        this.dir = dataDizini;
        mkdirSync(dataDizini, { recursive: true });
        this.db = new Database(join(dataDizini, "isletmeler.db"));
        this._init();
    }

    _init() {
        this.db.exec(`
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
                ekleme_tarihi   TEXT    DEFAULT (datetime('now','localtime'))
            );
            CREATE INDEX IF NOT EXISTS idx_ad_adres  ON isletmeler(ad, adres);
            CREATE INDEX IF NOT EXISTS idx_wp        ON isletmeler(wp_eklendi);
            CREATE INDEX IF NOT EXISTS idx_sehir     ON isletmeler(sehir);
            CREATE INDEX IF NOT EXISTS idx_sektor    ON isletmeler(sektor);
        `);
        this._ins = this.db.prepare(`
            INSERT INTO isletmeler
                (ad,adres,telefon,web_sitesi,puan,yorum_sayisi,enlem,boylam,kategoriler,sorgu,sehir,sektor)
            VALUES
                (@ad,@adres,@telefon,@web_sitesi,@puan,@yorum_sayisi,@enlem,@boylam,@kategoriler,@sorgu,@sehir,@sektor)
        `);
        this._dupCheck = this.db.prepare(
            "SELECT id FROM isletmeler WHERE LOWER(TRIM(ad))=LOWER(TRIM(?)) AND LOWER(TRIM(adres))=LOWER(TRIM(?))"
        );
    }

    duplicateMi(ad, adres) {
        return !!this._dupCheck.get(ad, adres);
    }

    topluKaydet(liste) {
        const islem = this.db.transaction((arr) => {
            let yeni = 0;
            for (const i of arr) {
                if (this.duplicateMi(i.ad ?? "", i.adres ?? "")) continue;
                this._ins.run(i);
                yeni++;
            }
            return yeni;
        });
        return islem(liste);
    }

    wpEklenmemisleriGetir() {
        return this.db.prepare("SELECT * FROM isletmeler WHERE wp_eklendi=0").all();
    }

    wpEklendiIsaretle(id, wpId) {
        this.db.prepare("UPDATE isletmeler SET wp_eklendi=1, wp_id=? WHERE id=?").run(wpId, id);
    }

    istatistik() {
        const toplam   = this.db.prepare("SELECT COUNT(*) AS n FROM isletmeler").get().n;
        const eklenmis = this.db.prepare("SELECT COUNT(*) AS n FROM isletmeler WHERE wp_eklendi=1").get().n;
        const bekleyen = this.db.prepare("SELECT COUNT(*) AS n FROM isletmeler WHERE wp_eklendi=0").get().n;
        return { toplam, eklenmis, bekleyen };
    }

    sehirIstatistik() {
        return this.db.prepare(`
            SELECT sehir, COUNT(*) AS toplam, SUM(wp_eklendi) AS eklenmis
            FROM isletmeler GROUP BY sehir ORDER BY toplam DESC
        `).all();
    }

    sektorIstatistik() {
        return this.db.prepare(`
            SELECT sektor, COUNT(*) AS toplam FROM isletmeler GROUP BY sektor ORDER BY toplam DESC
        `).all();
    }

    sorguGecmisi() {
        return this.db.prepare(`
            SELECT sorgu, COUNT(*) AS sayi FROM isletmeler GROUP BY sorgu ORDER BY sayi DESC LIMIT 30
        `).all();
    }

    csvExport(sadeceBekleyenler = false) {
        const q = sadeceBekleyenler
            ? "SELECT * FROM isletmeler WHERE wp_eklendi=0"
            : "SELECT * FROM isletmeler";
        const rows = this.db.prepare(q).all();
        if (!rows.length) return [null, 0];
        const keys = Object.keys(rows[0]);
        const lines = rows.map((r) =>
            keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")
        );
        const dosya = join(this.dir, `export_${zamandamgasi()}.csv`);
        writeFileSync(dosya, "\uFEFF" + [keys.join(","), ...lines].join("\n"), "utf-8");
        return [dosya, rows.length];
    }

    jsonExport() {
        const rows  = this.db.prepare("SELECT * FROM isletmeler").all();
        const dosya = join(this.dir, `export_${zamandamgasi()}.json`);
        writeFileSync(dosya, JSON.stringify(rows, null, 2), "utf-8");
        return [dosya, rows.length];
    }
}
