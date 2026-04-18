import { select, checkbox, input, confirm, search } from "@inquirer/prompts";
import chalk       from "chalk";
import cliProgress from "cli-progress";
import Table       from "cli-table3";
import * as cfg    from "../config.js";

const C = {
    accent:  (t) => chalk.cyan(t),
    bold:    (t) => chalk.bold(t),
    green:   (t) => chalk.green(t),
    yellow:  (t) => chalk.yellow(t),
    red:     (t) => chalk.red(t),
    dim:     (t) => chalk.dim(t),
    h:       (t) => chalk.bold.cyan(t),
};

export function baslikGoster() {
    console.clear();
    console.log();
    console.log(C.accent("  ╔═══════════════════════════════════════════════╗"));
    console.log(C.accent("  ║") + chalk.bold("   🗺️  ossiqn.com.tr — Google İşletme Botu v2    ") + C.accent("║"));
    console.log(C.accent("  ║") + C.dim("       Google Places API  →  WordPress Rehberi  ") + C.accent("║"));
    console.log(C.accent("  ╚═══════════════════════════════════════════════╝"));
    console.log();
}

export function istatistikGoster(storage) {
    const ist = storage.istatistik();
    const t = new Table({ style: { head: [] }, colWidths: [26, 10] });
    t.push(
        [C.dim("📦 Veritabanı Toplam"),   C.accent(String(ist.toplam))],
        [C.dim("✅ WordPress'e Eklenen"), C.green(String(ist.eklenmis))],
        [C.dim("⏳ Bekleyen"),            C.yellow(String(ist.bekleyen))],
    );
    console.log(C.h("  ── Mevcut Durum ─────────────────────────────"));
    console.log(t.toString());
    console.log();
}

export function apiHazirMi() {
    const uyarilar = [];
    if (cfg.GOOGLE_API_KEY.includes("BURAYA")) uyarilar.push(chalk.red("  ⚠  GOOGLE_API_KEY") + "  config.js dosyasında henüz girilmemiş!");
    if (cfg.WP_USER.includes("BURAYA"))         uyarilar.push(chalk.red("  ⚠  WP_USER") +        "  config.js dosyasında henüz girilmemiş!");
    if (cfg.WP_PASS.includes("BURAYA"))         uyarilar.push(chalk.red("  ⚠  WP_PASS") +        "  config.js dosyasında henüz girilmemiş!");
    uyarilar.forEach((u) => console.log(u));
    if (uyarilar.length) console.log();
    return uyarilar.length === 0;
}

export async function anaMenu() {
    return select({
        message: "Ne yapmak istiyorsunuz?",
        choices: [
            { name: "🔍  Google'dan Yeni İşletme Çek",        value: "cek"        },
            { name: "📤  Bekleyenleri WordPress'e Aktar",      value: "aktar"      },
            { name: "🔄  Çek + Aktar (Tek Seferde)",           value: "cek_aktar"  },
            { name: "📊  Veritabanı İstatistikleri",           value: "istatistik" },
            { name: "🏙️   Şehir Bazlı İstatistik",             value: "sehir_ist"  },
            { name: "🏷️   Sektör Bazlı İstatistik",            value: "sektor_ist" },
            { name: "📋  Sorgu Geçmişi",                       value: "gecmis"     },
            { name: "💾  Dışa Aktar (CSV / JSON)",             value: "export"     },
            { name: "🔌  WordPress Bağlantı Testi",            value: "wp_test"    },
            { name: "📂  WordPress Kategorileri",              value: "kategoriler"},
            { name: "⚙️   Ayarları Görüntüle",                 value: "ayarlar"    },
            { name: "❌  Çıkış",                               value: "cikis"      },
        ],
    });
}

export async function sehirSec() {
    const mod = await select({
        message: "Şehir seçim modu:",
        choices: [
            { name: "🔎  Arayarak tek şehir seç",              value: "ara"    },
            { name: "☑️   Birden fazla şehir seç (checkbox)",   value: "coklu"  },
            { name: "🇹🇷  Tüm Türkiye (81 il)",                value: "hepsi"  },
            { name: "✏️   Manuel gir (özel sorgu)",             value: "manuel" },
        ],
    });
    if (mod === "hepsi")  return [...cfg.SEHIRLER];
    if (mod === "manuel") {
        const s = await input({ message: "Özel sorgu yazın (örn: Konya Meram):" });
        return s?.trim() ? [s.trim()] : [];
    }
    if (mod === "ara") {
        const sehir = await search({
            message: "Şehir adını yazmaya başlayın:",
            source: async (term) => {
                const q = (term ?? "").toLocaleLowerCase("tr-TR");
                return cfg.SEHIRLER
                    .filter((s) => s.toLocaleLowerCase("tr-TR").includes(q))
                    .map((s) => ({ name: s, value: s }));
            },
        });
        return sehir ? [sehir] : [];
    }
    const secilen = await checkbox({
        message:  "Şehirleri işaretleyin (SPACE → seç, ENTER → onayla):",
        choices:  cfg.SEHIRLER.map((s) => ({ name: s, value: s })),
        pageSize: 20,
    });
    return secilen ?? [];
}

export async function sektorSec() {
    const mod = await select({
        message: "Sektör seçim modu:",
        choices: [
            { name: "🔎  Arayarak tek sektör seç",             value: "ara"    },
            { name: "☑️   Birden fazla sektör seç (checkbox)",  value: "coklu"  },
            { name: "🌐  Tüm sektörler",                       value: "hepsi"  },
            { name: "✏️   Manuel gir",                          value: "manuel" },
        ],
    });
    if (mod === "hepsi")  return [...cfg.SEKTORLER];
    if (mod === "manuel") {
        const s = await input({ message: "Sektör adını yazın (örn: Pizzacılar):" });
        return s?.trim() ? [s.trim()] : [];
    }
    if (mod === "ara") {
        const sektor = await search({
            message: "Sektör adını yazmaya başlayın:",
            source: async (term) => {
                const q = (term ?? "").toLocaleLowerCase("tr-TR");
                return cfg.SEKTORLER
                    .filter((s) => s.toLocaleLowerCase("tr-TR").includes(q))
                    .map((s) => ({ name: s, value: s }));
            },
        });
        return sektor ? [sektor] : [];
    }
    const secilen = await checkbox({
        message:  "Sektörleri işaretleyin:",
        choices:  cfg.SEKTORLER.map((s) => ({ name: s, value: s })),
        pageSize: 20,
    });
    return secilen ?? [];
}

export async function sayfaSayisiSec() {
    const v = await input({
        message:  "Sorgu başına maksimum sayfa (1-10, varsayılan 5):",
        default:  "5",
        validate: (x) => {
            const n = Number(x);
            return (Number.isInteger(n) && n >= 1 && n <= 10) || "1-10 arası tam sayı girin";
        },
    });
    return parseInt(v, 10) || 5;
}

export async function sorguOnay(sorgular) {
    console.log();
    console.log(C.h(`  ${sorgular.length} sorgu oluşturuldu:`));
    const t = new Table({ style: { head: [] }, colWidths: [5, 50] });
    sorgular.slice(0, 25).forEach((s, i) => t.push([C.dim(String(i + 1)), s]));
    if (sorgular.length > 25) t.push(["...", C.dim(`+${sorgular.length - 25} sorgu daha`)]);
    console.log(t.toString());
    console.log();
    return confirm({ message: `${sorgular.length} sorgu çalıştırılsın mı?`, default: true });
}

export function ilerlemeCubugu(toplam) {
    return new cliProgress.SingleBar({
        format: `  ${C.accent("{bar}")} {percentage}%  {value}/{total}  ${C.dim("{duration_formatted}")}  {sorgu}`,
        barCompleteChar:   "█",
        barIncompleteChar: "░",
        hideCursor: true,
    }, cliProgress.Presets.shades_classic);
}

export function sonucTablosuGoster(sonuclar) {
    console.log();
    const t = new Table({
        head:      [C.h("Firma Adı"), C.h("Telefon"), C.h("Puan"), C.h("Şehir"), C.h("Sektör")],
        colWidths: [28, 18, 8, 16, 22],
        style:     { head: [], border: ["cyan"] },
    });
    for (const r of sonuclar.slice(0, 15)) {
        t.push([
            (r.ad ?? "").slice(0, 26),
            r.telefon || C.dim("—"),
            r.puan    || C.dim("—"),
            r.sehir   || C.dim("—"),
            r.sektor  || C.dim("—"),
        ]);
    }
    console.log(t.toString());
    if (sonuclar.length > 15) console.log(C.dim(`  ... ve ${sonuclar.length - 15} kayıt daha`));
    console.log();
}

export function aktarIlerleme(durum, baslik, detay) {
    const ad = (baslik ?? "").slice(0, 58).padEnd(58);
    if      (durum === "eklendi") console.log(`  ${C.green("✓")} ${C.dim(ad)}  ${C.accent("#" + detay)}`);
    else if (durum === "mevcut")  console.log(`  ${C.yellow("~")} ${C.dim(ad)}  ${C.dim("mevcut")}`);
    else                          console.log(`  ${C.red("✗")} ${C.dim(ad)}  ${C.red("hata " + detay)}`);
}

export async function exportMenu() {
    return select({
        message: "Format seçin:",
        choices: [
            { name: "📄 CSV — Tüm kayıtlar (Excel uyumlu)",  value: "csv"          },
            { name: "📄 CSV — Sadece bekleyenler",            value: "csv_bekleyen" },
            { name: "📋 JSON — Tüm kayıtlar",                value: "json"         },
        ],
    });
}

export function sehirIstatistikGoster(rows) {
    const t = new Table({
        head:      [C.h("Şehir"), C.h("Toplam"), C.h("WP'ye Eklenen"), C.h("Bekleyen")],
        colWidths: [20, 10, 18, 10],
        style:     { head: [], border: ["cyan"] },
    });
    rows.slice(0, 30).forEach((r) => {
        const ek = r.eklenmis ?? 0;
        t.push([r.sehir || "—", String(r.toplam), C.green(String(ek)), C.yellow(String(r.toplam - ek))]);
    });
    console.log(C.h("\n  ── Şehir Bazlı Dağılım ───────────────────────"));
    console.log(t.toString());
    console.log();
}

export function sektorIstatistikGoster(rows) {
    const t = new Table({
        head:      [C.h("Sektör"), C.h("Kayıt Sayısı")],
        colWidths: [30, 14],
        style:     { head: [], border: ["cyan"] },
    });
    rows.slice(0, 30).forEach((r) => t.push([r.sektor || "—", C.accent(String(r.toplam))]));
    console.log(C.h("\n  ── Sektör Bazlı Dağılım ──────────────────────"));
    console.log(t.toString());
    console.log();
}

export function gecmisGoster(rows) {
    if (!rows.length) { console.log(C.dim("  Henüz sorgu geçmişi yok.")); return; }
    const t = new Table({
        head:      [C.h("Sorgu"), C.h("Kayıt Sayısı")],
        colWidths: [48, 14],
        style:     { head: [], border: ["cyan"] },
    });
    rows.forEach((r) => t.push([r.sorgu, C.accent(String(r.sayi))]));
    console.log(C.h("\n  ── Sorgu Geçmişi ─────────────────────────────"));
    console.log(t.toString());
    console.log();
}

export function wpTestGoster(ok, bilgi) {
    if (ok) {
        console.log(`  ${C.green("✓")} ${chalk.bold.green("Bağlantı başarılı!")}`);
        if (bilgi.name) console.log(`  Kullanıcı: ${C.accent(bilgi.name)}  ${C.dim(bilgi.email ?? "")}`);
    } else {
        console.log(`  ${C.red("✗")} ${chalk.bold.red("Bağlantı başarısız!")}`);
        console.log(C.dim("  config.js → WP_URL, WP_USER, WP_PASS değerlerini kontrol edin."));
    }
    console.log();
}

export function kategoriGoster(kategoriler) {
    if (!kategoriler.length) { console.log(C.dim("  Kategori alınamadı.")); return; }
    const t = new Table({
        head:      [C.h("ID"), C.h("Kategori Adı"), C.h("Yazı Sayısı")],
        colWidths: [8, 36, 14],
        style:     { head: [], border: ["cyan"] },
    });
    kategoriler.forEach((k) => t.push([C.accent(String(k.id)), k.name, C.dim(String(k.count ?? 0))]));
    console.log(C.h("\n  ── WordPress Kategorileri ────────────────────"));
    console.log(t.toString());
    console.log(C.dim("  config.js → WP_KATEGORI_ID değerini yukarıdan seçin."));
    console.log();
}

export function ayarlarGoster() {
    const gizle = (s, n = 10) => s.includes("BURAYA") ? chalk.red("GİRİLMEMİŞ") : s.slice(0, n) + "...";
    const t = new Table({ style: { head: [] }, colWidths: [24, 36] });
    t.push(
        [C.dim("Google API Key"),   gizle(cfg.GOOGLE_API_KEY)],
        [C.dim("WordPress URL"),    cfg.WP_URL],
        [C.dim("WP Kullanıcı"),     cfg.WP_USER.includes("BURAYA") ? chalk.red("GİRİLMEMİŞ") : cfg.WP_USER],
        [C.dim("WP Şifre"),         cfg.WP_PASS.includes("BURAYA") ? chalk.red("GİRİLMEMİŞ") : "•".repeat(12)],
        [C.dim("WP Post Tipi"),     cfg.WP_POST_TYPE],
        [C.dim("WP Durum"),         cfg.WP_STATUS],
        [C.dim("WP Kategori ID"),   String(cfg.WP_KATEGORI_ID)],
        [C.dim("Maks. Sayfa"),      String(cfg.MAKS_SAYFA)],
        [C.dim("İstek Aralığı"),    `${cfg.ISTEK_ARALIK}ms`],
        [C.dim("Max Deneme"),       String(cfg.MAX_DENEME)],
    );
    console.log(C.h("\n  ── config.js Ayarları ────────────────────────"));
    console.log(t.toString());
    console.log(C.dim("  Değiştirmek için config.js dosyasını bir editörle açın."));
    console.log();
}

export function basariGoster(msg) {
    console.log(`  ${C.green("✓")} ${chalk.bold.green(msg)}`);
    console.log();
}

export function hataGoster(msg) {
    console.log(`  ${C.red("✗")} ${chalk.bold.red(msg)}`);
    console.log();
}

export async function bekleEnter() {
    await input({ message: C.dim("Devam etmek için ENTER'a basın...") });
}
