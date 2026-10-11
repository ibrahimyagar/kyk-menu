# Tasarım karşılaştırması

## Başlangıç referansı

Referans ekranda büyük kırmızı başlık, şehir araması, konum düğmesi ve alttan taşan sekme çubuğu vardı.

Bu sürümde onlar yok. Üstte yalnızca seçili il ve ayarlar var. Arama yalnız il seçerken çıkar. Vurgu rengi seçili günde ve seçili öğünde.

Kontrast için palet ayarlandı: gündüz vurgu `#A33E38` (beyaz yazı 9,6:1), soluk metin `#5E666D` (4,8:1); gece soluk metin `#B7C0C7` (8,2:1). Gece vurgu `#E99086`, koyu yazıyla 4,7:1. Spec'teki `#E58A80` 4,3:1 kalıyordu. Şerit ve seçili arka plan için yazı taşımayan `aksanZemin` tonu eklendi (`#F0DEDA` / `#3A2B2A`).

## Rakipler ne yapıyor

| Uygulama | Yapı | Kalori | Ayırt edici yan |
| --- | --- | --- | --- |
| YurttaYe (Flutter) | şehir seç + tarih filtresi + kart listesi, tema, bildirim | satır başına rozet | AdMob reklamı var |
| "KYK Yemek Takip" | kendi tanıtımında "basit tasarım" | belirsiz | yok |
| kykmenulistesi.com.tr | fotoğraf, kalori, bildirim, öneri kutusu | liste içinde sayı | site + uygulama birlikte |

Ortak kalıp: şehir seçici, aylık kart listesi, koyu tema, bildirim. Üçünde de kalori ya hiç yok ya da her satırda tekrar eden bir rozet. Kimse kaloriyi anlamlı biçimde göstermiyor ve hiçbirinin görsel kimliği yok. Ayrışma noktası orası.

## Bu sürümde ayrışan kararlar

**Kalori satırdan çıktı, şeride girdi.** Yemek listesinde her satırın sağında sayı tekrarlamak hem gürültü hem de bir şey anlatmıyor. Kartın altında grupların payını gösteren tek bir ince şerit var; yanında toplam yazıyor. Dokununca `app/kalori.tsx` açılıyor: grup başına sayı, yüzde, yatay çubuk ve sayının nereden geldiğini söyleyen not. Kalori yoksa şerit çizilmiyor, yerine "Kalori bilgisi bu ay yayınlanmadı" yazıyor; tahmin üretilmiyor.

**Şerit tonlaması.** Tek vurgu rengi, sırayla azalan doygunlukta (1 → 0,45). Çok renkli pasta grafiği yerine tek renkli ritim; `dilimSaydamligi` saf fonksiyon olduğu için test ediliyor.

**Selamlama üst satırı.** "Bugün · 28 Ekim Çarşamba" tek satır yerine küçük bir üst satır ("GÜNAYDIN, YAFES") ve altında büyük tarih. Takma ad yazılmadıysa yalnızca "Günaydın" / "İyi akşamlar".

**Tek satırda oy ve paylaşım.** Beğen/beğenme ve "Paylaş" aynı yatay satırda; dikey alan menüye kalıyor.

**Simgeler.** Sekme çubuğunda seçili sekme dolu, diğerleri çizgi simge. Öğün seçicide güneş/ay. Simgeler `src/components/Ikon.tsx` üzerinden geçiyor, set değişirse tek dosya değişir.

**Hafta ekranı tarih seçiciye dönüştü.** Güne dokununca menü ekranı açılıyor; eskiden sadece seçim yapıp aynı ekranda kalıyordu. Bugünün satırında solda 3 px vurgu çizgisi, sağda günün toplam kalorisi var (iki öğünün de değeri varsa).

## Ölçüler

Tüm dokunma hedefleri en az 44 dp. Yemek listesi satırları dokunulmadığı için minimum yükseklik taşımıyor; menü kaydırmadan sığsın diye satır yüksekliği 22, dikey boşluk 8.
