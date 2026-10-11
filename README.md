# KYK yurt menüsü

Öğrenci uygulamayı açar, kayıt olmadan o günün yurt kahvaltısını ve akşam yemeğini görür. İlk açılışta bir kez il seçilir, sonraki açılışlarda menü doğrudan gelir.

Marka adı henüz seçilmedi. `app.json` içindeki "Yurt Menü" geçici bir başlıktır. Bu uygulama Gençlik ve Spor Bakanlığı veya KYK'nın resmî uygulaması değildir.

## Durum

Çalışan: veri şeması ve doğrulama, statik yayın çıktısı, il seçimi, günün menüsü, hafta görünümü, tema, çevrimdışı kopya, yerel hatırlatma ve paylaşım görseli.

Bekleyen: yayın adresi (hosting), geri bildirim formu adresleri, marka adı, mağaza hazırlığı. Uygulama hiçbirini uydurmaz; tanımlı değilse ilgili yüzey çizilmez.

## Komutlar

| Komut | İş |
| --- | --- |
| `npm start` | Expo geliştirme sunucusu |
| `npm run validate` | Menü dosyalarını şemaya göre doğrular |
| `npm run build:data` | `publish/v1` statik çıktısını üretir |
| `npm test` | Tarih, önbellek ve bildirim mantığı testleri |
| `npm run typecheck` | Uygulama ve betikler için TypeScript kontrolü |

## Veri

Tek doğruluk kaynağı `data/menus/{il}/{YYYY-MM}.json`. Menüler elle girilir; resmî açık bir KYK servisi yok.

Kaynakta olmayan öğün `durum: "aciklanmadi"` kalır, yemek ve kalori uydurulmaz. Ayrıntılar için `docs/veri-sozlesmesi.md` ve `docs/aylik-menu-giris.md`.

## Belgeler

- `docs/kapsam.md` — v1'e giren ve girmeyen işler
- `docs/veri-sozlesmesi.md` — şema sözleşmesi
- `docs/aylik-menu-giris.md` — aylık veri girişi rutini
- `docs/veri-notlari.md` — İstanbul verisinde yapılan kararlar
- `docs/bildirim-notlari.md` — hatırlatma davranışı ve sınırları
- `docs/paylasim-notlari.md` — paylaşım görseli ve geri bildirim bağlantıları
- `docs/tasarim-karsilastirma.md` — tasarım ve kontrast kararları
