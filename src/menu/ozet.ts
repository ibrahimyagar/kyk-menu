import type { Ogun } from "../types/domain";

export function ogunVar(ogun: Ogun | undefined): boolean {
  return Boolean(ogun) && ogun?.durum !== "aciklanmadi" && (ogun?.gruplar.length ?? 0) > 0;
}

/** Grupların ilk seçeneklerinden kısa bir özet. Aynı grubun alternatifleri tekrarlanmaz. */
export function ogunOzeti(ogun: Ogun | undefined, adet = 3): string {
  if (!ogunVar(ogun) || !ogun) return "";
  const adlar: string[] = [];
  for (const grup of ogun.gruplar) {
    const ilk = grup.secenekler[0];
    if (ilk) adlar.push(ilk.ad);
    if (adlar.length >= adet) break;
  }
  return adlar.join(" · ");
}
