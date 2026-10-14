import ankara_2026_10 from "../../data/menus/ankara/2026-10.json";
import antalya_2026_10 from "../../data/menus/antalya/2026-10.json";
import canakkale_2026_10 from "../../data/menus/canakkale/2026-10.json";
import edirne_2026_10 from "../../data/menus/edirne/2026-10.json";
import erzincan_2026_10 from "../../data/menus/erzincan/2026-10.json";
import eskisehir_2026_10 from "../../data/menus/eskisehir/2026-10.json";
import gaziantep_2026_10 from "../../data/menus/gaziantep/2026-10.json";
import isparta_2026_10 from "../../data/menus/isparta/2026-10.json";
import istanbul_2026_09 from "../../data/menus/istanbul/2026-09.json";
import istanbul_2026_10 from "../../data/menus/istanbul/2026-10.json";
import izmir_2026_10 from "../../data/menus/izmir/2026-10.json";
import kahramanmaras_2026_10 from "../../data/menus/kahramanmaras/2026-10.json";
import kayseri_2026_10 from "../../data/menus/kayseri/2026-10.json";
import konya_2026_10 from "../../data/menus/konya/2026-10.json";
import nigde_2026_10 from "../../data/menus/nigde/2026-10.json";
import sakarya_2026_10 from "../../data/menus/sakarya/2026-10.json";
import siirt_2026_10 from "../../data/menus/siirt/2026-10.json";
import sivas_2026_10 from "../../data/menus/sivas/2026-10.json";
import tokat_2026_10 from "../../data/menus/tokat/2026-10.json";
import trabzon_2026_10 from "../../data/menus/trabzon/2026-10.json";
import type { MenuDosyasi } from "../types/domain";

const dosyalar: Record<string, MenuDosyasi> = {
  "ankara/2026-10": ankara_2026_10 as MenuDosyasi,
  "antalya/2026-10": antalya_2026_10 as MenuDosyasi,
  "canakkale/2026-10": canakkale_2026_10 as MenuDosyasi,
  "edirne/2026-10": edirne_2026_10 as MenuDosyasi,
  "erzincan/2026-10": erzincan_2026_10 as MenuDosyasi,
  "eskisehir/2026-10": eskisehir_2026_10 as MenuDosyasi,
  "gaziantep/2026-10": gaziantep_2026_10 as MenuDosyasi,
  "isparta/2026-10": isparta_2026_10 as MenuDosyasi,
  "istanbul/2026-09": istanbul_2026_09 as MenuDosyasi,
  "istanbul/2026-10": istanbul_2026_10 as MenuDosyasi,
  "izmir/2026-10": izmir_2026_10 as MenuDosyasi,
  "kahramanmaras/2026-10": kahramanmaras_2026_10 as MenuDosyasi,
  "kayseri/2026-10": kayseri_2026_10 as MenuDosyasi,
  "konya/2026-10": konya_2026_10 as MenuDosyasi,
  "nigde/2026-10": nigde_2026_10 as MenuDosyasi,
  "sakarya/2026-10": sakarya_2026_10 as MenuDosyasi,
  "siirt/2026-10": siirt_2026_10 as MenuDosyasi,
  "sivas/2026-10": sivas_2026_10 as MenuDosyasi,
  "tokat/2026-10": tokat_2026_10 as MenuDosyasi,
  "trabzon/2026-10": trabzon_2026_10 as MenuDosyasi,
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
