import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MenuDosyasi } from "../types/domain";
import { menuDosyasiMi } from "./karar";

const ON_EK = "menu:v1:";

function anahtar(il: string, ay: string): string {
  return `${ON_EK}${il}:${ay}`;
}

export async function depoOku(): Promise<MenuDosyasi[]> {
  const tumu = await AsyncStorage.getAllKeys();
  const menuAnahtarlari = tumu.filter((kayit) => kayit.startsWith(ON_EK));
  if (menuAnahtarlari.length === 0) return [];
  const ciftler = await AsyncStorage.multiGet(menuAnahtarlari);
  const sonuc: MenuDosyasi[] = [];
  for (const [, deger] of ciftler) {
    if (!deger) continue;
    try {
      const json: unknown = JSON.parse(deger);
      if (menuDosyasiMi(json)) sonuc.push(json);
    } catch {
      // Bozuk kayıt atlanır; gömülü kopya durur.
    }
  }
  return sonuc;
}

export async function depoYaz(dosya: MenuDosyasi): Promise<void> {
  await AsyncStorage.setItem(anahtar(dosya.il, dosya.ay), JSON.stringify(dosya));
}
