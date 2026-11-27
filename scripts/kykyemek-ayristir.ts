import { kategoriBul } from "../src/menu/kategori.ts";
import type { Grup, GunMenu, MenuDosyasi, Ogun, Yemek } from "../src/types/domain.ts";

const AYLAR: Record<string, string> = {
  ocak: "01",
  şubat: "02",
  mart: "03",
  nisan: "04",
  mayıs: "05",
  haziran: "06",
  temmuz: "07",
  ağustos: "08",
  eylül: "09",
  ekim: "10",
  kasım: "11",
  aralık: "12",
};

const SIFAT = /(?:li|lı|lu|lü)$/iu;
const RENK = /^(siyah|yeşil|beyaz|kırmızı)$/iu;

export interface KaynakOgun {
  html: string;
  day?: number;
  daysInMonth?: number;
}

export function htmlCoz(metin: string): string {
  return metin
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, kod: string) => String.fromCodePoint(Number.parseInt(kod, 16)))
    .replace(/&#(\d+);/g, (_, kod: string) => String.fromCodePoint(Number(kod)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function yemekAdi(ad: string): string {
  let temiz = ad.replace(/\s+/g, " ").trim();
  if (!temiz) return temiz;
  temiz = temiz.charAt(0).toLocaleUpperCase("tr-TR") + temiz.slice(1).toLocaleLowerCase("tr-TR");
  if (temiz.length <= 80) return temiz;
  const kisalt = temiz.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (kisalt.length > 0 && kisalt.length <= 80) return kisalt;
  return temiz.slice(0, 80).trim();
}

export function slashAyir(ad: string): string[] {
  if (!ad.includes("/")) return [ad];
  const parcalar = ad.split("/").map((parca) => parca.trim()).filter(Boolean);
  if (parcalar.length !== 2) return parcalar.length > 0 ? parcalar : [ad];
  const sag = parcalar[1].split(/\s+/);
  const sol = parcalar[0].split(/\s+/);
  if (sol.length === 1 && sag.length >= 2 && (SIFAT.test(parcalar[0]) || RENK.test(parcalar[0]))) {
    return [`${parcalar[0]} ${sag.slice(1).join(" ")}`, parcalar[1]];
  }
  return parcalar;
}

export function tarihCoz(metin: string): string | null {
  const eslesme = htmlCoz(metin).match(/(\d{1,2})\s+(\p{L}+)\s+(\d{4})/u);
  if (!eslesme) return null;
  const ay = AYLAR[eslesme[2].toLocaleLowerCase("tr-TR")];
  if (!ay) return null;
  return `${eslesme[3]}-${ay}-${eslesme[1].padStart(2, "0")}`;
}

function etiketleriSil(html: string): string {
  return htmlCoz(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function kaloriHaritasi(kart: string): Map<string, number> {
  const harita = new Map<string, number>();
  const eslesme = kart.match(/data-foods='([^']*)'/);
  if (!eslesme) return harita;
  try {
    const liste = JSON.parse(eslesme[1]) as { name: string; calori?: number }[];
    for (const yemek of liste) {
      if (typeof yemek.calori !== "number") continue;
      harita.set(yemek.name.trim().toLocaleLowerCase("tr-TR"), yemek.calori);
    }
  } catch {
    // bozuk öznitelik yok sayılır
  }
  return harita;
}

function kartKalori(kart: string): { toplam: number | null; aralik: { min: number; max: number } | null } {
  const aralik = kart.match(/(\d+)\s*-\s*(\d+)\s*kcal/i);
  if (aralik) return { toplam: null, aralik: { min: Number(aralik[1]), max: Number(aralik[2]) } };
  const tek = kart.match(/[~≈]?\s*(\d+)\s*kcal/i);
  return { toplam: tek ? Number(tek[1]) : null, aralik: null };
}

function yemekKcal(ad: string, harita: Map<string, number>): number | undefined {
  const anahtar = ad.toLocaleLowerCase("tr-TR");
  if (harita.has(anahtar)) return harita.get(anahtar);
  const birlesik = ad.replace(" / ", "/").toLocaleLowerCase("tr-TR");
  if (harita.has(birlesik)) return harita.get(birlesik);
  return undefined;
}

function spanlariAyikla(html: string): { sinif: string; metin: string }[] {
  return [...html.matchAll(/<span class='([^']+)'>([^<]*)<\/span>/g)].map((eslesme) => ({
    sinif: eslesme[1],
    metin: htmlCoz(eslesme[2]),
  }));
}

function parcaBirlestir(parcalar: { sinif: string; metin: string }[]): string {
  let ad = "";
  for (const parca of parcalar) {
    const metin = parca.metin.trim();
    if (!metin) continue;
    if (parca.sinif.includes("food-detail-text")) {
      if (metin.startsWith("+")) ad += ` + ${metin.slice(1).trim()}`;
      else if (metin.startsWith("(")) ad += ` ${metin}`;
      else ad += ` ${metin}`;
    } else if (!parca.sinif.includes("slash-separator")) {
      ad += (ad ? " " : "") + metin;
    }
  }
  return ad.replace(/\s+/g, " ").trim();
}

function secenekleriAyikla(icHtml: string): string[] {
  if (icHtml.includes("slash-separator")) {
    const parcalar = icHtml.split(/<span class='slash-separator'>[^<]*<\/span>/);
    return parcalar.map((parca) => parcaBirlestir(spanlariAyikla(parca))).filter(Boolean);
  }
  const duz = etiketleriSil(icHtml);
  return slashAyir(duz);
}

function yemekGovdesi(kart: string): string {
  const govde = kart.match(/id="areaone_\d+"[^>]*>([\s\S]*?)(?:<div class="cardFooter"|$)/i);
  if (!govde) return "";
  const ilk = govde[1].match(/<div>([\s\S]*?)<\/div>/);
  return ilk?.[1] ?? "";
}

function grupBasligi(secenekler: Yemek[]): string | null {
  const deneme: Grup = { baslik: null, secim: "hepsi", secenekler };
  return kategoriBul(deneme)?.ad ?? null;
}

function yemekYap(ad: string, harita: Map<string, number>, satirKcal?: number): Yemek {
  const temiz = yemekAdi(ad);
  const kcal = yemekKcal(temiz, harita) ?? yemekKcal(ad, harita) ?? satirKcal;
  return kcal == null ? { ad: temiz } : { ad: temiz, kcal };
}

export function ogunAyristir(kartHtml: string): Ogun {
  const govde = yemekGovdesi(kartHtml);
  const harita = kaloriHaritasi(kartHtml);
  const gruplar: Grup[] = [];
  let yaninda: Yemek[] = [];

  const paragraflar = [...govde.matchAll(/<p\s+class="([^"]*)"[^>]*>([\s\S]*?)<\/p>/g)];
  for (const paragraf of paragraflar) {
    const sinif = paragraf[1];
    const ic = paragraf[2];
    if (sinif.includes("text-end")) continue;
    const metin = etiketleriSil(ic);
    if (!metin || /^al götür/i.test(metin)) continue;

    if (sinif.includes("food-detail-text") && !sinif.includes("food-main-text")) {
      yaninda.push(yemekYap(metin, harita));
      continue;
    }
    if (!sinif.includes("food-main-text")) continue;

    const adlar = secenekleriAyikla(ic);
    if (adlar.length === 0) continue;
    const satirKcal = yemekKcal(metin, harita) ?? yemekKcal(adlar.join("/"), harita);
    const secenekler = adlar.map((ad) => yemekYap(ad, harita, satirKcal));
    gruplar.push({
      baslik: grupBasligi(secenekler),
      secim: secenekler.length > 1 ? "biri" : "hepsi",
      secenekler,
    });
  }

  if (yaninda.length > 0) {
    gruplar.push({
      baslik: "Yanında",
      secim: "hepsi",
      secenekler: yaninda,
    });
  }

  if (gruplar.length === 0) {
    return { durum: "aciklanmadi", toplamKcal: null, kcalAralik: null, gruplar: [] };
  }
  const kalori = kartKalori(kartHtml);
  return { toplamKcal: kalori.toplam, kcalAralik: kalori.aralik, gruplar };
}

export function kartlariAyikla(html: string): { tarih: string; kart: string }[] {
  const kartlar: { tarih: string; kart: string }[] = [];
  const parcalar = html.split(/<div class='card cardStyle[^']*' id="areaAll_\d+">/);
  for (const parca of parcalar.slice(1)) {
    const tarih = tarihCoz((parca.match(/cardDate[^>]*>([^<]+)/) ?? [])[1] ?? "");
    if (!tarih) continue;
    kartlar.push({ tarih, kart: parca });
  }
  return kartlar;
}

export function ogunHaritasi(kaynak: KaynakOgun): Record<string, Ogun> {
  const harita: Record<string, Ogun> = {};
  for (const { tarih, kart } of kartlariAyikla(kaynak.html)) {
    harita[tarih] = ogunAyristir(kart);
  }
  return harita;
}

export function ayDosyasiKur(girdi: {
  il: string;
  ay: string;
  kahvalti: Record<string, Ogun>;
  aksam: Record<string, Ogun>;
  kaynak: string;
  guncellenmeTarihi: string;
  surum?: number;
}): MenuDosyasi {
  const gunler: Record<string, GunMenu> = {};
  const tarihler = [...new Set([...Object.keys(girdi.kahvalti), ...Object.keys(girdi.aksam)])].sort();
  const bos: Ogun = { durum: "aciklanmadi", toplamKcal: null, kcalAralik: null, gruplar: [] };
  for (const tarih of tarihler) {
    if (!tarih.startsWith(`${girdi.ay}-`)) continue;
    gunler[tarih] = {
      kahvalti: girdi.kahvalti[tarih] ?? bos,
      aksam: girdi.aksam[tarih] ?? bos,
    };
  }
  return {
    sema: 1,
    il: girdi.il,
    ay: girdi.ay,
    surum: girdi.surum ?? 1,
    kaynak: girdi.kaynak,
    guncellenmeTarihi: girdi.guncellenmeTarihi,
    gunler,
  };
}
