# Paylaşım ve geri bildirim notları

## Paylaşım görseli

Menü ekranındaki "Görsel olarak paylaş" düğmesi o günün o öğününü PNG'ye basıp sistem paylaşım sayfasını açar. Yalnızca gösterilecek menü varken çizilir.

Kart 360 dp genişlikte sabit; yakalama cihazın piksel oranıyla büyüdüğü için modern telefonlarda 1080 piksele yakın çıkar. Kart ekran dışında (`left: -10000`) duruyor, çünkü `react-native-view-shot` görünümü doğrudan tuvale çiziyor; görünür olması veya kırpılmaması gerekmiyor.

Kartta yemek başına kalori yok, toplam varsa var. Sosyal paylaşımda satır başına rozet gürültü yapıyordu.

Kartın altında "Resmî değildir, ilan esastır" yazıyor. Görsel uygulamanın dışına çıktığı için feragat görselin kendisinde olmalı.

Kartta marka yok, çünkü ad henüz seçilmedi. Ad belirlenince alt satıra eklenecek; paylaşımın tanıtım değeri oradan geliyor, şimdilik o değer boşta duruyor.

Kart kullanıcının o anki temasını kullanır. Gördüğü ekranla paylaştığı görselin aynı olması daha tutarlı.

## Geri bildirim bağlantıları

`src/config/baglantilar.ts` iki şablon tutar: `MENU_YANLIS_FORM` ve `MENU_FOTO_FORM`. Boşken düğme hiç çizilmez, yani kullanıcı ölü bağlantı görmez.

Şablonda `{il}`, `{tarih}` ve `{ogun}` yer tutucuları kullanılabilir; değerler URL için kodlanır. Google Form alan kimlikleri bilinmediği için adres şablon olarak tutuluyor:

```
https://docs.google.com/forms/d/e/FORM_ID/viewform?entry.111={il}&entry.222={tarih}
```

Bilinmeyen yer tutucu olduğu gibi bırakılır; sessizce boş değer gönderilmez.

"Menü yanlış mı?" menü ekranının altında, çünkü hata o bağlamda görülüyor. "Menü fotoğrafı gönder" ayarlarda, çünkü planlı bir katkı.

## Doğrulanmayanlar

Paylaşım ve yakalama gerçek cihazda denenmedi. Ekran dışı yakalama Android ve iOS'ta ayrı davranabilir; ilk cihaz testinde kartın boş veya saydam çıkmadığı kontrol edilmeli.
