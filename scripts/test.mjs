import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** `*-dene.ts` dosyaları kendiliğinden çalışır; yeni test eklemek için script düzenlemek gerekmez. */
const klasor = dirname(fileURLToPath(import.meta.url));
const dosyalar = readdirSync(klasor)
  .filter((ad) => ad.endsWith("-dene.ts"))
  .sort();

/* Windows'ta `--import` mutlak yol kabul etmiyor, file:// URL gerekiyor. */
const kayit = pathToFileURL(join(klasor, "ts-kayit.mjs")).href;

let hata = false;
for (const dosya of dosyalar) {
  const sonuc = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--import", kayit, join(klasor, dosya)],
    { stdio: "inherit" },
  );
  if (sonuc.status !== 0) hata = true;
}

if (dosyalar.length === 0) {
  console.error("test dosyasi bulunamadi");
  process.exit(1);
}
process.exit(hata ? 1 : 0);
