import type { Grup } from "../types/domain";

export interface KaloriDilimi {
  baslik: string;
  kcal: number;
}

/**
 * Grubun kalorisi. "biri" gruplarında seçenekler aynı değeri taşıdığı için o
 * değer, "hepsi" gruplarında hepsi verildiği için toplam. Eksik veya çelişkili
 * değer varsa sayı üretilmez; tahmin yapılmaz.
 */
export function grupKcal(grup: Grup): number | null {
  const degerler = grup.secenekler.map((secenek) => secenek.kcal);
  if (degerler.length === 0 || degerler.some((kcal) => kcal == null)) return null;
  const sayilar = degerler as number[];
  if (grup.secim === "biri") {
    const ilk = sayilar[0] as number;
    return sayilar.every((kcal) => kcal === ilk) ? ilk : null;
  }
  return sayilar.reduce((toplam, kcal) => toplam + kcal, 0);
}

/** Kalorisi bilinen gruplar. Değeri olmayan grup dilime girmez. */
export function kaloriDilimleri(gruplar: Grup[]): KaloriDilimi[] {
  const dilimler: KaloriDilimi[] = [];
  for (const grup of gruplar) {
    const kcal = grupKcal(grup);
    if (kcal == null || kcal <= 0) continue;
    dilimler.push({ baslik: grup.baslik ?? "Diğer", kcal });
  }
  return dilimler;
}

export function dilimToplami(dilimler: KaloriDilimi[]): number {
  return dilimler.reduce((toplam, dilim) => toplam + dilim.kcal, 0);
}

/** Dilim tonları: tek vurgu rengi üzerinde azalan doygunluk. */
export function dilimSaydamligi(sira: number, adet: number): number {
  if (adet <= 1) return 1;
  const enAz = 0.45;
  return 1 - (sira / (adet - 1)) * (1 - enAz);
}
