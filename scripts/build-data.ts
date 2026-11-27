import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menuKok = path.join(kok, "data", "menus");
const yayinKok = path.join(kok, "publish", "v1");

const denetim = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--import", "./scripts/ts-kayit.mjs", "./scripts/validate.ts"],
  { cwd: kok, stdio: "inherit" },
);

if (denetim.status !== 0) {
  process.exit(denetim.status ?? 1);
}

interface MenuDosyasi {
  il: string;
  ay: string;
  surum: number;
}

function istanbulZamani(an: Date): string {
  const bicim = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(an);
  return `${bicim.replace(" ", "T")}+03:00`;
}

const iller: Record<string, { aylar: Record<string, { surum: number }> }> = {};
const kopyalar: { il: string; ay: string; icerik: string }[] = [];

const ilKlasorleri = await readdir(menuKok, { withFileTypes: true });
for (const il of ilKlasorleri) {
  if (!il.isDirectory()) continue;
  const dosyalar = await readdir(path.join(menuKok, il.name));
  for (const ad of dosyalar) {
    if (!ad.endsWith(".json")) continue;
    const icerik = await readFile(path.join(menuKok, il.name, ad), "utf8");
    const menu = JSON.parse(icerik) as MenuDosyasi;
    iller[menu.il] ??= { aylar: {} };
    iller[menu.il].aylar[menu.ay] = { surum: menu.surum };
    kopyalar.push({ il: menu.il, ay: menu.ay, icerik });
  }
}

await rm(yayinKok, { recursive: true, force: true });
await mkdir(yayinKok, { recursive: true });

for (const kopya of kopyalar) {
  const hedef = path.join(yayinKok, "menu", kopya.il, `${kopya.ay}.json`);
  await mkdir(path.dirname(hedef), { recursive: true });
  await writeFile(hedef, kopya.icerik, "utf8");
}

const manifest = {
  sema: 1,
  uretimTarihi: istanbulZamani(new Date()),
  iller,
};

await writeFile(path.join(yayinKok, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Yayın hazır. ${kopyalar.length} menü dosyası.`);
