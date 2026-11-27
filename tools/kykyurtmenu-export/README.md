# kykyurtmenu.com dışa aktarma aracı

[kykyurtmenu.com](https://www.kykyurtmenu.com/) üzerindeki KYK menülerini il, tarih ve öğün bazında JSON'a aktarır. Yalnızca herkese açık sayfaları okur, `robots.txt` kurallarına uyar, giriş gerektiren veya kapalı uç noktalara gitmez.

## Kurulum

Python 3.10+ yeterli. Ek paket gerekmez.

```powershell
cd tools/kykyurtmenu-export
python -m unittest test_exporter   # ayrıştırıcı testleri
python exporter.py                 # 81 il × 2 öğün, sitenin bugünkü sayfası
```

Windows konsolunda Türkçe karakterler bozuk görünürse önce `$env:PYTHONIOENCODING="utf-8"` çalıştır. Dosyalar her durumda UTF-8 yazılır.

## Parametreler

| Parametre | Varsayılan | Açıklama |
| --- | --- | --- |
| `--cities` | hepsi | Virgülle il slug'ları: `ankara,istanbul`. Liste site haritasından keşfedilir. |
| `--meals` | `kahvalti,aksam` | Öğünler. |
| `--from`, `--to` | yok | `YYYY-MM-DD` aralığı. Verilmezse sitenin tarihsiz (bugünkü) sayfası alınır. |
| `--concurrency` | `2` | Eşzamanlı istek, 1–4 arası. |
| `--delay` | `1.5` | İstek başlangıçları arasındaki asgari süre (saniye). |
| `--retries` | `3` | 5xx ve ağ hatalarında yeniden deneme; artan bekleme. |
| `--cache-ttl` | `3600` | Önbellek ömrü (saniye). Arka uç hata sayfaları önbelleğe alınmaz. |
| `--no-cache` | kapalı | Önbelleği kullanma. |
| `--backend-retry-wait` | `60` | Site "Backend API şu an kapalı" diyen sayfaları bu kadar bekleyip bir kez yeniden dener. `0` = deneme. |
| `--split` | `none` | `city` veya `month`: ana dosyaya ek olarak `output/city/*.json` ya da `output/month/*.json`. |
| `--out` | `./output` | Çıktı klasörü. |

Site `429` döndürürse `Retry-After` beklenir; üç kez tekrarlanırsa çalışma durur ve kalan sayfalar `rate_limited_aborted` olarak raporlanır. Hız sınırı aşılmaya çalışılmaz.

## Çıktılar

```
output/
  kyk_menuleri.json     metadata + menus
  export_report.json    il/öğün sayıları, başarısızlık nedenleri, doğrulama bulguları
  failed_records.json   alınamayan her sayfa ve nedeni
  .cache/               ham HTML önbelleği (git'e girmez)
```

Bir menü kaydı:

```json
{
  "city": "İstanbul",
  "city_slug": "istanbul",
  "date": "2026-10-18",
  "meal_type": "dinner",
  "total_calories_kcal": 748,
  "items": [
    {
      "name": "Mercimek Çorbası",
      "category": null,
      "slot": "first",
      "calories_kcal": 140,
      "portion": null,
      "choice": "one_of",
      "alternatives": [{ "name": "Yüksük Çorbası", "calories_kcal": 180 }],
      "source_text": { "name": "Mercimek Çorbası / Yüksük Çorbası", "calories": "140 / 180" }
    }
  ],
  "source_url": "https://kykyurtmenu.com/istanbul/aksam",
  "source_id": 25543,
  "retrieved_at": "2026-10-18T18:08:29+03:00",
  "status": "success"
}
```

## Veri nereden geliyor

- İller `sitemap.xml` içindeki `/{il}/kahvalti` adreslerinden keşfedilir (81 il).
- Sayfa Next.js ile sunucuda üretiliyor; istemci tarafı API yok. Menü, sayfaya gömülü RSC yükündeki `item` nesnesindedir: `first`…`fourth` adları, `firstCalories`…`fourthCalories` ve `totalCalories`.
- Aynı yuvadaki seçenekler kaynakta `A / B` veya `A/B` ile, kaloriler `140 / 180` veya `140,180` ile ayrılır. İlk seçenek `name`, diğerleri `alternatives` alanına yazılır; her biri kendi kalorisini taşır.
- Her kayıt, aynı sayfadaki JSON-LD `ItemList` ile çapraz kontrol edilir (ilk seçenek adı + ilk kalori).

## Kurallar

- Kaynakta olmayan değer uydurulmaz. `category`, `portion` ve diğer besin değerleri kaynakta yok; `null`.
- Boş kalori `null`. Kaynakta `0` yazan yemek doğrulanmış sıfır sayılmaz: `null` yazılır, ham metin `source_text` içinde kalır, rapora `source_zero_as_null` düşer.
- Seçenek adedi ile kalori adedi tutmazsa o yuvanın kalorileri `null` olur (`calorie_count_mismatch`).
- `total_calories_kcal` kaynaktaki değerdir, düzeltilmez. Kaynak toplamı her yuvanın ilk seçeneğinin toplamıdır; farklıysa `total_mismatch`, bilinmeyen kalorili yemek hariç tutulmuşsa `total_excludes_unknown_items` raporlanır.
- Aynı il + tarih + öğün iki kez gelirse ilki tutulur, diğeri `duplicate` olarak raporlanır.

## Bilinen sınırlar

- **Geçmiş ve gelecek tarihler:** Site tarihi `/{il}/{öğün}?date=YYYY-MM-DD` ile değiştiriyor ve `robots.txt` bu kalıbı (`Disallow: /*?date=*`) botlara kapatıyor. Araç bu sayfalara istek atmaz, `robots_disallowed` olarak raporlar. Site sahibi izin verirse en temiz yol `robots.txt`'ye şu grubu eklemesidir; araç kendi grubunu otomatik tanır ve tarih aralığı çalışmaya başlar:

  ```
  User-Agent: kyk-menu-arastirma
  Allow: /
  Disallow: /api/
  ```

- Sitenin arka ucu bazı illerde "Sunucu bağlantısı kurulamadı" gösterebiliyor; bu sayfalar `site_backend_unavailable` olarak raporlanır ve bir sonraki çalıştırmada yeniden denenir.
- "Menü Bulunamadı" diyen sayfalar `no_menu_on_page` olarak raporlanır.
