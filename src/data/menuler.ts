import ekim from "../../data/menus/istanbul/2026-10.json";
import eylul from "../../data/menus/istanbul/2026-09.json";
import type { MenuDosyasi } from "../types/domain";

const dosyalar: Record<string, MenuDosyasi> = {
  "istanbul/2026-09": eylul as MenuDosyasi,
  "istanbul/2026-10": ekim as MenuDosyasi,
};

export function gomuluHarita(): Record<string, MenuDosyasi> {
  return dosyalar;
}

export function ayMenusu(il: string, ay: string): MenuDosyasi | null {
  return dosyalar[`${il}/${ay}`] ?? null;
}

export function ildeKayitVar(il: string): boolean {
  return Object.keys(dosyalar).some((anahtar) => anahtar.startsWith(`${il}/`));
}
