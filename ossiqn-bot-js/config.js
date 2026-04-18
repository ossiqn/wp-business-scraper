export const GOOGLE_API_KEY  = process.env.GOOGLE_API_KEY  ?? "BURAYA_GOOGLE_API_KEYINIZI_YAZIN";
export const WP_URL          = process.env.WP_URL          ?? "https://domainadiniz.com";
export const WP_USER         = process.env.WP_USER         ?? "BURAYA_WP_KULLANICI_ADINIZI_YAZIN";
export const WP_PASS         = process.env.WP_PASS         ?? "BURAYA_WP_UYGULAMA_SIFRENIZI_YAZIN";

export const WP_POST_TYPE    = "posts";
export const WP_STATUS       = "publish";
export const WP_KATEGORI_ID  = 1;
export const MAKS_SAYFA      = 5;
export const ISTEK_ARALIK    = 2000;
export const MAX_DENEME      = 3;

export const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
export const FIELD_MASK = [
    "places.displayName", "places.formattedAddress", "places.nationalPhoneNumber",
    "places.websiteUri",  "places.rating",           "places.userRatingCount",
    "places.location",    "places.types",             "places.businessStatus",
    "nextPageToken"
].join(",");

export const SEHIRLER = [
    "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya",
    "Ankara","Antalya","Artvin","Aydın","Balıkesir",
    "Bilecik","Bingöl","Bitlis","Bolu","Burdur",
    "Bursa","Çanakkale","Çankırı","Çorum","Denizli",
    "Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum",
    "Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari",
    "Hatay","Isparta","İçel","İstanbul","İzmir",
    "Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir",
    "Kocaeli","Konya","Kütahya","Malatya","Manisa",
    "Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir",
    "Niğde","Ordu","Rize","Sakarya","Samsun",
    "Siirt","Sinop","Sivas","Tekirdağ","Tokat",
    "Trabzon","Tunceli","Şanlıurfa","Uşak","Van",
    "Yozgat","Zonguldak","Aksaray","Bayburt","Karaman",
    "Kırıkkale","Batman","Şırnak","Bartın","Ardahan",
    "Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce",
];

export const SEKTORLER = [
    "Kafeler","Restoranlar","Oteller","Güzellik Salonları",
    "Kuaförler","Berberler","Oto Servis","Oto Yıkama",
    "Eczaneler","Hastaneler","Diş Klinikleri","Veteriner",
    "Avukatlar","Muhasebeciler","Noterler","Sigorta",
    "Çiçekçiler","Fırınlar","Pastaneler","Kasaplar",
    "Marketler","Elektronik Mağazaları","Giyim Mağazaları",
    "Spor Salonları","Yüzme Havuzları","Çocuk Oyun Alanları",
    "Düğün Salonları","Catering","Kuyumcular","Optikler",
    "Bankalar","PTT Şubeleri","Kargo Şirketleri",
    "İnşaat Firmaları","Tadilat Firmaları","Temizlik Şirketleri",
    "Okul","Dersane","Kreş","Yurt","Öğrenci Evi",
];
