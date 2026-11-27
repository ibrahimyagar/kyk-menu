import { kategoriBul } from "../src/menu/kategori.ts";
import type { Grup, Ogun, Yemek } from "../src/types/domain.ts";
import { htmlCoz, slashAyir, yemekAdi } from "./kykyemek-ayristir.ts";

const BOS: Ogun = { durum: "aciklanmadi", toplamKcal: null, kcalAralik: null, gruplar: [] };

function adlarAl(html: string, kart: "breakfast" | "dinner"): string[] {
  const blok = html.match(new RegExp(`menu-card ${kart}-card[\\s\\S]*?<ul[^>]*class="menu-items">([\\s\\S]*?)</ul>`));
  if (!blok) return [];
  return [...blok[1].matchAll(/menu-item-name">([^<]+)/g)]
    .map((eslesme) => htmlCoz(eslesme[1]).replace(/\s+/g, " ").trim())
    .filter((ad) => ad && !/veri yok/i.test(ad));
}

function grupBasligi(secenekler: Yemek[]): string | null {
  return kategoriBul({ baslik: null, secim: "hepsi", secenekler })?.ad ?? null;
}

export function satirCoz(ham: string): { secenekler: Yemek[]; secim: "biri" | "hepsi" } {
  let metin = ham.replace(/\s+/g, " ").trim();
  let kcal: number | undefined;
  const kalori = metin.match(/~\s*(\d+)(?:\s*kcal)?\s*$/i);
  if (kalori) {
    kcal = Number(kalori[1]);
    metin = metin.replace(/~\s*\d+(?:\s*kcal)?\s*$/i, "").trim();
  }
  const parcalar = metin.split(/\s+veya\s+/i).map((parca) => parca.trim()).filter(Boolean);
  const adlar =
    parcalar.length === 1 ? slashAyir(parcalar[0]) : parcalar.length === 2 ? slashAyir(parcalar.join("/")) : parcalar.length > 0 ? parcalar : [metin];
  const secenekler = adlar.map((ad) => {
    const temiz = yemekAdi(ad);
    return kcal == null ? { ad: temiz } : { ad: temiz, kcal };
  });
  return { secenekler, secim: secenekler.length > 1 ? "biri" : "hepsi" };
}

export function yurtmenuOgun(html: string, kart: "breakfast" | "dinner"): Ogun {
  const adlar = adlarAl(html, kart);
  if (adlar.length === 0) return BOS;

  const gruplar: Grup[] = [];
  let yaninda: Yemek[] = [];

  for (const ham of adlar) {
    if (/^al götür/i.test(ham)) {
      gruplar.push({
        baslik: "Al götür",
        secim: "hepsi",
        secenekler: [{ ad: yemekAdi(ham) }],
      });
      continue;
    }
    if (/ekmek|ml su|bardak su/i.test(ham)) {
      yaninda.push({ ad: yemekAdi(ham) });
      continue;
    }
    const { secenekler, secim } = satirCoz(ham);
    gruplar.push({
      baslik: grupBasligi(secenekler),
      secim,
      secenekler,
    });
  }

  if (yaninda.length > 0) {
    gruplar.push({ baslik: "Yanında", secim: "hepsi", secenekler: yaninda });
  }
  if (gruplar.length === 0) return BOS;
  return { toplamKcal: null, kcalAralik: null, gruplar };
}

export function yurtmenuKayitVar(html: string): boolean {
  return !html.includes("Bu tarih için menü kaydı bulunamadı") && adlarAl(html, "breakfast").length + adlarAl(html, "dinner").length > 0;
}
