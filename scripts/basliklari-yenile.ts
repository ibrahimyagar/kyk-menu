import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KATEGORILER, kategoriBul } from "../src/menu/kategori.ts";
import type { Grup, MenuDosyasi } from "../src/types/domain.ts";

/**
 * Ayrıştırıcıların yemek adından türettiği grup başlıklarını güncel
 * kategori kurallarıyla yeniden hesaplar. Elle yazılmış dosyalara dokunmaz.
 */
const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menuKok = path.join(kok, "data", "menus");
const KILITLI = new Set(["istanbul/2026-09"]);
const ACIK_BASLIKLAR = new Set(["Yanında", KATEGORILER.alGotur.ad]);
const TURETILMIS = new Set(Object.values(KATEGORILER).map((kategori) => kategori.ad));

function bugun(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

function yeniBaslik(grup: Grup): string | null {
  if (grup.baslik && (ACIK_BASLIKLAR.has(grup.baslik) || !TURETILMIS.has(grup.baslik))) return grup.baslik;
  return kategoriBul({ ...grup, baslik: null })?.ad ?? null;
}

let degisenDosya = 0;
let degisenGrup = 0;
for (const il of await readdir(menuKok, { withFileTypes: true })) {
  if (!il.isDirectory()) continue;
  for (const ad of await readdir(path.join(menuKok, il.name))) {
    if (!ad.endsWith(".json") || KILITLI.has(`${il.name}/${ad.replace(/\.json$/, "")}`)) continue;
    const yol = path.join(menuKok, il.name, ad);
    const veri = JSON.parse(await readFile(yol, "utf8")) as MenuDosyasi;
    let degisti = 0;
    for (const gun of Object.values(veri.gunler)) {
      for (const ogun of [gun.kahvalti, gun.aksam]) {
        for (const grup of ogun.gruplar) {
          const baslik = yeniBaslik(grup);
          if (baslik === grup.baslik) continue;
          grup.baslik = baslik;
          degisti += 1;
        }
      }
    }
    if (degisti === 0) continue;
    veri.surum += 1;
    veri.guncellenmeTarihi = bugun();
    await writeFile(yol, `${JSON.stringify(veri, null, 2)}\n`, "utf8");
    degisenDosya += 1;
    degisenGrup += degisti;
  }
}
console.log(`${degisenDosya} dosyada ${degisenGrup} grup başlığı güncellendi.`);
