# OSSIQN — Google İşletme Botu v2 (Node.js)

## ⚡ Hızlı Başlangıç (3 Adım)

### 1. Kütüphaneleri Kur
```bash
npm install
```

### 2. config.js Dosyasını Aç ve Doldur
```js
export const GOOGLE_API_KEY = "AIzaSy...";        // Google Cloud → Places API anahtarınız
export const WP_URL         = "https://DOMAININIZ.COM";
export const WP_USER        = "admin";             // WordPress kullanıcı adınız
export const WP_PASS        = "xxxx xxxx xxxx";    // WordPress → Uygulama Şifresi
```

### 3. Çalıştır
```bash
npm start
```

---

## 🔑 Google Places API Anahtarı

1. [console.cloud.google.com](https://console.cloud.google.com) → Yeni proje oluştur
2. **APIs & Services** → **Enable APIs** → **Places API (New)** aç
3. **Credentials** → **Create Credentials** → **API Key**
4. Anahtarı `config.js` → `GOOGLE_API_KEY` alanına yapıştır

---

## 🔑 WordPress Uygulama Şifresi

1. WordPress Yönetim → **Kullanıcılar** → Profiliniz
2. **Uygulama Şifreleri** bölümüne kaydırın
3. İsim girin → **Yeni Uygulama Şifresi Ekle**
4. Şifreyi `config.js` → `WP_PASS` alanına yapıştırın

---

## 🗂️ Proje Yapısı

```
alobul-bot-js-v2/
├── main.js           → Ana döngü, tüm menü görevleri
├── config.js         → ⚙️ BURAYA API BİLGİLERİNİZİ GİRİN
├── package.json
├── src/
│   ├── index.js      → Barrel export
│   ├── cli.js        → Terminal arayüzü (inquirer + chalk)
│   ├── googleApi.js  → Google Places API istemcisi
│   ├── wordpress.js  → WordPress REST API istemcisi
│   ├── storage.js    → SQLite veritabanı + CSV/JSON export
│   └── utils.js      → Log ve zaman yardımcıları
├── data/
│   └── isletmeler.db → Otomatik oluşur
└── logs/
    └── bot.log       → Otomatik yazılır
```

---

## 📋 Menü Seçenekleri

| Seçenek | Açıklama |
|---------|----------|
| 🔍 Google'dan Çek | Şehir + sektör seç → çek → DB'ye kaydet |
| 📤 WordPress'e Aktar | DB'deki bekleyen kayıtları WP'ye gönder |
| 🔄 Çek + Aktar | İkisini tek seferde yap |
| 📊 İstatistikler | Toplam / eklenen / bekleyen |
| 🏙️ Şehir Bazlı | Her şehirden kaç kayıt var |
| 🏷️ Sektör Bazlı | Her sektörden kaç kayıt var |
| 📋 Sorgu Geçmişi | Hangi sorgular kaç kayıt getirdi |
| 💾 Dışa Aktar | CSV veya JSON |
| 🔌 WP Bağlantı Testi | API bağlantısını doğrula |
| 📂 WP Kategorileri | Kategori listesi + ID bul |
| ⚙️ Ayarlar | config.js içeriğini görüntüle |

---

## 🗺️ Şehir & Sektör Seçim Modları

- **Arayarak tek seç** — yazmaya başla, filtrele
- **Checkbox çoklu seç** — SPACE ile işaretle
- **Tüm Türkiye** — 81 il × seçilen sektörler
- **Manuel gir** — "Konya Meram Kafeler" gibi özel sorgu

---

## 🗄️ WordPress Meta Alanları

```
firma_telefon · firma_adres · firma_web · firma_puan · firma_yorum
firma_enlem · firma_boylam · firma_kategoriler · firma_sehir · firma_sektor · firma_kaynak
```
