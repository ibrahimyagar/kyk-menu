import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ILLER } from "../src/data/iller.ts";
import { ayDosyasiKur, htmlCoz, ogunHaritasi } from "./kykyemek-ayristir.ts";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AJAN = "kyk-menu-arastirma/0.1 (+iletisim: yafestahl@gmail.com)";
const KOK_ADRES = "https://kykyemek.com";
const BEKLE_MS = 1500;
const KILITLI = new Set(["istanbul/2026-09", "istanbul/2026-10"]);
const KAYNAK = "https://kykyemek.com/ — site sahibinin verdiği izinle çekildi. Ham yanıt data/raw/kykyemek/ altında.";

function arguman(ad: string): string | undefined {
  const i = process.argv.indexOf(ad);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function bayrak(ad: string): boolean {
  return process.argv.includes(ad);
}

function istanbulBugun(): { tarih: string; ay: string } {
  const bicim = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return { tarih: bicim, ay: bicim.slice(0, 7) };
}

function ayKaydir(hedef: string, simdi: string): number {
  const [hy, ha] = hedef.split("-").map(Number);
  const [sy, sa] = simdi.split("-").map(Number);
  return hy * 12 + ha - (sy * 12 + sa);
}

function bekle(ms: number): Promise<void> {
  return new Promise((coz) => setTimeout(coz, ms));
}

function slugBul(ad: string): string | undefined {
  const aranan = ad.trim().toLocaleLowerCase("tr-TR");
  return ILLER.find((il) => il.ad.toLocaleLowerCase("tr-TR") === aranan)?.slug;
}

async function cerezAl(): Promise<string> {
  const yanit = await fetch(`${KOK_ADRES}/`, {
    headers: { "User-Agent": AJAN, Accept: "text/html" },
  });
  if (!yanit.ok) throw new Error(`ana sayfa ${yanit.status}`);
  const html = await yanit.text();
  const cerez = (yanit.headers.getSetCookie?.() ?? []).map((satir) => satir.split(";")[0]).join("; ");
  return JSON.stringify({ html, cerez });
}

function ilListesi(html: string): string[] {
  return [...html.matchAll(/<option value="([^"]+)"/g)].map((eslesme) => htmlCoz(eslesme[1]));
}

async function ogunGetir(cerez: string, ilAd: string, aksam: boolean, kaydir: number): Promise<unknown> {
  const kod = encodeURIComponent(ilAd);
  const adres = `${KOK_ADRES}/Menu/GetDailyMenu/${kod}?city=${kod}&mealType=${aksam}&hidePast=false&monthShift=${kaydir}`;
  const yanit = await fetch(adres, {
    headers: {
      "User-Agent": AJAN,
      Cookie: cerez,
      Referer: `${KOK_ADRES}/`,
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
  });
  const metin = await yanit.text();
  if (!yanit.ok) throw new Error(`${ilAd} ${aksam ? "aksam" : "kahvalti"} ${yanit.status}: ${metin.slice(0, 120)}`);
  return JSON.parse(metin);
}

function kimlik(il: string, ay: string): string {
  return `${il.replace(/-/g, "_")}_${ay.replace("-", "_")}`;
}

async function menuleriYaz(): Promise<void> {
  const menuKok = path.join(kok, "data", "menus");
  const ilKlasorleri = await readdir(menuKok, { withFileTypes: true });
  const kayitlar: { il: string; ay: string }[] = [];
  for (const il of ilKlasorleri) {
    if (!il.isDirectory()) continue;
    const dosyalar = await readdir(path.join(menuKok, il.name));
    for (const ad of dosyalar) {
      if (ad.endsWith(".json")) kayitlar.push({ il: il.name, ay: ad.replace(/\.json$/, "") });
    }
  }
  kayitlar.sort((a, b) => `${a.il}/${a.ay}`.localeCompare(`${b.il}/${b.ay}`, "tr"));
  const importlar = kayitlar.map((k) => `import ${kimlik(k.il, k.ay)} from "../../data/menus/${k.il}/${k.ay}.json";`);
  const satirlar = kayitlar.map((k) => `  "${k.il}/${k.ay}": ${kimlik(k.il, k.ay)} as MenuDosyasi,`);
  const icerik = `${importlar.join("\n")}
import type { MenuDosyasi } from "../types/domain";

const dosyalar: Record<string, MenuDosyasi> = {
${satirlar.join("\n")}
};

export function gomuluHarita(): Record<string, MenuDosyasi> {
  return dosyalar;
}

export function ayMenusu(il: string, ay: string): MenuDosyasi | null {
  return dosyalar[\`\${il}/\${ay}\`] ?? null;
}

export function ildeKayitVar(il: string): boolean {
  return Object.keys(dosyalar).some((anahtar) => anahtar.startsWith(\`\${il}/\`));
}
`;
  await writeFile(path.join(kok, "src", "data", "menuler.ts"), icerik, "utf8");
}

const hedefAy = arguman("--ay") ?? istanbulBugun().ay;
const sadeceIl = arguman("--il");
const kuru = bayrak("--kuru");
const { tarih: bugun, ay: buAy } = istanbulBugun();
const kaydir = ayKaydir(hedefAy, buAy);
if (kaydir < -2 || kaydir > 2) {
  console.error(`Ay kaydırması ${kaydir}; site yalnızca ±2 ay veriyor.`);
  process.exit(1);
}

const oturum = JSON.parse(await cerezAl()) as { html: string; cerez: string };
let cerez = oturum.cerez;
const sitedekiIller = ilListesi(oturum.html);
if (sitedekiIller.length === 0) {
  console.error("Ana sayfada il seçici bulunamadı.");
  process.exit(1);
}

const secilen = sitedekiIller.filter((ad) => {
  const slug = slugBul(ad);
  if (!slug) {
    console.warn(`atlanıyor (il listesinde yok): ${ad}`);
    return false;
  }
  return !sadeceIl || slug === sadeceIl;
});

console.log(`${secilen.length} il, ay ${hedefAy}, kaydırma ${kaydir}`);

const ozet: { il: string; kahvalti: number; aksam: number; yol: string }[] = [];

for (const ilAd of secilen) {
  const slug = slugBul(ilAd);
  if (!slug) continue;
  try {
    const kahvaltiHam = (await ogunGetir(cerez, ilAd, false, kaydir)) as { html: string };
    await bekle(BEKLE_MS);
    const aksamHam = (await ogunGetir(cerez, ilAd, true, kaydir)) as { html: string };
    await bekle(BEKLE_MS);

    const hamKok = path.join(kok, "data", "raw", "kykyemek", slug);
    await mkdir(hamKok, { recursive: true });
    await writeFile(path.join(hamKok, `${hedefAy}-kahvalti.json`), JSON.stringify(kahvaltiHam), "utf8");
    await writeFile(path.join(hamKok, `${hedefAy}-aksam.json`), JSON.stringify(aksamHam), "utf8");

    const dosya = ayDosyasiKur({
      il: slug,
      ay: hedefAy,
      kahvalti: ogunHaritasi(kahvaltiHam),
      aksam: ogunHaritasi(aksamHam),
      kaynak: KAYNAK,
      guncellenmeTarihi: bugun,
    });
    const kahvaltiSayi = Object.values(dosya.gunler).filter((g) => g.kahvalti.durum !== "aciklanmadi").length;
    const aksamSayi = Object.values(dosya.gunler).filter((g) => g.aksam.durum !== "aciklanmadi").length;

    const kilit = `${slug}/${hedefAy}`;
    const hedefKok = KILITLI.has(kilit) ? path.join(kok, "data", "taslak", slug) : path.join(kok, "data", "menus", slug);
    const hedef = path.join(hedefKok, `${hedefAy}.json`);
    if (kuru) {
      console.log(`${slug}: kahvaltı ${kahvaltiSayi}, akşam ${aksamSayi} (yazılmadı)`);
    } else {
      await mkdir(hedefKok, { recursive: true });
      await writeFile(hedef, `${JSON.stringify(dosya, null, 2)}\n`, "utf8");
      if (KILITLI.has(kilit)) console.log(`${slug}: kilitli, taslak yazıldı (${hedef})`);
      else console.log(`${slug}: kahvaltı ${kahvaltiSayi}, akşam ${aksamSayi} → ${path.relative(kok, hedef)}`);
    }
    ozet.push({ il: slug, kahvalti: kahvaltiSayi, aksam: aksamSayi, yol: path.relative(kok, hedef) });
  } catch (hata) {
    console.error(`${ilAd}: ${(hata as Error).message}`);
    try {
      const yenile = JSON.parse(await cerezAl()) as { cerez: string };
      cerez = yenile.cerez;
    } catch {
      // sonraki ile devam
    }
    await bekle(BEKLE_MS);
  }
}

if (!kuru) await menuleriYaz();

const ozetYol = path.join(kok, "data", "raw", "kykyemek", `ozet-${hedefAy}.json`);
await mkdir(path.dirname(ozetYol), { recursive: true });
await writeFile(ozetYol, `${JSON.stringify({ ay: hedefAy, tarih: bugun, iller: ozet }, null, 2)}\n`, "utf8");
console.log(`Bitti. ${ozet.length} il.`);
