import type { Grup, Ogun } from "../types/domain";

export type KategoriKimlik =
  | "corba"
  | "anaYemek"
  | "pilav"
  | "salata"
  | "ekmekSu"
  | "tatli"
  | "icecek"
  | "yumurta"
  | "kizartma"
  | "hamurIsi"
  | "peynir"
  | "zeytin"
  | "meyve"
  | "alGotur";

export interface Kategori {
  kimlik: KategoriKimlik;
  ad: string;
  /** Kalori şeridinde ve detay çubuğunda kullanılan orta ton; iki temada da okunur. */
  renk: string;
}

export const KATEGORILER: Record<KategoriKimlik, Kategori> = {
  corba: { kimlik: "corba", ad: "Çorba", renk: "#D2693C" },
  anaYemek: { kimlik: "anaYemek", ad: "Ana yemek", renk: "#A33E38" },
  pilav: { kimlik: "pilav", ad: "Yan yemek", renk: "#C79A3E" },
  salata: { kimlik: "salata", ad: "Salata", renk: "#6E9657" },
  ekmekSu: { kimlik: "ekmekSu", ad: "Ekmek ve su", renk: "#7E8A99" },
  tatli: { kimlik: "tatli", ad: "Tatlı", renk: "#C06588" },
  icecek: { kimlik: "icecek", ad: "İçecek", renk: "#5E8FA8" },
  yumurta: { kimlik: "yumurta", ad: "Yumurta", renk: "#D9A52A" },
  kizartma: { kimlik: "kizartma", ad: "Sıcak", renk: "#D98A2B" },
  hamurIsi: { kimlik: "hamurIsi", ad: "Hamur işi", renk: "#A9702F" },
  peynir: { kimlik: "peynir", ad: "Peynir", renk: "#B9A13D" },
  zeytin: { kimlik: "zeytin", ad: "Zeytin", renk: "#5F7046" },
  meyve: { kimlik: "meyve", ad: "Meyve", renk: "#C8503F" },
  alGotur: { kimlik: "alGotur", ad: "Al götür", renk: "#8C7B66" },
};

/** Veride geçen grup başlıkları. Yeni başlık gelirse yemek adına bakılır. */
const baslikHaritasi: Record<string, KategoriKimlik> = {
  çorba: "corba",
  "ana yemek": "anaYemek",
  "yan yemek": "pilav",
  yanında: "ekmekSu",
  sıcak: "kizartma",
  yumurta: "yumurta",
  "hamur işi": "hamurIsi",
  peynir: "peynir",
  zeytin: "zeytin",
  salata: "salata",
  ek: "salata",
  tatlı: "tatli",
  içecek: "icecek",
  meyve: "meyve",
  "al götür": "alGotur",
};

/** Başlık tanınmazsa yemek adındaki anahtar kelime. Sıra önemli: özel olandan genele. */
const adAnahtarlari: [string, KategoriKimlik][] = [
  ["çorba", "corba"],
  ["omlet", "yumurta"],
  ["menemen", "yumurta"],
  ["yumurta", "yumurta"],
  ["pilav", "pilav"],
  ["makarna", "pilav"],
  ["erişte", "pilav"],
  ["salata", "salata"],
  ["turşu", "salata"],
  ["cacık", "salata"],
  ["haydari", "salata"],
  ["yoğurt", "salata"],
  ["ekmek", "ekmekSu"],
  ["su", "ekmekSu"],
  ["ayran", "icecek"],
  ["süt", "icecek"],
  ["meyve suyu", "icecek"],
  ["börek", "hamurIsi"],
  ["poğaça", "hamurIsi"],
  ["açma", "hamurIsi"],
  ["simit", "hamurIsi"],
  ["pizza", "hamurIsi"],
  ["pide", "hamurIsi"],
  ["tost", "hamurIsi"],
  ["peynir", "peynir"],
  ["zeytin", "zeytin"],
  ["pirzola", "anaYemek"],
  ["köfte", "anaYemek"],
  ["kebap", "anaYemek"],
  ["hamburger", "anaYemek"],
  ["güveç", "anaYemek"],
  ["dolma", "anaYemek"],
  ["patates", "kizartma"],
  ["kızartma", "kizartma"],
  ["sosis", "kizartma"],
  ["baklava", "tatli"],
  ["kek", "tatli"],
  ["pasta", "tatli"],
  ["muhallebi", "tatli"],
  ["karpuz", "meyve"],
  ["kavun", "meyve"],
];

function sadelestir(metin: string): string {
  return metin.trim().toLocaleLowerCase("tr-TR");
}

/**
 * Grubun yemek kategorisi. Tanınmazsa null döner; o satırda görsel yerine
 * nötr bir işaret çizilir, uydurma görsel gösterilmez.
 */
export function kategoriBul(grup: Grup): Kategori | null {
  const baslik = grup.baslik ? baslikHaritasi[sadelestir(grup.baslik)] : undefined;
  if (baslik) return KATEGORILER[baslik];

  const adlar = grup.secenekler.map((secenek) => sadelestir(secenek.ad));
  for (const [anahtar, kimlik] of adAnahtarlari) {
    if (adlar.some((ad) => ad.includes(anahtar))) return KATEGORILER[kimlik];
  }
  return null;
}

/** Öğünü tek görselle temsil eden kategori: varsa ana yemek, yoksa ilk tanınan. */
export function ogunKategorisi(ogun: Ogun | undefined): Kategori | null {
  if (!ogun) return null;
  const kategoriler = ogun.gruplar.map(kategoriBul);
  return kategoriler.find((kategori) => kategori?.kimlik === "anaYemek") ?? kategoriler.find(Boolean) ?? null;
}
