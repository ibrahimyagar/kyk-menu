/**
 * İletişim adresi. Yayına çıkmadan önce kişisel adres yerine projeye ait
 * bir adrese çevrilmeli; mağaza sayfasında da aynı adres görünecek.
 */
export const ILETISIM_EPOSTA = "yafestahl@gmail.com";

/**
 * Geri bildirim formları. Boşsa form düğmesi çizilmez; adres uydurulmaz.
 * Şablonda `{il}`, `{tarih}` ve `{ogun}` yer tutucuları kullanılabilir.
 */
export const MENU_YANLIS_FORM = "";
export const MENU_FOTO_FORM = "";

/** Şablon boşsa null döner. Değerler URL için kodlanır. */
export function baglantiKur(sablon: string, degerler: Record<string, string>): string | null {
  const temiz = sablon.trim();
  if (!temiz) return null;
  return temiz.replace(/\{(\w+)\}/g, (tam, anahtar: string) => {
    const deger = degerler[anahtar];
    return deger == null ? tam : encodeURIComponent(deger);
  });
}

/** Konu ve gövdesi hazır mailto adresi. Adres tanımlı değilse null. */
export function mailtoKur(konu: string, govde: string): string | null {
  const adres = ILETISIM_EPOSTA.trim();
  if (!adres) return null;
  return `mailto:${adres}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`;
}

/** Takma ad yazıldıysa imza satırı eklenir; yazılmadıysa hiçbir şey eklenmez. */
function govdeKur(satirlar: string[], imza?: string): string {
  const ad = imza?.trim();
  return (ad ? [...satirlar, `-- ${ad}`] : satirlar).join("\n");
}

/** Form tanımlıysa form, değilse e-posta. İkisi de yoksa düğme çizilmez. */
export function hataliMenuAdresi(
  il: string,
  tarih: string,
  ogunAdi: string,
  gorunen: string,
  imza?: string,
): string | null {
  return (
    baglantiKur(MENU_YANLIS_FORM, { il, tarih, ogun: ogunAdi }) ??
    mailtoKur(
      `Hatalı menü: ${il} ${tarih} ${ogunAdi}`,
      govdeKur(
        [
          `İl: ${il}`,
          `Tarih: ${tarih}`,
          `Öğün: ${ogunAdi}`,
          "",
          "Uygulamada görünen:",
          gorunen,
          "",
          "Doğrusu (yemekhanedeki ilana göre):",
          "",
        ],
        imza,
      ),
    )
  );
}

export function menuGonderAdresi(il: string, imza?: string): string | null {
  return (
    baglantiKur(MENU_FOTO_FORM, { il }) ??
    mailtoKur(
      il ? `Menü gönderimi: ${il}` : "Menü gönderimi",
      govdeKur(
        [
          `İl: ${il}`,
          "",
          "Yurdumun aylık menüsünü bu e-postaya ekliyorum.",
          "Fotoğraf çekerken listenin tamamının okunabildiğinden emin olmaya çalıştım.",
          "",
        ],
        imza,
      ),
    )
  );
}

export function sehirTalebiMektubu(aranan: string, imza?: string): string | null {
  return mailtoKur(
    aranan ? `Şehir talebi: ${aranan}` : "Şehir talebi",
    govdeKur(
      [
        `Şehir: ${aranan || "(yazabilirsin)"}`,
        "",
        "Bu şehrin menüsünü uygulamaya eklemenizi istiyorum.",
        "Elimde aylık menü listesi varsa bu e-postaya ekliyorum (fotoğraf veya belge).",
        "",
      ],
      imza,
    ),
  );
}
