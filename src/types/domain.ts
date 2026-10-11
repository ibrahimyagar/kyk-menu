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

export interface Ogun {
  durum?: OgunDurumu;
  toplamKcal?: number | null;
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
