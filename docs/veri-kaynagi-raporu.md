# Veri kaynağı raporu (Faz 0)

Tarih: 14 Ekim 2026. Yoklama: `node scripts/kaynak-yokla.mjs` ve elle `curl` istekleri (UA `kyk-menu-arastirma/0.1`, istekler arası ≥1,5 sn). Ham çıktılar `data/raw/faz0/` altına iner; üçüncü tarafların sayfaları telif nedeniyle repoya alınmaz (`.gitignore`).

Etiketler: **Erişildi** = sayfa bu oturumda indirildi ve okundu. **Erişilemedi** = istek başarısız oldu. **Varsayım** = doğrudan görülmedi, çıkarım.

## Sonuç

**Kullanılabilir otomatik kaynak yok.** Resmî veri öğrenci girişi istiyor. Üçüncü taraf siteler derlenmiş veritabanı; ya koşulları toplu kopyalamayı yasaklıyor ya da veriyi robots.txt'nin kapattığı `/api/` yolundan yüklüyor. Lisanslı açık veri seti bulunamadı. Faz 0 kabul ölçütü (≥10 il × 7 gün gerçek veri, CLI ile tekrarlanabilir) bu nedenle **karşılanmadı**; plan gereği durulup kullanıcıya soruldu.

## Kaynaklar

| # | Kaynak | Durum | Biçim | İl kapsamı | Yurt kırılımı | robots | Koşullar | origin_group |
|---|---|---|---|---|---|---|---|---|
| 1 | biz.gsb.gov.tr/page/yurt/yurtYemekTakip/ | Erişildi | Next.js SPA; veri `gsbbizApi /KYK/GetirOgrencininYemekListesi` | Öğrencinin kendi yurdu | Var (öğrenci bazlı) | 404 (dosya yok) | Giriş gerekli | resmî |
| 2 | kygm.gsb.gov.tr beslenme sayfası | Erişildi (robots: Erişilemedi, zaman aşımı) | HTML | — | — | bilinmiyor | — | resmî |
| 3 | gsb.gov.tr | Erişildi | `/Featured/Burs` yönlendirmesi | menü yok | — | — | — | resmî |
| 4 | yurtyemek.gsb.gov.tr | Erişilemedi (ENOTFOUND) | — | — | — | — | — | — |
| 5 | yurtmenu.net | Erişildi | Sunucu tarafında üretilmiş HTML, il sayfası `/{il}` | 81 il listeli; veri ay ve ile göre değişiyor | Yok (il + ay) | `/api/` kapalı | **Otomatik istek ve toplu kopyalama yasak** | A |
| 6 | resimlikykyemek.com (kykmenulistesi.com.tr buraya yönleniyor) | Erişildi | HTML + Supabase | Seçicide İstanbul, Ordu | Yok | `/admin`, `/auth`, `/notifications` kapalı | Hesap koşulları; toplu kullanım izni yok | A |
| 7 | kykyemek.com | Erişildi | HTML, `data-foods` öznitelikleri | 19 il (ana sayfa seçicisi) | `/Dormitory/List` sayfası var, menü il bazlı | `Disallow:` boş | Koşul metni yok; Google ile giriş, AdSense | A (kahvaltı eşleşiyor) |
| 8 | kykyemekliste.com | Erişildi | HTML iskelet, menü istemci tarafında yükleniyor | Sitemap'te 54 il × 2 öğün; "81 il" iddiası | Yok | `/api/`, `/admin` kapalı | "Kamuya açık kaynaklardan derlenir" | bilinmiyor (menü HTML'de yok) |
| 9 | github.com/alidnmz05/yurtmenu-public | Erişildi (GitHub API) | Next.js ön yüz kodu | — | — | — | **Lisans yok**, repoda veri dosyası yok | A ile aynı geliştirici (Varsayım) |
| 10 | github.com/bulutsoft-dev/Yurtta-Ye-Mobile | Erişildi (GitHub API) | Flutter istemcisi, kendi API'si (yurttaye.onrender.com) | — | — | — | **Lisans yok**, repoda veri yok | bilinmiyor |
| 11 | Play: com.yurt.yemek, com.ikarus.kykmenusu; App Store id6743946195 | Erişildi | Mağaza sayfası | — | — | — | — | rakip ürün |

Güncelleme sıklığı:
- yurtmenu.net'in kendi beyanına göre veri dosyası 6 Ekim 2026'da değişmiş ve sitemap'teki `lastmod` da aynı tarihi gösteriyor.
- kykyemekliste.com'un sitemap'i her gün yeniden üretiliyor (`lastmod` 14 Ekim). Bu, verinin her gün değiştiğini göstermez.

Hız sınırı: Hiçbir sitede yayınlanmış bir hız sınırı bulunamadı. yurtmenu.net'in koşulları "otomatik, aşırı istekleri" kötüye kullanım sayıyor.

## Resmî kaynak neden kullanılamaz

Sayfanın kendi JS dosyası (`yurtYemekTakip-*.js`) sorguyu yalnızca `localStorage.token` doluysa gönderiyor. Uç noktanın adı da "öğrencinin yemek listesini getir". Yani veri, giriş yapmış bir öğrenciye kendi yurdu için veriliyor. Plan kuralı 7 gereği bu uç nokta **çağrılmadı**; bir jetonla çağırmak hem kimlik doğrulamalı uç nokta kullanmak hem de başkasının hesabını otomasyona bağlamak olurdu.

## İl mi, yurt mu?

- **Erişildi:** 14 Ekim 2026 kahvaltısı İstanbul ile Ankara'da aynı, akşam yemekleri farklı. Menü en az il düzeyinde değişiyor.
- **Erişildi:** Elle girilmiş `data/menus/istanbul/2026-10.json` ile yurtmenu.net ve resimlikykyemek.com'un 14 Ekim İstanbul menüsü birebir aynı. Hepsinin aynı il duyurusunu esas aldığı anlaşılıyor.
- **Varsayım:** Resmî uç noktanın öğrenci bazlı olması ve basında çıkan haberler, aynı il içinde yurt bazında farklılık olabileceğini düşündürüyor. Doğrulanamadı.
- **Karar:** Mevcut il bazlı model korunur. Faz 1 şemasında yurt bazında isteğe bağlı bir geçersiz kılma alanı (`yurt_id` boş = ilin tamamı) bırakılır, böylece göç gerekmez.

## Hukuki not

robots.txt'nin bir sayfaya izin vermesi, içeriğin yeniden yayımlanabileceği anlamına gelmez. Rakiplerin derlediği menü veritabanını otomatik çekmek, FSEK kapsamındaki veritabanı hakları ve haksız rekabet riski taşır. yurtmenu.net bunu koşullarında açıkça yasaklıyor. Bu yüzden hiçbir üçüncü taraf sitesi için çekici yazılmadı.

## Uygulanabilir yollar

1. **Elle giriş ve topluluk katkısı (önerilen):** Mevcut boru hattı aynen kalır. Öğrenciler yurt panosundaki resmî aylık listenin fotoğrafını gönderir; bir yönetici bunu doğrulayıp girer. Faz 2'de inceleme kuyruğu ve fotoğraftan taslak çıkarma (OCR) bu işi kısaltır. Ayda il başına yaklaşık 15–30 dakika sürer.
2. **Yazılı izin veya lisans:** yurtmenu.net (iletisim@yurtmenu.net) ya da resimlikykyemek.com ile veri paylaşımı anlaşması yapılabilir. Hızlıdır ama bağımlılık yaratır, karşılığında para veya atıf istenebilir.
3. **Resmî kurum başvurusu:** GSB / KYGM'ye CİMER ya da bilgi edinme yoluyla menülerin açık veri olarak yayımlanması istenebilir. Ücretsiz ve meşrudur ama yavaştır, sonuç belirsizdir.
