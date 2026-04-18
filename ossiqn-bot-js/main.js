import { mkdirSync }             from "fs";
import { join }                  from "path";
import chalk                     from "chalk";
import { googleIsletmeleriCek, WordPressClient, Storage, cli, utils } from "./src/index.js";
import { MAKS_SAYFA }            from "./config.js";

const LOG = join("logs", "bot.log");

function sorguListesiOlustur(sehirler, sektorler) {
    return sehirler.flatMap((s) => sektorler.map((k) => ({ sorgu: `${s} ${k}`, sehir: s, sektor: k })));
}

async function veriCekGorevi(storage) {
    if (!cli.apiHazirMi()) {
        cli.hataGoster("API bilgileri eksik. Önce config.js dosyasını düzenleyin.");
        return [];
    }

    const sehirler = await cli.sehirSec();
    if (!sehirler.length) { cli.hataGoster("Şehir seçilmedi."); return []; }

    const sektorler = await cli.sektorSec();
    if (!sektorler.length) { cli.hataGoster("Sektör seçilmedi."); return []; }

    const maksimumSayfa = await cli.sayfaSayisiSec();
    const liste         = sorguListesiOlustur(sehirler, sektorler);

    const onay = await cli.sorguOnay(liste.map((l) => l.sorgu));
    if (!onay) return [];

    const tumVeriler = [];
    const goruldu    = new Set();
    const baslangic  = Date.now();

    const bar = cli.ilerlemeCubugu(liste.length);
    bar.start(liste.length, 0, { sorgu: "" });

    for (let i = 0; i < liste.length; i++) {
        const { sorgu, sehir, sektor } = liste[i];
        bar.update(i, { sorgu: sorgu.slice(0, 38) });

        const veriler = await googleIsletmeleriCek(sorgu, { sehir, sektor, maksimumSayfa });
        let yeni = 0;
        for (const v of veriler) {
            const k = `${v.ad.toLowerCase().trim()}|||${v.adres.toLowerCase().trim()}`;
            if (!goruldu.has(k)) { goruldu.add(k); tumVeriler.push(v); yeni++; }
        }

        utils.logYaz(LOG, `CEKME | ${sorgu} | ${veriler.length} sonuc | ${yeni} yeni`);
        bar.update(i + 1, { sorgu: sorgu.slice(0, 38) });
    }

    bar.stop();
    console.log();

    const sure = utils.sureFormatla(Date.now() - baslangic);
    cli.basariGoster(`Çekme tamamlandı: ${tumVeriler.length} benzersiz kayıt — ${sure}`);

    if (tumVeriler.length) {
        const yeniDb = storage.topluKaydet(tumVeriler);
        cli.basariGoster(`Veritabanına eklenen yeni kayıt: ${yeniDb}`);
        utils.logYaz(LOG, `DB | ${yeniDb} yeni kayit eklendi`);
        cli.sonucTablosuGoster(tumVeriler);
    }

    return tumVeriler;
}

async function aktarGorevi(storage, wpClient) {
    if (!cli.apiHazirMi()) {
        cli.hataGoster("API bilgileri eksik. Önce config.js dosyasını düzenleyin.");
        return;
    }

    const bekleyenler = storage.wpEklenmemisleriGetir();
    if (!bekleyenler.length) {
        cli.hataGoster("WordPress'e aktarılmayı bekleyen kayıt yok.");
        return;
    }

    console.log(`  ${chalk.bold(bekleyenler.length)} kayıt WordPress'e aktarılacak.\n`);

    const baslangic = Date.now();
    const sonuclar  = await wpClient.topluEkle(bekleyenler, storage, cli.aktarIlerleme);
    const sure      = utils.sureFormatla(Date.now() - baslangic);

    console.log();
    console.log(`  ${chalk.bold.green("✓ Aktarım tamamlandı")} — ${sure}`);
    console.log(`    Eklenen : ${chalk.green(sonuclar.eklenen)}`);
    console.log(`    Atlanan : ${chalk.yellow(sonuclar.atlanan)}`);
    console.log(`    Hatalı  : ${chalk.red(sonuclar.hatali)}`);
    console.log();
    utils.logYaz(LOG, `WP_AKTAR | eklenen=${sonuclar.eklenen} atlanan=${sonuclar.atlanan} hatali=${sonuclar.hatali}`);
}

async function exportGorevi(storage) {
    const fmt = await cli.exportMenu();
    if (!fmt) return;
    let dosya, sayi;
    if      (fmt === "csv")          [dosya, sayi] = storage.csvExport(false);
    else if (fmt === "csv_bekleyen") [dosya, sayi] = storage.csvExport(true);
    else                             [dosya, sayi] = storage.jsonExport();
    if (dosya) cli.basariGoster(`${sayi} kayıt → ${dosya}`);
    else       cli.hataGoster("Dışa aktarılacak kayıt bulunamadı.");
}

async function main() {
    mkdirSync("logs", { recursive: true });
    mkdirSync("data",  { recursive: true });

    const storage  = new Storage("data");
    const wpClient = new WordPressClient();

    while (true) {
        cli.baslikGoster();
        cli.istatistikGoster(storage);

        const secim = await cli.anaMenu();

        if (!secim || secim === "cikis") {
            console.log(chalk.dim("\n  Görüşmek üzere. 👋\n"));
            process.exit(0);
        }

        if      (secim === "cek")         { await veriCekGorevi(storage); }
        else if (secim === "aktar")        { await aktarGorevi(storage, wpClient); }
        else if (secim === "cek_aktar")   { const v = await veriCekGorevi(storage); if (v.length) await aktarGorevi(storage, wpClient); }
        else if (secim === "istatistik")  { cli.istatistikGoster(storage); }
        else if (secim === "sehir_ist")   { cli.sehirIstatistikGoster(storage.sehirIstatistik()); }
        else if (secim === "sektor_ist")  { cli.sektorIstatistikGoster(storage.sektorIstatistik()); }
        else if (secim === "gecmis")      { cli.gecmisGoster(storage.sorguGecmisi()); }
        else if (secim === "export")      { await exportGorevi(storage); }
        else if (secim === "wp_test")     { const [ok, bilgi] = await wpClient.baglantiTest(); cli.wpTestGoster(ok, bilgi); }
        else if (secim === "kategoriler") { cli.kategoriGoster(await wpClient.kategoriListesi()); }
        else if (secim === "ayarlar")     { cli.ayarlarGoster(); }

        await cli.bekleEnter();
    }
}

main().catch((e) => {
    console.error(chalk.bold.red("Kritik hata:"), e.message);
    process.exit(1);
});
