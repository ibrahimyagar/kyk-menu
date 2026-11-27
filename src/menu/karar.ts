import type { Manifest, MenuDosyasi } from "../types/domain";
import { ayAnahtari, ayinGunleri, gunEkle } from "../lib/tarih";

/** Eşit sürümde eldeki kopya kalır. Daha yüksek sürüm geleni alır. */
export function dahaGuncel(yerel: MenuDosyasi | null, gelen: MenuDosyasi | null): MenuDosyasi | null {
  if (!gelen) return yerel;
  if (!yerel) return gelen;
  if (gelen.surum > yerel.surum) return gelen;
  return yerel;
}

export function dahaYeni(yerel: number | null, uzak: number | undefined): boolean {
  if (uzak == null) return false;
  if (yerel == null) return true;
  return uzak > yerel;
}

/** Ayın son 7 günündeyse ertesi ayın anahtarını döner. */
export function ertesiAyOndalik(bugun: string): string | null {
  const gunler = ayinGunleri(ayAnahtari(bugun));
  const son = gunler[gunler.length - 1];
  if (!son) return null;
  const ilk = gunEkle(son, -6);
  if (bugun < ilk || bugun > son) return null;
  return ayAnahtari(gunEkle(son, 1));
}

export function menuDosyasiMi(veri: unknown): veri is MenuDosyasi {
  if (!veri || typeof veri !== "object") return false;
  const dosya = veri as Partial<MenuDosyasi>;
  return (
    dosya.sema === 1 &&
    typeof dosya.il === "string" &&
    typeof dosya.ay === "string" &&
    typeof dosya.surum === "number" &&
    typeof dosya.guncellenmeTarihi === "string" &&
    !!dosya.gunler &&
    typeof dosya.gunler === "object"
  );
}

export type MenuGorunumu = "menu" | "internet" | "bekliyor" | "il-yok" | "ay-yok";

export function menuGorunumu(girdi: {
  dosyaVar: boolean;
  ilBiliniyor: boolean;
  ayBiliniyor: boolean;
  yayinVar: boolean;
  manifestHazir: boolean;
  agKesik: boolean;
  istekVar: boolean;
  onbellekHazir: boolean;
}): MenuGorunumu {
  if (girdi.dosyaVar) return "menu";
  if (!girdi.onbellekHazir) return "bekliyor";
  if (!girdi.yayinVar) return girdi.ilBiliniyor ? "ay-yok" : "il-yok";
  if (girdi.istekVar || (!girdi.manifestHazir && !girdi.agKesik)) return "bekliyor";
  if (girdi.manifestHazir && !girdi.ayBiliniyor) return girdi.ilBiliniyor ? "ay-yok" : "il-yok";
  if (girdi.agKesik) return "internet";
  return "bekliyor";
}

/** "il/ay" → sürüm. Yalnızca artan sürüm alınır; değişiklik yoksa aynı nesne döner. */
export function katalogBirlestir(eski: Record<string, number>, manifest: Manifest): Record<string, number> {
  let degisti = false;
  const yeni = { ...eski };
  for (const [il, bilgi] of Object.entries(manifest.iller)) {
    for (const [ay, kayit] of Object.entries(bilgi.aylar)) {
      const anahtar = `${il}/${ay}`;
      const surum = Math.max(yeni[anahtar] ?? 0, kayit.surum);
      if (yeni[anahtar] !== surum) {
        yeni[anahtar] = surum;
        degisti = true;
      }
    }
  }
  return degisti ? yeni : eski;
}

export function manifestMi(veri: unknown): veri is Manifest {
  if (!veri || typeof veri !== "object") return false;
  const dosya = veri as Partial<Manifest>;
  return dosya.sema === 1 && !!dosya.iller && typeof dosya.iller === "object";
}
