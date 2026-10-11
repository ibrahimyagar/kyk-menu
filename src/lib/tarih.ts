export type OgunAdi = "kahvalti" | "aksam";

export interface Acilis {
  tarih: string;
  ogun: OgunAdi;
}

function istanbulParcalari(an: Date): { yil: string; ay: string; gun: string; saat: number; dakika: number } {
  const bicim = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const harita = new Map(bicim.formatToParts(an).map((parca) => [parca.type, parca.value]));
  return {
    yil: harita.get("year") ?? "1970",
    ay: harita.get("month") ?? "01",
    gun: harita.get("day") ?? "01",
    saat: Number(harita.get("hour") ?? "0"),
    dakika: Number(harita.get("minute") ?? "0"),
  };
}

export function istanbulTarih(an: Date): string {
  const parca = istanbulParcalari(an);
  return `${parca.yil}-${parca.ay}-${parca.gun}`;
}

export function gunEkle(isoGun: string, gun: number): string {
  const [yil, ay, gunNo] = isoGun.split("-").map(Number);
  const tarih = new Date(Date.UTC(yil, ay - 1, gunNo + gun));
  return tarih.toISOString().slice(0, 10);
}

export function acilisGorunumu(an: Date): Acilis {
  const parca = istanbulParcalari(an);
  const dakika = parca.saat * 60 + parca.dakika;
  const bugun = istanbulTarih(an);
  if (dakika >= 22 * 60 + 30) return { tarih: gunEkle(bugun, 1), ogun: "kahvalti" };
  if (dakika < 12 * 60 + 30) return { tarih: bugun, ogun: "kahvalti" };
  return { tarih: bugun, ogun: "aksam" };
}

export function ayAnahtari(isoGun: string): string {
  return isoGun.slice(0, 7);
}

export function ayinGunleri(ay: string): string[] {
  const [yil, ayNo] = ay.split("-").map(Number);
  const adet = new Date(Date.UTC(yil, ayNo, 0)).getUTCDate();
  return Array.from({ length: adet }, (_, index) => `${ay}-${String(index + 1).padStart(2, "0")}`);
}

export function turkceTarih(isoGun: string): string {
  const [yil, ay, gun] = isoGun.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(yil, ay - 1, gun)));
}

/** Başlıkta büyük tarih ve altında gün adı ayrı satır olarak kullanılıyor. */
export function tarihParcalari(isoGun: string): { gunAy: string; gunAdi: string } {
  const [yil, ay, gun] = isoGun.split("-").map(Number);
  const tarih = new Date(Date.UTC(yil, ay - 1, gun));
  const bicim = (secenek: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", ...secenek }).format(tarih);
  return {
    gunAy: bicim({ day: "numeric", month: "long" }),
    gunAdi: bicim({ weekday: "long" }),
  };
}

export function kisaTarih(isoGun: string): string {
  const [yil, ay, gun] = isoGun.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(yil, ay - 1, gun)));
}

export function gunKisa(isoGun: string): { hafta: string; gun: string } {
  const [yil, ay, gun] = isoGun.split("-").map(Number);
  const tarih = new Date(Date.UTC(yil, ay - 1, gun));
  const hafta = new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: "UTC" }).format(tarih);
  return { hafta: hafta.replace(".", ""), gun: String(gun) };
}
