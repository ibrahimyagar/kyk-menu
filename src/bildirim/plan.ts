import { gunEkle, istanbulTarih, type OgunAdi } from "../lib/tarih";
import { ogunOzeti, ogunVar } from "../menu/ozet";
import type { Ogun } from "../types/domain";

/** Gün içi dakika (0–1439) olarak hatırlatma saati. */
export interface BildirimAyari {
  acik: boolean;
  dakika: number;
}

export interface BildirimIsi {
  kimlik: string;
  tarih: string;
  ogun: OgunAdi;
  an: Date;
  baslik: string;
  govde: string;
}

export const OGUN_SIRASI: readonly OgunAdi[] = ["kahvalti", "aksam"];

const baslikMetni: Record<OgunAdi, string> = {
  kahvalti: "Bugün kahvaltı",
  aksam: "Bugün akşam",
};

export function saatMetni(dakika: number): string {
  const saat = Math.floor(dakika / 60);
  const kalan = dakika % 60;
  return `${String(saat).padStart(2, "0")}:${String(kalan).padStart(2, "0")}`;
}

export function dakikaKaydir(dakika: number, adim: number): number {
  const toplam = ((dakika + adim) % 1440 + 1440) % 1440;
  return toplam;
}

/**
 * Türkiye 2016'dan beri kalıcı +03 kullanıyor; tetikleme anı bu sabit farkla kuruluyor.
 * Böylece cihazın saat dilimi değişse de bildirim İstanbul saatine göre düşer.
 */
export function istanbulAni(tarih: string, dakika: number): Date {
  return new Date(`${tarih}T${saatMetni(dakika)}:00+03:00`);
}

export function bildirimPlani(girdi: {
  simdi: Date;
  gunSayisi: number;
  enFazla: number;
  ayarlar: Record<OgunAdi, BildirimAyari>;
  ogunBul: (tarih: string, ogun: OgunAdi) => Ogun | undefined;
}): BildirimIsi[] {
  const { simdi, gunSayisi, enFazla, ayarlar, ogunBul } = girdi;
  if (!OGUN_SIRASI.some((ogun) => ayarlar[ogun].acik)) return [];

  const bugun = istanbulTarih(simdi);
  const isler: BildirimIsi[] = [];

  for (let gun = 0; gun < gunSayisi; gun += 1) {
    const tarih = gunEkle(bugun, gun);
    for (const ogun of OGUN_SIRASI) {
      const ayar = ayarlar[ogun];
      if (!ayar.acik) continue;
      const an = istanbulAni(tarih, ayar.dakika);
      if (an.getTime() <= simdi.getTime()) continue;
      const kayit = ogunBul(tarih, ogun);
      if (!ogunVar(kayit)) continue;
      isler.push({
        kimlik: `${tarih}:${ogun}`,
        tarih,
        ogun,
        an,
        baslik: baslikMetni[ogun],
        govde: ogunOzeti(kayit),
      });
    }
  }

  isler.sort((a, b) => a.an.getTime() - b.an.getTime());
  return isler.slice(0, enFazla);
}

/** Aynı planı tekrar kurmamak için içerik imzası. */
export function planImzasi(isler: BildirimIsi[]): string {
  return isler.map((is) => `${is.kimlik}@${is.an.toISOString()}|${is.govde}`).join(";");
}
