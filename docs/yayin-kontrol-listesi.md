# Yayın kontrol listesi

Sıra önemli: bekleme süresi uzun olan işler en başta duruyor. Google Play kapalı testi tek başına en az 14 gün sürüyor, o yüzden kod bitmeden başlatılması gerekir.

## Önce başlatılacaklar (bekleme uzun)

- [ ] Google Play geliştirici hesabı (25 USD, tek seferlik)
- [ ] Apple Developer Program (yıllık 99 USD)
- [ ] 12–20 test kullanıcısı toplanması. 13 Kasım 2023 sonrası açılan kişisel Play hesapları için **en az 12 testçinin 14 kesintisiz gün** kapalı teste katılması şart; dahili test sayılmıyor
- [ ] Gizlilik politikasının yayınlanacağı adres (GitHub Pages yeterli)
- [ ] İletişim e-postası
- [ ] Marka adı

## Veri ve barındırma

- [ ] Statik barındırma hesabı (Cloudflare Pages veya GitHub Pages)
- [ ] `publish/` klasörünün statik barındırmaya yüklenmesi (`npm run build:data` sonrası)
- [ ] EAS üretim profilinde `EXPO_PUBLIC_DATA_BASE_URL` tanımlanması (ör. `https://veri.ornek.com`; sonda `/` yok). Tanımsızsa üretim derlemesi menü indiremez; menüler artık uygulamaya gömülü değil
- [ ] `${EXPO_PUBLIC_DATA_BASE_URL}/v1/manifest.json` adresinin 200 döndüğünün doğrulanması
- [ ] Barındırmada `manifest.json` için kısa önbellek (ör. 5 dk), `menu/**` için uzun önbellek; menü adresleri `?v=sürüm` ile değişir
- [ ] Kapsanacak illerin menüleri girilip `npm run validate` ile doğrulanması

## Uygulama hazırlığı

- [ ] Uygulama simgesi ve açılış ekranı. Resmî kurum logosu veya ona benzeyen bir işaret kullanılmayacak
- [ ] `app.json` içindeki geçici "Yurt Menü" adının marka ile değiştirilmesi
- [ ] Sürüm numarası ve derleme numarası
- [ ] EAS Build ile üretim derlemesi
- [ ] Geliştirme derlemesinde bildirim testi (Expo Go'da zamanlanmış bildirim çalışmıyor)

## Cihaz testleri

Her biri gerçek telefonda yapılmalı; emülatör saat dilimi ve bildirim davranışını tam yansıtmıyor.

- [ ] Yeni kurulum: il seçimi tek dokunuşla bitiyor
- [ ] Uygulamayı kapatıp açma: il sorulmuyor, menü doğrudan geliyor
- [ ] Uçak modu: son menü görünüyor, "Son güncelleme" notu var
- [ ] Sil ve yeniden kur: ilk menü iniyor; internet yoksa anlaşılır ekran çıkıyor
- [ ] Ay sonu geçişi: ayın son günü 22:30'dan sonra ertesi ayın kahvaltısına geçiyor, dosya yoksa doğru mesaj çıkıyor
- [ ] Cihaz saat dilimini değiştir: "bugün" İstanbul saatine göre kalıyor
- [ ] Menüsü olmayan il seçimi: doğru boş ekran
- [ ] Açıklanmamış öğün: "menü açıklanmadı" yazıyor, uydurma yemek yok
- [ ] Gece ve gündüz teması, sistem temasıyla birlikte
- [ ] Telefon yazı boyutu en büyük: taşma ve kesilme yok
- [ ] Bildirim izni reddi: uygulama çalışmaya devam ediyor, tekrar sormuyor
- [ ] Hatırlatma uçak modunda da tetikleniyor
- [ ] Paylaşım görseli okunaklı, boş veya saydam değil
- [ ] Ekran okuyucu ile menü satırları anlamlı okunuyor

## Hukuki ve idari

- [ ] Gizlilik politikası yayında (`docs/gizlilik-politikasi.md` doldurulmuş hali)
- [ ] Play "Veri Güvenliği" formu: veri toplanmıyor, paylaşılmıyor, hesap yok
- [ ] Apple "App Privacy": Data Not Collected
- [ ] Uygulama içi feragat görünür durumda (menü ekranı altı ve ayarlar)
- [ ] Mağaza açıklamasının ilk satırlarında resmî olmadığının yazması
- [ ] Simge, isim ve ekran görüntülerinde kurum logosu bulunmaması

## Yayın sırası

1. Kapalı test (Play) ve TestFlight (Apple)
2. 14 gün kesintisiz kapalı test tamamlanması
3. Play üretim başvurusu, %10 aşamalı yayın
4. Çökme ve puan takibi, sorun yoksa tam yayın

## Kaynaklar

Apple inceleme kuralları 4.2 (asgari işlevsellik) ve 5.2.1 (kurum taklidi). Google Play yardım makaleleri 14151465 (kapalı test şartı), 9514050 (veri güvenliği), 9888374 ve 9888077 (taklit ve yanıltıcı içerik).
