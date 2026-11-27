import type { Grup, KcalAralik, Ogun } from "../types/domain";
import { kategoriBul, type Kategori } from "./kategori";

export interface KaloriDilimi {
  baslik: string;
  /** Şerit oranı için değer. Seçenekleri farklıysa ilk seçenek; kaynak toplamı da böyle hesaplıyor. */
  kcal: number;
  /** Seçmeli grupta seçeneklerin kalorisi farklıysa en az–en çok. */
  aralik: KcalAralik | null;
  kategori: Kategori | null;
  grup: Grup;
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

/**
 * Seçmeli grupta her seçeneğin kalorisi biliniyor ama farklıysa: ilk seçenek ve aralık.
 * Tek bir seçeneğin bile değeri eksikse null; tahmin yapılmaz.
 */
function secenekAraligi(grup: Grup): { kcal: number; aralik: KcalAralik } | null {
  if (grup.secim !== "biri") return null;
  const degerler = grup.secenekler.map((secenek) => secenek.kcal);
  if (degerler.length < 2 || degerler.some((kcal) => kcal == null)) return null;
  const sayilar = degerler as number[];
  return { kcal: sayilar[0] as number, aralik: { min: Math.min(...sayilar), max: Math.max(...sayilar) } };
}

/** Kalorisi bilinen gruplar. Değeri olmayan grup dilime girmez. */
export function kaloriDilimleri(gruplar: Grup[]): KaloriDilimi[] {
  const dilimler: KaloriDilimi[] = [];
  for (const grup of gruplar) {
    const kesin = grupKcal(grup);
    const deger = kesin != null ? { kcal: kesin, aralik: null } : secenekAraligi(grup);
    if (!deger || deger.kcal <= 0) continue;
    const kategori = kategoriBul(grup);
    dilimler.push({ baslik: grup.baslik ?? kategori?.ad ?? "Diğer", ...deger, kategori, grup });
  }
  return dilimler;
}

export function dilimToplami(dilimler: KaloriDilimi[]): number {
  return dilimler.reduce((toplam, dilim) => toplam + dilim.kcal, 0);
}

export function gruplarEksiksiz(gruplar: Grup[]): boolean {
  return gruplar.length > 0 && gruplar.every((grup) => grupKcal(grup) != null);
}

/** Kart ve detay aynı kuralı kullanır: kaynak toplamı, yoksa eksiksiz dilim toplamı, yoksa aralık. */
export function ogunKaloriOzeti(ogun: Pick<Ogun, "toplamKcal" | "kcalAralik" | "gruplar">): {
  dilimler: KaloriDilimi[];
  toplam: number | null;
  aralik: KcalAralik | null;
} {
  const dilimler = kaloriDilimleri(ogun.gruplar);
  const toplam = ogun.toplamKcal ?? (gruplarEksiksiz(ogun.gruplar) ? dilimToplami(dilimler) : null);
  return { dilimler, toplam, aralik: ogun.kcalAralik ?? null };
}

/** Kategorisi bilinmeyen dilimler için sırayla azalan doygunluk. */
export function dilimSaydamligi(sira: number, adet: number): number {
  if (adet <= 1) return 1;
  const enAz = 0.45;
  return 1 - (sira / (adet - 1)) * (1 - enAz);
}
