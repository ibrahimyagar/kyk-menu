# Veri sözleşmesi — sema 1

Menü il bazında tutulur. Tek doğruluk kaynağı `data/menus/{ilSlug}/{YYYY-MM}.json` dosyasıdır. Uygulama bu dosyayı doğrudan okumaz; `npm run build:data` çıktısını okur.

## Menü dosyası

```json
{
  "sema": 1,
  "il": "istanbul",
  "ay": "2026-10",
  "surum": 1,
  "kaynak": "belgenin nereden geldiği",
  "guncellenmeTarihi": "2026-10-01",
  "gunler": {
    "2026-10-01": {
      "kahvalti": {
        "toplamKcal": null,
        "gruplar": [
          {
            "baslik": "Yumurta",
            "secim": "hepsi",
            "secenekler": [{ "ad": "Haşlanmış yumurta" }]
          }
        ]
      },
      "aksam": {
        "durum": "aciklanmadi",
        "toplamKcal": null,
        "kcalAralik": null,
        "gruplar": []
      }
    }
  }
}
```

- `secim: "biri"` öğrenci gruptan birini seçer. `"hepsi"` grubun tamamı verilir.
- `kcal` ve `toplamKcal` yalnızca kaynakta yazıyorsa girilir. Seçenekler toplanarak toplam üretilmez.
- Kaynak `1100-1500 kcal` gibi aralık verdiyse `kcalAralik` yazılır; orta değer uydurulmaz.
- Öğün dosyadaki diğer öğünlerden farklı bir kaynaktan geldiyse öğüne `kaynak` (adres ve nasıl alındığı) yazılır. Yoksa dosyanın `kaynak` alanı geçerlidir.
- `durum: "aciklanmadi"` kaynak o öğünü vermediyse kullanılır. Gruplar boş kalır. Yemek uydurulmaz.
- Kaynakta olmayan gün anahtarı yazılmaz.
- Yemek adları `tr-TR` ile sadeleştirilir. `İ` / `ı` karıştırılmaz.

## Yayın

`publish/v1/manifest.json` hangi ilde hangi ayın hangi sürümde olduğunu söyler. `publish/v1/menu/{il}/{ay}.json` menü dosyasının kopyasıdır.

İstekler `?v={surum}` ile yapılır. Manifest kısa önbelleklenir. Ay dosyası sürüm değişmeden uzun önbelleklenebilir.

81 il listesi uygulamanın içine gömülür. Hangi ilde menü olduğu manifestten gelir.
