# Rakip analizi (Faz 0)

Tarih: 14 Ekim 2026. Tüm satırlar **Erişildi**; "Varsayım" yazanlar hariç. Tasarım karşılaştırması `docs/tasarim-karsilastirma.md` içinde.

| Ürün | Tür | Kapsam | Sosyal katman | Gelir | Zayıf yan |
|---|---|---|---|---|---|
| kykyemek.com | Web | 19 il | Beğeni / beğenmeme / yorum, sohbet, Google girişi | AdSense | Çerez duvarı, menü dışı içerik (GPA, VKİ hesaplayıcı) dikkati dağıtıyor |
| kykyemekliste.com | Web | 54 il (sitemap), "81 il" iddiası | Yok | AdSense; sayfada onlarca "Reklam" yuvası | Reklam yoğunluğu, menü istemci tarafında geç geliyor |
| yurtmenu.net | Web, PWA manifest | 81 il listeli, kapsamı şeffaf (veri detayları tablosu) | Yok | AdSense | Yurt kırılımı yok; Eylül'de 81 ilin hepsinde aynı gün sayısı (17), bu da tek menünün tüm illere kopyalandığını düşündürüyor (Varsayım) |
| resimlikykyemek.com | Web | İstanbul, Ordu | Puan, yorum, bildirim (hesap gerekli) | AdSense | Az il, giriş zorunluluğu |
| com.yurt.yemek (Ali Dönmez) | Android | — | — | Veri paylaşımı beyanı: uygulama etkinliği ve cihaz kimliği üçüncü taraflara | 10 bin+ indirme; gizlilik tarafı zayıf |
| KYK Menüsü (App Store id6743946195) | iOS | — | Bildirim, öğün saati hatırlatıcısı, sevilmeyen yemek kara listesi | — | Kara liste iyi fikir, bizde yok |
| Yurtta Ye (bulutsoft-dev) | Flutter, açık kaynak ama lisanssız | — | — | — | Repo son 10 ayda güncellenmemiş |

## Bizim farkımız (bugün ve hedef)

- **Reklamsız, girişsiz, çevrimdışı.** Rakiplerin tamamı web tarafında AdSense kullanıyor. İkinci açılıştan itibaren menüye 0 dokunuş, rakiplerde yok.
- **Dürüst veri.** Açıklanmamış gün açıkça "açıklanmadı" yazar, kalori uydurulmaz. yurtmenu.net de veri yok durumunu dürüstçe gösteriyor; asıl rakip o.
- **Eksik olan:** sevilmeyen yemek uyarısı (iOS rakibinde var), il kapsamı (yalnızca İstanbul). Kapsam, otomatik kaynak olmadığı için doğrudan topluluk katkısına bağlı. Bu, ürünün en büyük riski.
