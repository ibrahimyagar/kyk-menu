import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ILLER } from "../src/data/iller.ts";
import { ayDosyasiKur } from "./kykyemek-ayristir.ts";
import { menuleriYaz } from "./menuler-uret.ts";
import { yurtmenuKayitVar, yurtmenuOgun } from "./yurtmenu-ayristir.ts";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AJAN = "kyk-menu-arastirma/0.1 (+iletisim: yafestahl@gmail.com)";
const BEKLE_MS = 800;
const KILITLI = new Set(["istanbul/2026-09", "istanbul/2026-10"]);
const KAYNAK = "https://yurtmenu.net/ — site sahibinin verdiği izinle herkese açık il sayfasından çekildi.";

function arguman(ad: string): string | undefined {
  const i = process.argv.indexOf(ad);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function bekle(ms: number): Promise<void> {
  return new Promise((coz) => setTimeout(coz, ms));
}

function istanbulBugun(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function gunListesi(ay: string): string[] {
  if (ay === "2026-09") {
    return Array.from({ length: 17 }, (_, i) => `2026-09-${String(i + 14).padStart(2, "0")}`);
  }
  const [yil, ayNo] = ay.split("-").map(Number);
  const son = new Date(Date.UTC(yil, ayNo, 0)).getUTCDate();
  return Array.from({ length: son }, (_, i) => `${ay}-${String(i + 1).padStart(2, "0")}`);
}

async function varMi(yol: string): Promise<boolean> {
  try {
    await access(yol);
    return true;
  } catch {
    return false;
  }
}

async function sayfaGetir(slug: string, tarih: string): Promise<string> {
  const adres = `https://yurtmenu.net/${slug}?date=${tarih}`;
  const yanit = await fetch(adres, {
    headers: { "User-Agent": AJAN, Accept: "text/html" },
    redirect: "follow",
  });
  if (!yanit.ok) throw new Error(`${slug} ${tarih} ${yanit.status}`);
  return yanit.text();
}

const hedefAy = arguman("--ay") ?? "2026-09";
const sadeceIl = arguman("--il");
const bugun = istanbulBugun();
const gunler = gunListesi(hedefAy);
const iller = ILLER.filter((il) => !sadeceIl || il.slug === sadeceIl);

console.log(`${iller.length} il, ${hedefAy}, ${gunler.length} gün`);

for (const il of iller) {
  const kilit = `${il.slug}/${hedefAy}`;
  const menuYol = path.join(kok, "data", "menus", il.slug, `${hedefAy}.json`);
  if (KILITLI.has(kilit)) {
    console.log(`${il.slug}: kilitli, atlandı`);
    continue;
  }
  if (await varMi(menuYol)) {
    console.log(`${il.slug}: ${hedefAy} zaten var, atlandı`);
    continue;
  }

  const kahvalti: Record<string, ReturnType<typeof yurtmenuOgun>> = {};
  const aksam: Record<string, ReturnType<typeof yurtmenuOgun>> = {};
  let dolu = 0;

  try {
    for (const tarih of gunler) {
      const html = await sayfaGetir(il.slug, tarih);
      if (yurtmenuKayitVar(html)) {
        kahvalti[tarih] = yurtmenuOgun(html, "breakfast");
        aksam[tarih] = yurtmenuOgun(html, "dinner");
        if (kahvalti[tarih].durum !== "aciklanmadi" || aksam[tarih].durum !== "aciklanmadi") dolu += 1;
      }
      await bekle(BEKLE_MS);
    }
  } catch (hata) {
    console.error(`${il.slug}: ${(hata as Error).message}`);
    await bekle(BEKLE_MS);
    continue;
  }

  if (dolu === 0) {
    console.log(`${il.slug}: kaynakta ${hedefAy} yok`);
    continue;
  }

  const dosya = ayDosyasiKur({
    il: il.slug,
    ay: hedefAy,
    kahvalti,
    aksam,
    kaynak: KAYNAK,
    guncellenmeTarihi: bugun,
  });
  const hedefKok = path.join(kok, "data", "menus", il.slug);
  await mkdir(hedefKok, { recursive: true });
  await writeFile(path.join(hedefKok, `${hedefAy}.json`), `${JSON.stringify(dosya, null, 2)}\n`, "utf8");
  console.log(`${il.slug}: ${dolu} gün → data/menus/${il.slug}/${hedefAy}.json`);
}

await menuleriYaz();
console.log("Bitti.");
