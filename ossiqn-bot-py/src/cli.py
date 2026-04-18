import sys
import questionary
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn, MofNCompleteColumn
from rich.prompt import Confirm
from rich.columns import Columns
from rich import box
import config

console = Console()

_STIL = questionary.Style([
    ("qmark",       "fg:#00e5c8 bold"),
    ("question",    "bold"),
    ("answer",      "fg:#00e5c8 bold"),
    ("pointer",     "fg:#00e5c8 bold"),
    ("highlighted", "fg:#00e5c8 bold"),
    ("selected",    "fg:#ffffff bg:#1a6b5e"),
    ("separator",   "fg:#444444"),
    ("instruction", "fg:#555555"),
])

def baslik_goster():
    console.clear()
    console.print()
    console.print(Panel.fit(
        Text.from_markup(
            "[bold cyan]  ╔═════════════════════════════════════════════╗\n"
            "  ║   🗺️  ALOBUL.COM — Google İşletme Botu v2   ║\n"
            "  ╚═════════════════════════════════════════════╝[/bold cyan]\n"
            "[dim]       Google Places API  →  WordPress Rehberi[/dim]"
        ),
        border_style="cyan",
        padding=(0, 2),
    ))
    console.print()

def istatistik_goster(storage):
    ist = storage.istatistik()
    t = Table(box=box.SIMPLE_HEAVY, show_header=False, padding=(0, 2))
    t.add_column(style="dim", min_width=24)
    t.add_column(justify="right", min_width=8)
    t.add_row("📦 Veritabanı Toplam",   f"[bold cyan]{ist['toplam']}[/bold cyan]")
    t.add_row("✅ WordPress'e Eklenen", f"[green]{ist['eklenmis']}[/green]")
    t.add_row("⏳ Bekleyen",            f"[yellow]{ist['bekleyen']}[/yellow]")
    console.print(Panel(t, title="[bold]Durum[/bold]", border_style="cyan", padding=(0, 1)))
    console.print()

def _api_hazir_mi():
    uyarilar = []
    if "BURAYA" in config.GOOGLE_API_KEY:
        uyarilar.append("[red]⚠  GOOGLE_API_KEY[/red] config.py dosyasında henüz girilmemiş!")
    if "BURAYA" in config.WP_USER:
        uyarilar.append("[red]⚠  WP_USER[/red] config.py dosyasında henüz girilmemiş!")
    if "BURAYA" in config.WP_PASS:
        uyarilar.append("[red]⚠  WP_PASS[/red] config.py dosyasında henüz girilmemiş!")
    for u in uyarilar:
        console.print(f"  {u}")
    if uyarilar:
        console.print()
    return len(uyarilar) == 0

def ana_menu():
    return questionary.select(
        "Ne yapmak istiyorsunuz?",
        choices=[
            questionary.Choice("🔍  Google'dan Yeni İşletme Çek",        value="cek"),
            questionary.Choice("📤  Bekleyenleri WordPress'e Aktar",      value="aktar"),
            questionary.Choice("🔄  Çek + Aktar (Tek Seferde)",           value="cek_aktar"),
            questionary.Choice("📊  Veritabanı İstatistikleri",           value="istatistik"),
            questionary.Choice("🏙️   Şehir Bazlı İstatistik",             value="sehir_ist"),
            questionary.Choice("🏷️   Sektör Bazlı İstatistik",            value="sektor_ist"),
            questionary.Choice("📋  Sorgu Geçmişi",                       value="gecmis"),
            questionary.Choice("💾  Dışa Aktar (CSV / JSON)",             value="export"),
            questionary.Choice("🔌  WordPress Bağlantı Testi",            value="wp_test"),
            questionary.Choice("📂  WordPress Kategorileri",              value="kategoriler"),
            questionary.Choice("⚙️   Ayarları Görüntüle",                 value="ayarlar"),
            questionary.Choice("❌  Çıkış",                               value="cikis"),
        ],
        style=_STIL,
    ).ask()

def sehir_sec():
    mod = questionary.select(
        "Şehir seçim modu:",
        choices=[
            questionary.Choice("🔎  Arayarak tek şehir seç",             value="ara"),
            questionary.Choice("☑️   Birden fazla şehir seç (checkbox)",  value="coklu"),
            questionary.Choice("🇹🇷  Tüm Türkiye (81 il)",               value="hepsi"),
            questionary.Choice("✏️   Manuel gir (özel sorgu)",            value="manuel"),
        ],
        style=_STIL,
    ).ask()
    if mod is None:
        return []
    if mod == "hepsi":
        return list(config.SEHIRLER)
    if mod == "manuel":
        s = questionary.text("Özel sorgu yazın (örn: Konya Meram):", style=_STIL).ask()
        return [s.strip()] if s and s.strip() else []
    if mod == "ara":
        sehir = questionary.autocomplete(
            "Şehir adını yazmaya başlayın:",
            choices=list(config.SEHIRLER),
            style=_STIL,
            validate=lambda v: v in config.SEHIRLER or "Listeden bir şehir seçin",
        ).ask()
        return [sehir] if sehir else []
    secilen = questionary.checkbox(
        "Şehirleri işaretleyin (SPACE → seç, ENTER → onayla):",
        choices=list(config.SEHIRLER),
        style=_STIL,
    ).ask()
    return secilen or []

def sektor_sec():
    mod = questionary.select(
        "Sektör seçim modu:",
        choices=[
            questionary.Choice("🔎  Arayarak tek sektör seç",             value="ara"),
            questionary.Choice("☑️   Birden fazla sektör seç (checkbox)",  value="coklu"),
            questionary.Choice("🌐  Tüm sektörler",                       value="hepsi"),
            questionary.Choice("✏️   Manuel gir",                          value="manuel"),
        ],
        style=_STIL,
    ).ask()
    if mod is None:
        return []
    if mod == "hepsi":
        return list(config.SEKTORLER)
    if mod == "manuel":
        s = questionary.text("Sektör adını yazın (örn: Pizzacılar):", style=_STIL).ask()
        return [s.strip()] if s and s.strip() else []
    if mod == "ara":
        sektor = questionary.autocomplete(
            "Sektör adını yazmaya başlayın:",
            choices=list(config.SEKTORLER),
            style=_STIL,
        ).ask()
        return [sektor] if sektor else []
    secilen = questionary.checkbox(
        "Sektörleri işaretleyin:",
        choices=list(config.SEKTORLER),
        style=_STIL,
    ).ask()
    return secilen or []

def sayfa_sayisi_sec():
    v = questionary.text(
        "Sorgu başına maksimum sayfa (1-10, varsayılan 5):",
        default="5",
        style=_STIL,
        validate=lambda x: (x.isdigit() and 1 <= int(x) <= 10) or "1-10 arası sayı girin",
    ).ask()
    return int(v) if v else 5

def sorgu_onay(sorgular):
    console.print()
    console.print(f"[bold cyan]  {len(sorgular)} sorgu oluşturuldu:[/bold cyan]")
    t = Table(box=box.SIMPLE, show_header=False, padding=(0, 1))
    t.add_column(style="dim", width=5)
    t.add_column()
    for i, s in enumerate(sorgular[:25], 1):
        t.add_row(str(i), s)
    if len(sorgular) > 25:
        t.add_row("...", f"[dim]+{len(sorgular)-25} sorgu daha[/dim]")
    console.print(t)
    console.print()
    return Confirm.ask(f"[bold]{len(sorgular)} sorgu çalıştırılsın mı?[/bold]", default=True)

def progress_baslat(toplam):
    return Progress(
        SpinnerColumn(style="cyan"),
        TextColumn("[bold cyan]{task.description:<40}"),
        BarColumn(bar_width=26, style="cyan", complete_style="green"),
        MofNCompleteColumn(),
        TimeElapsedColumn(),
        console=console,
        transient=False,
    )

def sonuc_tablosu_goster(sonuclar):
    console.print()
    t = Table(
        title=f"[bold]Çekilen Veriler (İlk 15 / Toplam {len(sonuclar)})[/bold]",
        box=box.ROUNDED, border_style="cyan", show_lines=True,
    )
    t.add_column("Firma Adı",   style="bold",        max_width=26)
    t.add_column("Telefon",     style="cyan",         max_width=16)
    t.add_column("Puan",        justify="center",     max_width=6)
    t.add_column("Şehir",       style="green",        max_width=14)
    t.add_column("Sektör",      style="yellow",       max_width=18)
    for r in sonuclar[:15]:
        t.add_row(
            (r.get("ad") or "")[:25],
            r.get("telefon") or "[dim]—[/dim]",
            r.get("puan")    or "[dim]—[/dim]",
            r.get("sehir")   or "[dim]—[/dim]",
            r.get("sektor")  or "[dim]—[/dim]",
        )
    console.print(t)
    if len(sonuclar) > 15:
        console.print(f"[dim]  ... ve {len(sonuclar)-15} kayıt daha[/dim]")
    console.print()

def aktar_ilerleme(durum, baslik, detay):
    ad = (baslik or "")[:58].ljust(58)
    if durum == "eklendi":
        console.print(f"  [green]✓[/green] [dim]{ad}[/dim]  [cyan]#{detay}[/cyan]")
    elif durum == "mevcut":
        console.print(f"  [yellow]~[/yellow] [dim]{ad}[/dim]  [dim]mevcut[/dim]")
    else:
        console.print(f"  [red]✗[/red] [dim]{ad}[/dim]  [red]hata {detay}[/red]")

def export_menu():
    return questionary.select(
        "Format seçin:",
        choices=[
            questionary.Choice("📄 CSV — Tüm kayıtlar (Excel uyumlu)",  value="csv"),
            questionary.Choice("📄 CSV — Sadece bekleyenler",            value="csv_bekleyen"),
            questionary.Choice("📋 JSON — Tüm kayıtlar",                value="json"),
        ],
        style=_STIL,
    ).ask()

def sehir_istatistik_goster(satirlar):
    t = Table(title="[bold]Şehir Bazlı Dağılım[/bold]", box=box.ROUNDED, border_style="cyan")
    t.add_column("Şehir",            style="bold")
    t.add_column("Toplam Kayıt",     justify="right", style="cyan")
    t.add_column("WP'ye Eklenen",    justify="right", style="green")
    t.add_column("Bekleyen",         justify="right", style="yellow")
    for sehir, toplam, eklenmis in satirlar[:30]:
        eklenmis = eklenmis or 0
        t.add_row(sehir or "—", str(toplam), str(eklenmis), str(toplam - eklenmis))
    console.print(t)
    console.print()

def sektor_istatistik_goster(satirlar):
    t = Table(title="[bold]Sektör Bazlı Dağılım[/bold]", box=box.ROUNDED, border_style="cyan")
    t.add_column("Sektör",       style="bold")
    t.add_column("Kayıt Sayısı", justify="right", style="cyan")
    for sektor, toplam in satirlar[:30]:
        t.add_row(sektor or "—", str(toplam))
    console.print(t)
    console.print()

def gecmis_goster(satirlar):
    if not satirlar:
        console.print("[dim]  Henüz sorgu geçmişi yok.[/dim]")
        return
    t = Table(title="[bold]Sorgu Geçmişi[/bold]", box=box.ROUNDED, border_style="cyan")
    t.add_column("Sorgu",        style="bold", min_width=35)
    t.add_column("Kayıt Sayısı", justify="right", style="cyan")
    for sorgu, sayi in satirlar:
        t.add_row(sorgu, str(sayi))
    console.print(t)
    console.print()

def wp_test_goster(ok, bilgi):
    if ok:
        console.print(f"  [bold green]✓ Bağlantı başarılı![/bold green]")
        ad = bilgi.get("name", "")
        ep = bilgi.get("email", "")
        if ad:
            console.print(f"  Kullanıcı: [cyan]{ad}[/cyan]  {ep}")
    else:
        console.print("  [bold red]✗ Bağlantı başarısız![/bold red]")
        console.print("  [dim]config.py → WP_URL, WP_USER, WP_PASS değerlerini kontrol edin.[/dim]")
    console.print()

def kategoriler_goster(kategoriler):
    if not kategoriler:
        console.print("[dim]  Kategori alınamadı.[/dim]")
        return
    t = Table(title="[bold]WordPress Kategorileri[/bold]", box=box.ROUNDED, border_style="cyan")
    t.add_column("ID",    justify="right", style="cyan", width=6)
    t.add_column("Kategori Adı", style="bold")
    t.add_column("Yazı Sayısı",  justify="right", style="dim")
    for k in kategoriler:
        t.add_row(str(k.get("id","")), k.get("name",""), str(k.get("count",0)))
    console.print(t)
    console.print(f"[dim]  config.py → WP_KATEGORI_ID değerini yukarıdaki listeden seçin.[/dim]")
    console.print()

def ayarlar_goster():
    t = Table(box=box.SIMPLE_HEAVY, show_header=False, padding=(0, 2))
    t.add_column(style="dim", min_width=22)
    t.add_column(style="bold")

    def gizle(s, n=10):
        if "BURAYA" in s:
            return "[red]GİRİLMEMİŞ[/red]"
        return s[:n] + "..." if len(s) > n else s

    t.add_row("Google API Key",    gizle(config.GOOGLE_API_KEY))
    t.add_row("WordPress URL",     config.WP_URL)
    t.add_row("WP Kullanıcı",      config.WP_USER if "BURAYA" not in config.WP_USER else "[red]GİRİLMEMİŞ[/red]")
    t.add_row("WP Şifre",          "[red]GİRİLMEMİŞ[/red]" if "BURAYA" in config.WP_PASS else "•" * 12)
    t.add_row("WP Post Tipi",      config.WP_POST_TYPE)
    t.add_row("WP Durum",          config.WP_STATUS)
    t.add_row("WP Kategori ID",    str(config.WP_KATEGORI_ID))
    t.add_row("Maks. Sayfa",       str(config.MAKS_SAYFA))
    t.add_row("İstek Aralığı",     f"{config.ISTEK_ARALIK}s")
    t.add_row("Max Deneme",        str(config.MAX_DENEME))
    console.print(Panel(t, title="[bold]config.py Ayarları[/bold]", border_style="cyan", padding=(0,1)))
    console.print("[dim]  Değiştirmek için config.py dosyasını bir metin editörüyle açın.[/dim]")
    console.print()

def bekle_enter():
    console.print("[dim]  Devam etmek için ENTER'a basın...[/dim]")
    input()

def hata_goster(mesaj):
    console.print(f"  [bold red]✗ {mesaj}[/bold red]")
    console.print()

def basari_goster(mesaj):
    console.print(f"  [bold green]✓ {mesaj}[/bold green]")
    console.print()
