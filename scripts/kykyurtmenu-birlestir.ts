import { kategoriBul } from "../src/menu/kategori.ts";
import type { GunMenu, Grup, Ogun, Yemek } from "../src/types/domain.ts";
import { yemekAdi } from "./kykyemek-ayristir.ts";

/**
 * tools/kykyurtmenu-export çıktısını uygulama şemasına çevirir ve var olan
 * günle birleştirir. Dosya okuma/yazma yok; kurallar burada test edilir.
 */

export interface DisSecenek {
  name: string;
  calories_kcal: number | null;
}

export interface DisKalem extends DisSecenek {
  choice: "single" | "one_of";
  alternatives: DisSecenek[];
}

export interface DisMenu {
  city_slug: string;
  /** Sayfadaki menünün kendi tarihi. İstenen tarih değil. */
  date: string;
  meal_type: "breakfast" | "dinner";
  total_calories_kcal: number | null;
  items: DisKalem[];
  status: string;
  source_url?: string;
}

export type Oncelik = "mevcut" | "yurtmenu";

export const YURTMENU_KAYNAK = "https://www.kykyurtmenu.com/ — site sahibinin izniyle (kullanıcı beyanı); tools/kykyurtmenu-export ile alındı.";
export const BOS: Ogun = { durum: "aciklanmadi", toplamKcal: null, kcalAralik: null, gruplar: [] };

const TARIH = /^\d{4}-\d{2}-\d{2}$/;

function anahtar(ad: string): string {
  return ad.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");
}

function secenek(dis: DisSecenek): Yemek {
  const ad = yemekAdi(dis.name);
  return dis.calories_kcal == null ? { ad } : { ad, kcal: dis.calories_kcal };
}

/** Kaynak bazen yemek adı yerine "?" gibi yer tutucu yazıyor. */
function adGercek(dis: DisSecenek): boolean {
  return /\p{L}/u.test(dis.name);
}

/**
 * "Peynirli / Ispanaklı börek", "Meyveli / Çikolatalı yaş pasta" kaynağın
 * kısaltması: ortak isim yalnız son seçenekte yazılı. Tek kelimelik "-li"
 * sıfatına son seçeneğin sıfat dışındaki kısmı eklenir.
 */
function ortakIsmiTamamla(secenekler: Yemek[]): Yemek[] {
  const son = secenekler[secenekler.length - 1]?.ad.split(" ");
  if (!son || son.length < 2) return secenekler;
  const isim = son.slice(1).join(" ");
  return secenekler.map((s) => (/^\p{L}+l[ıiuü]$/u.test(s.ad) ? { ...s, ad: `${s.ad} ${isim}` } : s));
}

export function ogunCevir(menu: DisMenu): Ogun {
  if (menu.status !== "success" || menu.items.length === 0) return BOS;
  const gruplar: Grup[] = menu.items.flatMap((kalem) => {
    const secenekler = ortakIsmiTamamla([kalem, ...kalem.alternatives].filter(adGercek).map(secenek));
    if (secenekler.length === 0) return [];
    const secim = secenekler.length > 1 ? "biri" : "hepsi";
    return [{ baslik: kategoriBul({ baslik: null, secim, secenekler })?.ad ?? null, secim, secenekler }];
  });
  if (gruplar.length === 0) return BOS;
  return { toplamKcal: menu.total_calories_kcal, kcalAralik: null, gruplar };
}

/**
 * Kayıt hangi güne yazılacak? Daima sayfadaki menünün kendi tarihi.
 * İstenen gün sitede yoksa site başka günü gösteriyor (yedek sayfa);
 * o menü istenen güne değil kendi gününe aittir.
 */
export function kayitTarihi(menu: DisMenu): { tarih: string; yedekSayfa: boolean } | null {
  if (!TARIH.test(menu.date)) return null;
  const istenen = menu.source_url ? new URL(menu.source_url).searchParams.get("date") : null;
  return { tarih: menu.date, yedekSayfa: istenen != null && istenen !== menu.date };
}

const HARF: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

/** Aynı yemeğin adında kaynağa göre olan/olmayan genel kelimeler. */
const GENEL_KELIME = /(^|\s)(yemeği|tatlısı)(?=\s|$)/g;

/** Yazım farkları ("ayşberg" / "aysberg", "Taze Fasülye") karşılaştırmayı bozmasın. */
function sade(ad: string): string {
  return anahtar(ad)
    .replace(/\([^)]*\)/g, " ")
    .replace(GENEL_KELIME, " ")
    .replace(/[çğıöşü]/g, (harf) => HARF[harf]!);
}

/** Kelimelerin ilk dört harfi: "Tarhana Çorba" / "Tarhana çorbası", "Taze Fasülye" / "Taze fasulye yemeği". */
function yemekKoku(ad: string): string {
  return sade(ad)
    .split(/[\s+\-/,]+/)
    .filter(Boolean)
    .map((kelime) => kelime.slice(0, 4))
    .join(" ");
}

/** Boşluksuz yazım: "Etsiz kurufasulye" / "Etsiz kuru fasulye". Yalnızca kısa ek farkına izin verilir. */
function bitisik(ad: string): string {
  return sade(ad).replace(/[^\p{L}]/gu, "");
}

const EK_PAYI = 3;

function yaziEslesir(a: string, b: string): boolean {
  if (yemekKoku(a) === yemekKoku(b)) return true;
  const [kisa, uzun] = [bitisik(a), bitisik(b)].sort((x, y) => x.length - y.length) as [string, string];
  return kisa.length > 0 && uzun.startsWith(kisa) && uzun.length - kisa.length <= EK_PAYI;
}

/** "Et sote + küp patates" ile "Et sote": "+" öncesi ana yemek karşılaştırılır. */
function anaYemek(ad: string): string {
  return ad.split("+")[0]!;
}

export function ayniYemek(a: string, b: string): boolean {
  return yaziEslesir(a, b) || yaziEslesir(anaYemek(a), anaYemek(b));
}

function yemekler(ogun: Ogun): Yemek[] {
  return ogun.gruplar.flatMap((g) => g.secenekler);
}

/**
 * Gelen öğündeki her yemek mevcut öğünde var mı? kykyurtmenu zeytin, su ve
 * ekmeği çoğu zaman yazmıyor; mevcutta fazladan satır olması çelişki sayılmaz.
 * Gelende mevcutta olmayan bir yemek varsa iki kaynak farklı menü yazıyordur.
 */
export function mevcutKapsiyor(mevcut: Ogun, gelen: Ogun): boolean {
  const eldeki = yemekler(mevcut);
  return yemekler(gelen).every((y) => eldeki.some((m) => ayniYemek(m.ad, y.ad)));
}

/** Mevcut satırlara, adı eşleşen gelen yemeğin kalorisi yazılır; toplam kaynaktan gelir. */
function zenginlestir(mevcut: Ogun, gelen: Ogun): Ogun {
  const kaynak = yemekler(gelen);
  const gruplar = mevcut.gruplar.map((grup) => ({
    ...grup,
    secenekler: grup.secenekler.map((s) => {
      const kcal = kaynak.find((y) => ayniYemek(s.ad, y.ad))?.kcal;
      return kcal == null ? s : { ...s, kcal };
    }),
  }));
  return { ...mevcut, toplamKcal: gelen.toplamKcal ?? null, kcalAralik: null, gruplar };
}

function icerikAyni(a: Ogun, b: Ogun): boolean {
  const govde = ({ kaynak: _kaynak, ...geri }: Ogun) => JSON.stringify(geri);
  return govde(a) === govde(b);
}

export type OgunSonucu =
  | "eklendi"
  | "zenginlesti"
  | "degistirildi"
  /** Dosya zaten kykyurtmenu'dan; yeni ayrıştırma kuralıyla yeniden yazıldı. */
  | "yenilendi"
  /** Daha önce bu kaynaktan eklenmiş, öğüne kaynak bilgisi yazıldı. */
  | "etiketlendi"
  | "ayni"
  | "atlandi-ad-uyusmuyor"
  | "kaynakta-yok";

export interface BirlestirmeAyari {
  oncelik: Oncelik;
  /** Dosyanın genel kaynağı kykyurtmenu değilse öğüne kendi kaynağı yazılır. */
  etiketle: boolean;
}

/**
 * Kurallar:
 * - Kaynak öğünü vermediyse (aciklanmadi) mevcut kalır.
 * - Mevcut yoksa veya açıklanmadıysa gelen yazılır.
 * - Gelen yemeklerin hepsi mevcutta varsa: toplamı yazılmamış öğüne yemek başına
 *   kalori eklenir (zeytin/su gibi fazladan satırlar korunur); gerisi kalır.
 * - Gelende mevcutta olmayan yemek varsa: öncelik "yurtmenu" ise gelen yazılır,
 *   değilse mevcut kalır.
 */
export function ogunBirlestir(mevcut: Ogun | undefined, gelen: Ogun, ayar: BirlestirmeAyari): [Ogun | undefined, OgunSonucu] {
  const yeni = ayar.etiketle ? { ...gelen, kaynak: YURTMENU_KAYNAK } : gelen;
  if (gelen.durum === "aciklanmadi") return [mevcut, "kaynakta-yok"];
  if (!mevcut || mevcut.durum === "aciklanmadi") return [yeni, "eklendi"];
  if (!mevcutKapsiyor(mevcut, gelen)) {
    if (!ayar.etiketle) return [yeni, "yenilendi"];
    return ayar.oncelik === "yurtmenu" ? [yeni, "degistirildi"] : [mevcut, "atlandi-ad-uyusmuyor"];
  }
  if (mevcut.toplamKcal == null && gelen.toplamKcal != null) return [zenginlestir(mevcut, gelen), "zenginlesti"];
  if (ayar.etiketle && !mevcut.kaynak && icerikAyni(mevcut, gelen)) return [yeni, "etiketlendi"];
  return [mevcut, "ayni"];
}

export interface GunSonucu {
  gun: GunMenu | null;
  kahvalti: OgunSonucu;
  aksam: OgunSonucu;
}

export function gunuBirlestir(mevcut: GunMenu | undefined, gelen: GunMenu, ayar: BirlestirmeAyari): GunSonucu {
  const [kahvalti, kahvaltiSonucu] = ogunBirlestir(mevcut?.kahvalti, gelen.kahvalti, ayar);
  const [aksam, aksamSonucu] = ogunBirlestir(mevcut?.aksam, gelen.aksam, ayar);
  const gun = kahvalti || aksam ? { kahvalti: kahvalti ?? BOS, aksam: aksam ?? BOS } : null;
  return { gun, kahvalti: kahvaltiSonucu, aksam: aksamSonucu };
}

export const DEGISTIREN: ReadonlySet<OgunSonucu> = new Set(["eklendi", "zenginlesti", "degistirildi", "yenilendi", "etiketlendi"]);
