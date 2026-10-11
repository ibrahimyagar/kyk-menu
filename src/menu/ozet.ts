import type { Grup, Ogun } from "../types/domain";

export function ogunVar(ogun: Ogun | undefined): boolean {
  return Boolean(ogun) && ogun?.durum !== "aciklanmadi" && (ogun?.gruplar.length ?? 0) > 0;
}

/** Grubun seçenekleri: "biri" ise alternatif, "hepsi" ise birlikte verilir. */
export function grupMetni(grup: Grup): string {
  const adlar = grup.secenekler.map((secenek) => secenek.ad);
  return adlar.join(grup.secim === "biri" ? " veya " : ", ");
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

/** E-posta gövdesi gibi düz metin yerler için öğünün tamamı. */
export function ogunMetni(ogun: Ogun | undefined): string {
  if (!ogunVar(ogun) || !ogun) return "";
  return ogun.gruplar
    .map((grup) => (grup.baslik ? `${grup.baslik}: ${grupMetni(grup)}` : grupMetni(grup)))
    .join("\n");
}
