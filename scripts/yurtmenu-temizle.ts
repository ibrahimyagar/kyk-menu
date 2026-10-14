import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Grup, MenuDosyasi } from "../src/types/domain.ts";
import { kategoriBul } from "../src/menu/kategori.ts";
import { satirCoz } from "./yurtmenu-ayristir.ts";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function grupYenile(grup: Grup): Grup[] {
  if (grup.secenekler.length !== 1) {
    const kirli = grup.secenekler.some((y) => /~|veya/i.test(y.ad));
    if (!kirli) return [grup];
  }
  const ham = grup.secenekler.map((y) => y.ad).join(" veya ");
  if (!/~|\sveya\s/i.test(ham) && !grup.secenekler.some((y) => /~/.test(y.ad))) return [grup];
  if (grup.secenekler.length === 1 && (/~|\sveya\s/i.test(grup.secenekler[0].ad))) {
    const { secenekler, secim } = satirCoz(grup.secenekler[0].ad);
    return [{
      baslik: kategoriBul({ baslik: null, secim, secenekler })?.ad ?? grup.baslik,
      secim,
      secenekler,
    }];
  }
  const secenekler = grup.secenekler.map((y) => {
    const { secenekler: parca } = satirCoz(y.ad);
    return parca[0] ?? y;
  });
  return [{ ...grup, secenekler }];
}

const menuKok = path.join(kok, "data", "menus");
const iller = await readdir(menuKok, { withFileTypes: true });
let sayac = 0;
for (const il of iller) {
  if (!il.isDirectory() || il.name === "istanbul") continue;
  const dosya = path.join(menuKok, il.name, "2026-09.json");
  let ham: string;
  try {
    ham = await readFile(dosya, "utf8");
  } catch {
    continue;
  }
  const veri = JSON.parse(ham) as MenuDosyasi;
  if (!veri.kaynak.includes("yurtmenu.net")) continue;
  for (const gun of Object.values(veri.gunler)) {
    for (const ogunAd of ["kahvalti", "aksam"] as const) {
      const ogun = gun[ogunAd];
      ogun.gruplar = ogun.gruplar.flatMap(grupYenile);
    }
  }
  await writeFile(dosya, `${JSON.stringify(veri, null, 2)}\n`, "utf8");
  sayac += 1;
}
console.log(`temizlendi: ${sayac} dosya`);
