# Yemek çizimleri

## Kural

Çizimler **temsilidir**. O günkü yemeğin fotoğrafı değil, yemeğin kategorisini anlatan düz illüstrasyonlardır. Bu yüzden bilinçli olarak gerçekçi fotoğraf kullanılmıyor: fotoğraf "tabakta bunu bulacaksın" sözü verir, çizim vermez. Ayarlar ekranındaki yasal notta bu açıkça yazılı.

Kategorisi bulunamayan grupta görsel uydurulmaz; nötr bir kare çizilir.

## Kategoriler

`src/menu/kategori.ts` tek kaynak: kimlik, ad ve kalori şeridinde kullanılan renk. Eşleme iki aşamalı:

1. Grup başlığı (`Çorba`, `Hamur işi`, `Al götür` …) doğrudan haritadan.
2. Başlık tanınmazsa yemek adındaki anahtar kelime (`pilav`, `omlet`, `ayran` …).

`scripts/kategori-dene.ts` gerçek veriyi tarıyor ve **tek bir grubun bile** kategorisiz kalmadığını doğruluyor (şu an 448 grup). Yeni il veya yeni başlık eklendiğinde bu test kırmızıya döner; haritaya eklemek gerekir.

## Boyut ve üretim hattı

Çizimler 1024 piksel üretildi, depoda `assets/kaynak-gorsel/` içinde duruyor. Uygulamaya giren kopyalar `assets/yemek/`: 160 piksel, JPEG kalite 82, toplam 46 KB.

```
npm run gorsel
```

Küçültme zorunlu, süs değil: 1024 piksellik bir kare çözüldüğünde bellekte ~4 MB tutuyor; 14 görsel düşük bellekli telefonu zorlar. Listede 36 dp, kalori detayında 40 dp, hafta listesinde 22 dp gösteriliyor; 160 piksel üç kat ekran yoğunluğuna yetiyor.

`assets/kaynak-gorsel/` dosyaları koda hiçbir yerden bağlı değil, bu yüzden uygulama paketine girmiyor. Yalnızca yeniden üretim için duruyor.

## Üslup

Yeni kategori eklenirse aynı üslup korunur: düz vektör, 3-5 düz renk, hafif üstten üç çeyrek açı, pastel tek renk zemin, gölge ve doku yok, yazı yok, konu karenin %55-60'ı. Yeni görsel üretirken mevcut bir çizimi referans vermek üslubu kilitliyor.

Zemin renkleri kasten pastel: 36 dp'lik kare iki temada da aynı dosyayla çalışıyor, gece temasında koyu yüzey üzerinde küçük renkli bir döşeme gibi duruyor.
