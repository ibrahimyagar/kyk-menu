import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function kimlik(il: string, ay: string): string {
  return `${il.replace(/-/g, "_")}_${ay.replace("-", "_")}`;
}

export async function menuleriYaz(): Promise<void> {
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
