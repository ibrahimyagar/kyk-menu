import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Manifest, MenuDosyasi } from "../types/domain";
import { manifestMi, menuDosyasiMi } from "./karar";

const ON_EK = "menu:v1:";
const MANIFEST_ANAHTARI = "manifest:v1";

function anahtar(il: string, ay: string): string {
  return `${ON_EK}${il}:${ay}`;
}

function ayi(kayit: string): string {
  return kayit.slice(kayit.lastIndexOf(":") + 1);
}

function cozumle<T>(deger: string | null, dogrula: (veri: unknown) => veri is T): T | null {
  if (!deger) return null;
  try {
    const json: unknown = JSON.parse(deger);
    return dogrula(json) ? json : null;
  } catch {
    return null;
  }
}

/**
 * Kayıtlı ayları okur. `enEskiAy`dan eski kayıtlar silinir; depo yalnızca
 * gezilen ayları tuttuğu için açılışta hepsini okumak ucuz kalır.
 */
export async function depoOku(enEskiAy: string): Promise<MenuDosyasi[]> {
  const menuAnahtarlari = (await AsyncStorage.getAllKeys()).filter((kayit) => kayit.startsWith(ON_EK));
  const eskiler = menuAnahtarlari.filter((kayit) => ayi(kayit) < enEskiAy);
  if (eskiler.length > 0) void AsyncStorage.multiRemove(eskiler);
  const guncel = menuAnahtarlari.filter((kayit) => ayi(kayit) >= enEskiAy);
  if (guncel.length === 0) return [];
  const ciftler = await AsyncStorage.multiGet(guncel);
  return ciftler.flatMap(([, deger]) => cozumle(deger, menuDosyasiMi) ?? []);
}

export async function depoYaz(dosya: MenuDosyasi): Promise<void> {
  await AsyncStorage.setItem(anahtar(dosya.il, dosya.ay), JSON.stringify(dosya));
}

export async function manifestOku(): Promise<Manifest | null> {
  return cozumle(await AsyncStorage.getItem(MANIFEST_ANAHTARI), manifestMi);
}

export async function manifestYaz(manifest: Manifest): Promise<void> {
  await AsyncStorage.setItem(MANIFEST_ANAHTARI, JSON.stringify(manifest));
}
