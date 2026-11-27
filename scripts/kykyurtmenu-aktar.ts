import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ILLER } from "../src/data/iller.ts";
import type { GunMenu, MenuDosyasi, Ogun } from "../src/types/domain.ts";
import {
  BOS,
  DEGISTIREN,
  gunuBirlestir,
  kayitTarihi,
  ogunCevir,
  YURTMENU_KAYNAK,
  type DisMenu,
  type Oncelik,
} from "./kykyurtmenu-birlestir.ts";

/**
 * tools/kykyurtmenu-export çıktısını data/menus'e aktarır.
 *
 *   --kuru                 dosya yazmaz, yalnızca sayar
 *   --oncelik mevcut       (varsayılan) yemekleri farklı olan öğün ezilmez
 *   --oncelik yurtmenu     yemekleri farklı olan öğün kykyurtmenu sürümüyle değiştirilir
 *   --ornek                değiştirilecek birkaç öğünü iki kaynağıyla yazar
 *
 * Kurallar kykyurtmenu-birlestir.ts içinde. Kilitli dosyalara dokunulmaz.
 */

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GIRDI = path.join(kok, "tools", "kykyurtmenu-export", "output", "kyk_menuleri.json");
const KILITLI = new Set(["istanbul/2026-09"]);
const ZENGINLESTIRME_NOTU = "Aralık verilen akşamlara yemek başına kalori kykyurtmenu.com'dan eklendi.";
const KARMA_NOTU = "Öğünde kaynak alanı varsa o öğün oradan alındı:";
const ESKI_KARMA_NOTU = "Bazı günler:";

function arguman(ad: string): string | undefined {
  const sira = process.argv.indexOf(ad);
  return sira >= 0 ? process.argv[sira + 1] : undefined;
}

function oncelikOku(): Oncelik {
  const deger = arguman("--oncelik") ?? "mevcut";
  if (deger !== "mevcut" && deger !== "yurtmenu") throw new Error(`--oncelik mevcut|yurtmenu olmalı, gelen: ${deger}`);
  return deger;
}

function bugun(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
}

async function dosyaOku(yol: string): Promise<MenuDosyasi | null> {
  try {
    return JSON.parse(await readFile(yol, "utf8")) as MenuDosyasi;
  } catch {
    return null;
  }
}

function sayacArtir(sayac: Record<string, number>, anahtar: string): void {
  sayac[anahtar] = (sayac[anahtar] ?? 0) + 1;
}

function gunleriTopla(menuler: DisMenu[], sayac: Record<string, number>): Map<string, Map<string, GunMenu>> {
  const iller = new Map<string, Map<string, GunMenu>>();
  for (const menu of menuler) {
    const kayit = kayitTarihi(menu);
    if (!kayit) {
      sayacArtir(sayac, "gecersiz-tarih");
      continue;
    }
    if (kayit.yedekSayfa) sayacArtir(sayac, "yedek-sayfa-kendi-gunune");
    const gunler = iller.get(menu.city_slug) ?? new Map<string, GunMenu>();
    const gun = gunler.get(kayit.tarih) ?? { kahvalti: BOS, aksam: BOS };
    gun[menu.meal_type === "breakfast" ? "kahvalti" : "aksam"] = ogunCevir(menu);
    gunler.set(kayit.tarih, gun);
    iller.set(menu.city_slug, gunler);
  }
  return iller;
}

function kaynakGuncelle(dosya: MenuDosyasi, zenginlesti: boolean, karma: boolean): void {
  if (dosya.kaynak.includes(ESKI_KARMA_NOTU)) dosya.kaynak = dosya.kaynak.replace(ESKI_KARMA_NOTU, KARMA_NOTU);
  if (karma && !dosya.kaynak.includes(KARMA_NOTU)) dosya.kaynak = `${dosya.kaynak} ${KARMA_NOTU} ${YURTMENU_KAYNAK}`;
  if (zenginlesti && !dosya.kaynak.includes(ZENGINLESTIRME_NOTU)) dosya.kaynak = `${dosya.kaynak} ${ZENGINLESTIRME_NOTU}`;
}

function ogunMetni(ogun: Ogun | undefined): string {
  return ogun?.gruplar.map((g) => g.secenekler.map((s) => s.ad).join(" / ")).join(" | ") ?? "-";
}

const kuru = process.argv.includes("--kuru");
/** Her sonuç türünden birkaç öğünü iki kaynağıyla yan yana yazar. */
const ornek = process.argv.includes("--ornek");
const ORNEK_SAYISI = 3;
const ornekler: Record<string, number> = {};
const oncelik = oncelikOku();
const girdi = JSON.parse(await readFile(GIRDI, "utf8")) as { menus: DisMenu[] };
const bilinen = new Set(ILLER.map((il) => il.slug));
const sayac: Record<string, number> = {};
const ogunSayaci: Record<string, number> = {};
const degisenIller = new Map<string, Record<string, number>>();
let degisenDosya = 0;

for (const [il, gunler] of gunleriTopla(girdi.menus, sayac)) {
  if (!bilinen.has(il)) {
    console.log(`${il}: uygulamanın il listesinde yok, atlandı`);
    continue;
  }
  const aylar = new Map<string, [string, GunMenu][]>();
  for (const kayit of gunler) {
    const ay = kayit[0].slice(0, 7);
    aylar.set(ay, [...(aylar.get(ay) ?? []), kayit]);
  }

  for (const [ay, kayitlar] of aylar) {
    if (KILITLI.has(`${il}/${ay}`)) {
      sayac.kilitli = (sayac.kilitli ?? 0) + kayitlar.length;
      continue;
    }
    const yol = path.join(kok, "data", "menus", il, `${ay}.json`);
    const mevcut = await dosyaOku(yol);
    const dosya: MenuDosyasi = mevcut ?? { sema: 1, il, ay, surum: 0, kaynak: YURTMENU_KAYNAK, guncellenmeTarihi: bugun(), gunler: {} };
    const ayar = { oncelik, etiketle: dosya.kaynak !== YURTMENU_KAYNAK };
    let degisti = false;
    let zenginlesti = false;
    let karma = false;
    for (const [tarih, gelen] of kayitlar) {
      const sonuc = gunuBirlestir(dosya.gunler[tarih], gelen, ayar);
      for (const [ogunAdi, ogunSonucu] of [["kahvalti", sonuc.kahvalti], ["aksam", sonuc.aksam]] as const) {
        sayacArtir(ogunSayaci, `${ogunAdi}:${ogunSonucu}`);
        const ornekAnahtari = `${ogunAdi}:${ogunSonucu}`;
        if (ornek && ogunSonucu !== "ayni" && (ornekler[ornekAnahtari] = (ornekler[ornekAnahtari] ?? 0) + 1) <= ORNEK_SAYISI) {
          console.log(`ÖRNEK ${ornekAnahtari} ${il} ${tarih}\n  mevcut: ${ogunMetni(dosya.gunler[tarih]?.[ogunAdi])}\n  gelen:  ${ogunMetni(gelen[ogunAdi])}`);
        }
        if (!DEGISTIREN.has(ogunSonucu)) continue;
        degisti = true;
        if (ogunSonucu === "zenginlesti") zenginlesti = true;
        else karma ||= ayar.etiketle;
        const ilSayaci = degisenIller.get(il) ?? {};
        sayacArtir(ilSayaci, ogunSonucu);
        degisenIller.set(il, ilSayaci);
      }
      if (sonuc.gun) dosya.gunler[tarih] = sonuc.gun;
    }
    if (!degisti) continue;
    kaynakGuncelle(dosya, zenginlesti, karma);
    dosya.gunler = Object.fromEntries(Object.entries(dosya.gunler).sort(([a], [b]) => a.localeCompare(b)));
    dosya.surum += 1;
    dosya.guncellenmeTarihi = bugun();
    degisenDosya += 1;
    if (!kuru) {
      await mkdir(path.dirname(yol), { recursive: true });
      await writeFile(yol, `${JSON.stringify(dosya, null, 2)}\n`, "utf8");
    }
  }
}

for (const [il, ilSayaci] of [...degisenIller].sort(([a], [b]) => a.localeCompare(b, "tr"))) {
  console.log(`${il}: ${JSON.stringify(ilSayaci)}`);
}
console.log(`${kuru ? "(kuru) " : ""}öncelik=${oncelik}, ${degisenDosya} dosya değişti.`);
console.log("öğün:", ogunSayaci);
console.log("kayıt:", sayac);
if (!kuru && degisenDosya > 0) console.log("Yayına almak için: npm run build:data");
