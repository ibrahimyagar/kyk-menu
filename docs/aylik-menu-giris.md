# Aylık menü girişi

1. Gelen belgeyi `data/raw/{il}/{YYYY-MM}/` altına koy.

   kykyemek.com'dan (izinli) çekmek için: `npm run cek:kykyemek -- --ay 2026-10`.
   yurtmenu.net herkese açık il sayfasından: `npm run cek:yurtmenu -- --ay 2026-09`.
   İstanbul Eylül/Ekim kilitlidir.
2. `data/menus/{il}/{YYYY-MM}.json` dosyasını sözleşmeye göre yaz. Okunmayan günü boş bırak, `durum: "aciklanmadi"` koy. Kalori kaynakta yoksa yazma.
3. Ay sonu, bayram ve kalori sayılarını kaynakla gözden geçir.
4. `npm run validate`
5. `npm run build:data`
6. Değişikliği kaydet ve yayınla.
7. Uygulamada ili seçip bugünü kontrol et.

Aynı ay düzeltilirse `surum` bir artar. Önceki ayın menüsü yeni ayın yerine koyulmaz.
