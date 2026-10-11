/**
 * Geri bildirim formları. Boşsa düğme çizilmez; adres uydurulmaz.
 * Şablonda `{il}` ve `{tarih}` yer tutucuları kullanılabilir, örneğin
 * `https://docs.google.com/forms/d/e/.../viewform?entry.123={il}&entry.456={tarih}`
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
