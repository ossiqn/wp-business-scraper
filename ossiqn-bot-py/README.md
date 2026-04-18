# OSSIQN — Google İşletme Botu v2 (Python)

## ⚡ Hızlı Başlangıç (3 Adım)

### 1. Kütüphaneleri Kur
```bash
pip install -r requirements.txt
```

### 2. config.py Dosyasını Aç ve Doldur
```python
GOOGLE_API_KEY = "AIzaSy..."          # Google Cloud → Places API anahtarınız
WP_URL         = "https://kendidomaininiz.com" # Sitenizin adresi
WP_USER        = "admin"              # WordPress kullanıcı adınız
WP_PASS        = "xxxx xxxx xxxx"     # WordPress → Uygulama Şifresi
```

### 3. Çalıştır
```bash
python main.py
```

---

## 🔑 Google Places API Anahtarı Nasıl Alınır?

1. [console.cloud.google.com](https://console.cloud.google.com) → Yeni proje oluştur
2. **APIs & Services** → **Enable APIs** → **Places API (New)** aç
3. **Credentials** → **Create Credentials** → **API Key**
4. Oluşan anahtarı `config.py` → `GOOGLE_API_KEY` alanına yapıştır

---

## 🔑 WordPress Uygulama Şifresi Nasıl Alınır?

1. WordPress Yönetim → **Kullanıcılar** → Profiliniz
2. Sayfayı aşağı kaydırın → **Uygulama Şifreleri**
3. İsim girin (örn: "IPTV Bot") → **Yeni Uygulama Şifresi Ekle**
4. Üretilen şifreyi `config.py` → `WP_PASS` alanına yapıştırın
5. WordPress REST API'nin açık olduğundan emin olun (varsayılan olarak açıktır)

---

## 🗂️ Proje Yapısı

```
alobul-bot-v2/
├── main.py           → Ana döngü, tüm menü görevleri
├── config.py         → ⚙️ BURAYA API BİLGİLERİNİZİ GİRİN
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── cli.py        → Terminal arayüzü (rich + questionary)
│   ├── google_api.py → Google Places API istemcisi
│   ├── wordpress.py  → WordPress REST API istemcisi
│   ├── storage.py    → SQLite veritabanı + CSV/JSON dışa aktarım
│   └── utils.py      → Log ve zaman yardımcıları
├── data/
│   └── isletmeler.db → Otomatik oluşur, tüm veriler burada
└── logs/
    └── bot.log       → İşlem logları otomatik yazılır
```

---

## 📋 Menü Seçenekleri

| Seçenek | Açıklama |
|---------|----------|
| 🔍 Google'dan Çek | Şehir + sektör seç → Google'dan veri çek → DB'ye kaydet |
| 📤 WordPress'e Aktar | DB'deki bekleyen kayıtları WP'ye gönder |
| 🔄 Çek + Aktar | İkisini tek seferde yap |
| 📊 İstatistikler | Toplam / eklenen / bekleyen sayısı |
| 🏙️ Şehir Bazlı İstatistik | Her şehirden kaç kayıt var |
| 🏷️ Sektör Bazlı İstatistik | Her sektörden kaç kayıt var |
| 📋 Sorgu Geçmişi | Hangi sorgular kaç kayıt getirdi |
| 💾 Dışa Aktar | CSV veya JSON olarak kaydet |
| 🔌 WP Bağlantı Testi | API bağlantısını ve kimlik doğrulamayı test et |
| 📂 WP Kategorileri | Mevcut kategorileri listele (ID'yi bul) |
| ⚙️ Ayarlar | config.py içeriğini görüntüle |

---

## 🗺️ Şehir & Sektör Seçim Modları

Her çekme işleminde şehir ve sektör için 4 mod sunulur:

- **Arayarak tek seç** — yazmaya başla, otomatik tamamla
- **Checkbox çoklu seç** — SPACE ile işaretle, ENTER ile onayla
- **Tüm Türkiye** — 81 il × seçilen sektörler
- **Manuel gir** — "Konya Meram Kafeler" gibi özel sorgular

---

## 🗄️ WordPress Meta Alanları

Her kayıtla birlikte yazılan meta alanlar (ACF / directory plugin uyumlu):

```
firma_telefon · firma_adres · firma_web · firma_puan · firma_yorum
firma_enlem · firma_boylam · firma_kategoriler · firma_sehir · firma_sektor · firma_kaynak
```

---

## 💡 İpuçları

- **WP_KATEGORI_ID** için önce **📂 WordPress Kategorileri** menüsünü kullan, doğru ID'yi bul ve `config.py`'ye yaz.
- **Maks. Sayfa = 5** → sorgu başına ~100 sonuç demektir. Küçük şehirler için 2-3 yeterlidir.
- Tüm çekilen veri `data/isletmeler.db` SQLite dosyasında kalır. İstediğin zaman **💾 Dışa Aktar** ile CSV/JSON alabilirsin.
- Bot her çalıştırmada duplicate kontrolü yapar, aynı firma iki kez eklenmez.
