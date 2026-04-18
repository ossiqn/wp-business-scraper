import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src import google_isletmeleri_cek, WordPressClient, Storage, CLIMenu
from src import log_yaz, sure_formatla
import src.cli as cli
import config

LOG = os.path.join("logs", "bot.log")


def sorgu_listesi_olustur(sehirler, sektorler):
    return [(f"{s} {k}", s, k) for s in sehirler for k in sektorler]


def veri_cek_gorevi(storage):
    if not cli._api_hazir_mi():
        cli.hata_goster("API bilgileri eksik. Önce config.py dosyasını düzenleyin.")
        return []

    sehirler = cli.sehir_sec()
    if not sehirler:
        cli.hata_goster("Şehir seçilmedi.")
        return []

    sektorler = cli.sektor_sec()
    if not sektorler:
        cli.hata_goster("Sektör seçilmedi.")
        return []

    maks_sayfa = cli.sayfa_sayisi_sec()
    sorgular   = sorgu_listesi_olustur(sehirler, sektorler)

    if not cli.sorgu_onay([s[0] for s in sorgular]):
        return []

    tum_veriler = []
    goruldu     = set()
    baslangic   = time.time()

    with cli.progress_baslat(len(sorgular)) as progress:
        gorev = progress.add_task("Başlatılıyor...", total=len(sorgular))

        for sorgu_str, sehir, sektor in sorgular:
            progress.update(gorev, description=sorgu_str[:39])
            veriler = google_isletmeleri_cek(sorgu_str, sehir=sehir, sektor=sektor, maks_sayfa=maks_sayfa)
            yeni = 0
            for v in veriler:
                anahtar = (v["ad"].lower().strip(), v["adres"].lower().strip())
                if anahtar not in goruldu:
                    goruldu.add(anahtar)
                    tum_veriler.append(v)
                    yeni += 1
            log_yaz(LOG, f"CEKME | {sorgu_str} | {len(veriler)} sonuc | {yeni} yeni")
            progress.advance(gorev)

    sure = sure_formatla(time.time() - baslangic)
    cli.basari_goster(f"Çekme tamamlandı: {len(tum_veriler)} benzersiz kayıt — {sure}")

    if tum_veriler:
        yeni_db = storage.toplu_kaydet(tum_veriler)
        cli.basari_goster(f"Veritabanına eklenen yeni kayıt: {yeni_db}")
        log_yaz(LOG, f"DB | {yeni_db} yeni kayit eklendi")
        cli.sonuc_tablosu_goster(tum_veriler)

    return tum_veriler


def aktar_gorevi(storage, wp_client):
    if not cli._api_hazir_mi():
        cli.hata_goster("API bilgileri eksik. Önce config.py dosyasını düzenleyin.")
        return

    bekleyenler = storage.wp_eklenmemisleri_getir()
    if not bekleyenler:
        cli.hata_goster("WordPress'e aktarılmayı bekleyen kayıt yok.")
        return

    from rich.console import Console
    Console().print(f"  [bold]{len(bekleyenler)}[/bold] kayıt WordPress'e aktarılacak.\n")

    baslangic = time.time()
    sonuclar  = wp_client.toplu_ekle(bekleyenler, storage=storage, ilerleme_cb=cli.aktar_ilerleme)
    sure      = sure_formatla(time.time() - baslangic)

    from rich.console import Console
    c = Console()
    c.print()
    c.print(f"  [bold green]✓ Aktarım tamamlandı — {sure}[/bold green]")
    c.print(f"    Eklenen : [green]{sonuclar['eklenen']}[/green]")
    c.print(f"    Atlanan : [yellow]{sonuclar['atlanan']}[/yellow]")
    c.print(f"    Hatalı  : [red]{sonuclar['hatali']}[/red]")
    c.print()
    log_yaz(LOG, f"WP_AKTAR | eklenen={sonuclar['eklenen']} atlanan={sonuclar['atlanan']} hatali={sonuclar['hatali']}")


def export_gorevi(storage):
    fmt = cli.export_menu()
    if not fmt:
        return
    if fmt == "csv":
        dosya, sayi = storage.csv_export(sadece_bekleyenler=False)
    elif fmt == "csv_bekleyen":
        dosya, sayi = storage.csv_export(sadece_bekleyenler=True)
    else:
        dosya, sayi = storage.json_export()
    if dosya:
        cli.basari_goster(f"{sayi} kayıt → {dosya}")
    else:
        cli.hata_goster("Dışa aktarılacak kayıt bulunamadı.")


def main():
    os.makedirs("logs", exist_ok=True)
    os.makedirs("data",  exist_ok=True)

    storage   = Storage(data_dizini="data")
    wp_client = WordPressClient()

    while True:
        cli.baslik_goster()
        cli.istatistik_goster(storage)

        secim = cli.ana_menu()

        if secim is None or secim == "cikis":
            from rich.console import Console
            Console().print("\n[dim]  Görüşmek üzere. 👋[/dim]\n")
            sys.exit(0)

        elif secim == "cek":
            veri_cek_gorevi(storage)
            cli.bekle_enter()

        elif secim == "aktar":
            aktar_gorevi(storage, wp_client)
            cli.bekle_enter()

        elif secim == "cek_aktar":
            veriler = veri_cek_gorevi(storage)
            if veriler:
                aktar_gorevi(storage, wp_client)
            cli.bekle_enter()

        elif secim == "istatistik":
            cli.istatistik_goster(storage)
            cli.bekle_enter()

        elif secim == "sehir_ist":
            cli.sehir_istatistik_goster(storage.sehir_istatistik())
            cli.bekle_enter()

        elif secim == "sektor_ist":
            cli.sektor_istatistik_goster(storage.sektor_istatistik())
            cli.bekle_enter()

        elif secim == "gecmis":
            cli.gecmis_goster(storage.sorgu_gecmisi())
            cli.bekle_enter()

        elif secim == "export":
            export_gorevi(storage)
            cli.bekle_enter()

        elif secim == "wp_test":
            ok, bilgi = wp_client.baglanti_test()
            cli.wp_test_goster(ok, bilgi)
            cli.bekle_enter()

        elif secim == "kategoriler":
            kategoriler = wp_client.kategori_listesi()
            cli.kategoriler_goster(kategoriler)
            cli.bekle_enter()

        elif secim == "ayarlar":
            cli.ayarlar_goster()
            cli.bekle_enter()


if __name__ == "__main__":
    main()
