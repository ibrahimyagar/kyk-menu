# Bildirim notları

Hatırlatma tamamen cihazda kurulur. Sunucu, push servisi, cihaz kimliği yok.

## Davranış

Ayarlarda kahvaltı ve akşam için iki ayrı anahtar var. Saat 30 dakikalık adımlarla değişir; varsayılanlar 07:00 ve 16:30. Anahtar açıldığı anda izin istenir. İzin verilmezse anahtar açılmaz ve kullanıcıya telefon ayarlarına gitmesi söylenir; uygulama izni tekrar sormaz.

Plan `src/bildirim/plan.ts` içinde saf fonksiyonla üretilir: bugünden başlayarak 14 gün, açık olan öğünler, saati henüz geçmemiş olanlar. Menüsü açıklanmamış öğün atlanır, çünkü "menü yok" bildirimi kullanıcıya bir şey katmaz. Gövde o öğünün ilk üç grubunun ilk seçeneği.

Plan her açılışta ve uygulama öne geldiğinde yeniden kurulur. Önce içerik imzası karşılaştırılır; aynıysa iş yapılmaz. Değiştiyse bekleyen tüm bildirimler silinip plan tek parça kurulur.

## Kararlar ve sınırlar

Tetikleme anı `YYYY-MM-DDTHH:mm:00+03:00` ile kurulur. Türkiye 2016'dan beri kalıcı +03 kullanıyor; böylece kullanıcı yurt dışına çıksa veya cihaz saat dilimi değişse de bildirim yurttaki saate göre düşer. Türkiye saat rejimi değişirse burası güncellenmeli.

iOS bekleyen yerel bildirim sayısını 64'te sınırlar. En fazla 56 iş kuruyoruz; iki öğün açıkken 14 gün 28 bildirim demek.

Bildirimler yalnızca 14 gün ileriye kurulduğu için uygulama iki hafta hiç açılmazsa hatırlatma susar. Sunucusuz mimaride bunun bedelsiz bir çaresi yok; tekrar eden genel bir bildirim ("bugün ne var?") menüyü gövdede gösteremezdi.

Bildirime dokunulduğunda hangi güne gidileceği için içerikte `data: { tarih, ogun }` taşınıyor. Yönlendirme henüz bağlanmadı.

## Test

Yerel bildirim gerçek cihazda doğrulanmalı; zamanlanmış bildirim Expo Go'da sınırlı çalışır, güvenilir sonuç için geliştirme derlemesi gerekir. Uçak modunda da tetiklenmesi beklenir, çünkü kurulum tamamen cihazda.

Plan mantığı `npm test` içinde: saat geçmişse atlama, açıklanmamış öğün, sıralama, sınır kırpma ve imza karşılaştırması.
