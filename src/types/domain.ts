export type Secim = "biri" | "hepsi";

export type OgunDurumu = "var" | "aciklanmadi";

export interface Yemek {
  ad: string;
  kcal?: number;
}

export interface Grup {
  baslik: string | null;
  secim: Secim;
  secenekler: Yemek[];
}

export interface KcalAralik {
  min: number;
  max: number;
}

export interface Ogun {
  durum?: OgunDurumu;
  toplamKcal?: number | null;
  /** Kaynak tek sayı yerine aralık verdiyse (ör. 1100-1500). Tahmin üretilmez. */
  kcalAralik?: KcalAralik | null;
  /** Öğün dosyanın genel kaynağından farklı bir yerden geldiyse o kaynağın adresi. */
  kaynak?: string;
  gruplar: Grup[];
}

export interface GunMenu {
  kahvalti: Ogun;
  aksam: Ogun;
}

export interface MenuDosyasi {
  sema: 1;
  il: string;
  ay: string;
  surum: number;
  kaynak: string;
  guncellenmeTarihi: string;
  gunler: Record<string, GunMenu>;
}

export interface Il {
  id: string;
  ad: string;
  slug: string;
}

export interface ManifestAy {
  surum: number;
}

export interface Manifest {
  sema: 1;
  uretimTarihi: string;
  iller: Record<string, { aylar: Record<string, ManifestAy> }>;
}
