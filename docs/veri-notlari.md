# Faz 0 veri notları — İstanbul

## Eylül 2026

Kullanıcı ili **istanbul** yazdı ve Eylül 2026 için iki metin gönderdi: 30 günlük akşam, sonra kahvaltı.

Kahvaltıda 1–13 Eylül için yemek yok. Kaynak cümlesi: "Bu döneme ait menü henüz KYK tarafından açıklanmamıştır veya nöbetçi yurt uygulaması geçerlidir." Bu günlere yemek yazılmadı. 14–30 Eylül kahvaltısı ve 1–30 Eylül akşamı dolu.

Aynı ilde ikinci bir yurdun menüsü gelmedi. Yurt bazlı fark **bilinmiyor**. Menü il bazında duruyor.

## Belge biçimi

Her gün aynı iskelet:

1. Çorba (tek yemek, ya da `veya` ile iki seçenek) ve bir kcal.
2. Ana yemek satırı: `veya` seçenekleri ayırır, `+` aynı seçeneğin parçasıdır. Satırın tek bir kcal değeri vardır, çoğu zaman `~` ile işaretli.
3. Yan yemek (pilav, makarna, erişte, bazen patates). Bazı günlerde bu satır da `veya` içerir. 27 Eylül'de ayrı yan yemek yok; pilav ana seçeneklerin içinde.
4. Bazı günlerde ek satırlar: tatlı, salata, meyve, içecek, turşu, yoğurt, cacık, çiğ köfte.
5. Her gün `200 ml Bardak Su` (0 kcal) ve `Çeyrek Ekmek` (129 kcal).
6. `Yaklaşık N kalori` toplamı. Kontrol edilen günlerde bu toplam, satır kcal'lerinin toplamına eşit (seçenekler toplanmıyor, satır başına bir değer).
7. Protein, karbonhidrat (`K`) ve yağ gramları var. Puan satırları (`Puan Ver`, `4.0/5`) kullanıcı oyu; menü verisi değil.

## JSON'a nasıl geçti

Dosya: `data/menus/istanbul/2026-09.json`

- `veya` → `secim: "biri"`. `+` bölünmedi. Örnek: "Siyah veya Yeşil Zeytin" → siyah zeytin / yeşil zeytin. "Pişi + Reçel" tek seçenek kaldı.
- Kaynak satırda tek kcal verdiği için bu sayı **o gruptaki her seçeneğe yazıldı**. Bu, her yemeğin ayrı ölçülmüş kalorisi değildir.
- `~` atıldı, sayı aynen duruyor. Kaynak toplamı bu sayıyı kullanıyor.
- `toplamKcal` kaynaktaki "Yaklaşık N kalori" değeridir. Seçenekler toplanarak hesaplanmadı. 24 Eylül kahvaltı toplamı 2077; satırların toplamıyla uyumlu.
- Su ve ekmek `Yanında` / `hepsi`.
- "Al Götür Menü" (692 kcal) ayrı grup. Kaynak toplamı bu satırı da içeriyor. Bunun herkese verilen bir kalem mi, alternatif paket mi olduğu metinde ayrılmıyor.
- 1–13 Eylül kahvaltısı: `durum: "aciklanmadi"`, grup yok. Yemek uydurulmadı.
- Grup başlıkları kaynakta yok; rol için kondu. Kahvaltıda: Yumurta, Sıcak, Hamur işi, Peynir, Zeytin, Yanında, Al götür. Akşamda: Çorba, Ana yemek, Yan yemek, Tatlı, Salata, Meyve, İçecek, Ek, Yanında.
- Protein, karbonhidrat, yağ ve puanlar JSON'a girmedi.
- `publish/` üretilmedi.

## kykyemek.com Ekim 2026 (19 il)

Kullanıcı 14 Ekim 2026'da site sahibinin izin verdiğini bildirdi. Çekici: `npm run cek:kykyemek -- --ay 2026-10`.

Site 19 il veriyor. İstanbul Eylül/Ekim kilitli olduğu için o çekim `data/taslak/istanbul/2026-10.json` altına yazıldı; `data/menus/istanbul/` değişmedi.

Kaynakta kahvaltısı olmayan il (Edirne) ve akşamı olmayan il (Kayseri) `durum: "aciklanmadi"` ile duruyor; yemek uydurulmadı. 80 karakteri aşan yemek adlarında yalnızca parantez içi not düşürüldü.

## yurtmenu.net Eylül 2026 (80 il)

Kullanıcı 14 Ekim 2026'da yurtmenu.net, kykmenum.com, kykyemekmenu.com ve foursoftware.com.tr sahiplerinin de izin verdiğini bildirdi. Çekim yalnızca yurtmenu.net'in herkese açık `/{il}?date=` sayfalarından yapıldı (`/api/` yok).

Eylül'de kaynak 14–30 arası 17 gün veriyor; 1–13 yazılmadı. Ekim 2026 bu sitede yalnızca 12 ilde var ve onların hepsi zaten kykyemek.com'dan dolu. kykmenum.com şehir sayfaları boş, kykyemekmenu.com tipik hafta metni (günlük menü değil), foursoftware.com.tr menü sitesi değil. Ekim'de hâlâ 62 il boş; uydurulmadı.

## Doğrulama

`node --experimental-strip-types scripts/validate.ts` → geçti. Eylül ve Ekim dosyaları, 0 uyarı.

## Ekim 2026

Ham kayıt: `data/raw/istanbul/2026-10/kaynak.json`. Menü: `data/menus/istanbul/2026-10.json`. Kaynak kullanıcıya göre `https://kykyemek.com/`.

31 günün kahvaltısı var. Akşam yalnızca 1 Ekim'de var. 2–31 Ekim akşamı kaynakta `null`; bu günlere yemek yazılmadı, `durum: "aciklanmadi"`.

Bu kaynakta kalori yok. `kcal` ve `toplamKcal` uydurulmadı; toplam `null`.

`/` Eylül'deki `veya` gibi seçenek ayırır. Soldaki parça tek kelimeyse sağdaki yemek adı ona eklenir: "Peynirli/Ispanaklı Börek" → peynirli börek / ıspanaklı börek. `+` aynı tabağın içinde kalır: "Pankek+Bal+Tereyağ" → pankek + bal + tereyağ. Su bu ay "500 ml su".

1 Ekim akşamı: ezogelin veya yayla çorbası, tavuk pirzola + patates kızartma veya zeytinyağlı taze fasulye, soslu makarna, çoban salata.

## Şemada yapılan küçük ek

Öğüne isteğe bağlı `durum: "var" | "aciklanmadi"` eklendi. `aciklanmadi` ise gruplar boş olmak zorunda. Yemek `kcal` sınırı 0–2000 duruyor. Öğün toplamı bu sınırın üstünde olabiliyor; 4000 üstü hata.

Protein / karbonhidrat / yağ hâlâ şemada yok. Satır kalorisi hâlâ seçeneklere kopyalanıyor. İkisi de istenirse sonra değişir.
