import type { OgunAdi } from "./tarih";

/**
 * Öğüne göre selamlama. Takma ad boşsa yalnızca selam döner; ad uydurulmaz,
 * kullanıcı yazmadıysa kişiselleştirme yapılmaz.
 */
export function selamlama(ogun: OgunAdi, ad: string): string {
  const selam = ogun === "kahvalti" ? "Günaydın" : "İyi akşamlar";
  const temiz = ad.trim();
  return temiz ? `${selam}, ${temiz}` : selam;
}
