import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { dilimToplami, kaloriDilimleri } from "../src/menu/kalori.ts";

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const menuKok = path.join(kok, "data", "menus");

const secenekSemasi = z.object({
  ad: z.string(),
  kcal: z.number().optional(),
});

const grupSemasi = z.object({
  baslik: z.string().nullable(),
  secim: z.enum(["biri", "hepsi"]),
  secenekler: z.array(secenekSemasi).min(1),
});

const ogunSemasi = z.object({
  // aciklanmadi: kaynak "menü henüz açıklanmadı" diyorsa. Yemek uydurulmaz, gruplar boş kalır.
  durum: z.enum(["var", "aciklanmadi"]).optional(),
  toplamKcal: z.number().nullable().optional(),
  kcalAralik: z
    .object({
      min: z.number().int().min(0).max(4000),
      max: z.number().int().min(0).max(4000),
    })
    .nullable()
    .optional(),
  kaynak: z.string().min(1).optional(),
  gruplar: z.array(grupSemasi),
});

const dosyaSemasi = z.object({
  sema: z.literal(1),
  il: z.string().min(1),
  ay: z.string().regex(/^\d{4}-\d{2}$/),
  surum: z.number().int().positive(),
  kaynak: z.string().min(1),
  guncellenmeTarihi: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gunler: z.record(
    z.string(),
    z.object({
      kahvalti: ogunSemasi,
      aksam: ogunSemasi,
    }),
  ),
});

const adDeseni = /^[\p{L}\p{N} +,.()\-/']+$/u;

type Hata = { dosya: string; mesaj: string };
type Uyari = { dosya: string; mesaj: string };

const hatalar: Hata[] = [];
const uyarilar: Uyari[] = [];

function hata(dosya: string, mesaj: string) {
  hatalar.push({ dosya, mesaj });
}

function uyari(dosya: string, mesaj: string) {
  uyarilar.push({ dosya, mesaj });
}

function ayinGunSayisi(ay: string): number {
  const [yil, ayNo] = ay.split("-").map(Number);
  return new Date(Date.UTC(yil, ayNo, 0)).getUTCDate();
}

function gecerliGun(ay: string, gun: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gun) || !gun.startsWith(`${ay}-`)) return false;
  const gunNo = Number(gun.slice(8));
  return gunNo >= 1 && gunNo <= ayinGunSayisi(ay);
}

function yemekAdlari(gunler: z.infer<typeof dosyaSemasi>["gunler"]): Set<string> {
  const adlar = new Set<string>();
  for (const gun of Object.values(gunler)) {
    for (const ogun of [gun.kahvalti, gun.aksam]) {
      for (const grup of ogun.gruplar) {
        for (const secenek of grup.secenekler) {
          adlar.add(secenek.ad.toLocaleLowerCase("tr-TR"));
        }
      }
    }
  }
  return adlar;
}

async function surumKontrol(dosya: string, veri: z.infer<typeof dosyaSemasi>) {
  const yayin = path.join(kok, "publish", "v1", "menu", veri.il, `${veri.ay}.json`);
  let ham: string;
  try {
    ham = await readFile(yayin, "utf8");
  } catch {
    return;
  }
  let yayinVeri: z.infer<typeof dosyaSemasi>;
  try {
    yayinVeri = dosyaSemasi.parse(JSON.parse(ham));
  } catch {
    return;
  }
  if (JSON.stringify(veri) === JSON.stringify(yayinVeri)) return;
  if (veri.surum <= yayinVeri.surum) {
    hata(dosya, `içerik değişti, surum (${veri.surum}) yayındaki sürümden büyük değil (${yayinVeri.surum})`);
  }
}

async function oncekiAyDosyasi(il: string, ay: string): Promise<string | null> {
  const [yil, ayNo] = ay.split("-").map(Number);
  const tarih = new Date(Date.UTC(yil, ayNo - 2, 1));
  const onceki = `${tarih.getUTCFullYear()}-${String(tarih.getUTCMonth() + 1).padStart(2, "0")}`;
  const dosya = path.join(menuKok, il, `${onceki}.json`);
  try {
    await readFile(dosya, "utf8");
    return dosya;
  } catch {
    return null;
  }
}

function ogunKontrol(dosya: string, gun: string, ad: string, ogun: z.infer<typeof ogunSemasi>) {
  if (ogun.durum === "aciklanmadi") {
    if (ogun.gruplar.length > 0) {
      hata(dosya, `${gun} ${ad}: açıklanmayan öğüne yemek yazılmış`);
    }
    if (ogun.toplamKcal != null) {
      hata(dosya, `${gun} ${ad}: açıklanmayan öğünün toplam kalorisi olamaz`);
    }
    if (ogun.kcalAralik != null) {
      hata(dosya, `${gun} ${ad}: açıklanmayan öğünün kalori aralığı olamaz`);
    }
    return;
  }
  if (ogun.gruplar.length < 1) {
    hata(dosya, `${gun} ${ad}: en az 1 grup gerekli`);
  }
  // 0–2000 sınırı yemek kcal'i içindir. Öğün toplamı al-götür satırıyla 2000'i geçebilir.
  if (ogun.toplamKcal != null && (ogun.toplamKcal < 0 || ogun.toplamKcal > 4000)) {
    hata(dosya, `${gun} ${ad}: toplamKcal aralık dışında (${ogun.toplamKcal})`);
  }
  if (ogun.kcalAralik && ogun.kcalAralik.min > ogun.kcalAralik.max) {
    hata(dosya, `${gun} ${ad}: kcalAralik min, max'tan büyük`);
  }
  const satirlardan = dilimToplami(kaloriDilimleri(ogun.gruplar));
  if (ogun.toplamKcal != null && satirlardan > 0 && satirlardan !== ogun.toplamKcal) {
    uyari(dosya, `${gun} ${ad}: kaynak toplam ${ogun.toplamKcal} kcal, satırların toplamı ${satirlardan}`);
  }
  for (const grup of ogun.gruplar) {
    if (grup.secenekler.length < 1) {
      hata(dosya, `${gun} ${ad}: boş grup`);
    }
    for (const secenek of grup.secenekler) {
      const yemek = secenek.ad.trim();
      if (!yemek) hata(dosya, `${gun} ${ad}: boş yemek adı`);
      if (yemek.length > 80) hata(dosya, `${gun} ${ad}: yemek adı 80 karakteri aşıyor (${yemek})`);
      if (yemek && !adDeseni.test(yemek)) {
        hata(dosya, `${gun} ${ad}: garip karakter (${yemek})`);
      }
      if (secenek.kcal != null && (secenek.kcal < 0 || secenek.kcal > 2000)) {
        hata(dosya, `${gun} ${ad}: kcal aralık dışında (${yemek}: ${secenek.kcal})`);
      }
    }
  }
}

async function dosyayiDenetle(dosyaYolu: string) {
  const goreli = path.relative(kok, dosyaYolu);
  let ham: string;
  try {
    ham = await readFile(dosyaYolu, "utf8");
  } catch (err) {
    hata(goreli, `okunamadı: ${(err as Error).message}`);
    return;
  }

  let json: unknown;
  try {
    json = JSON.parse(ham);
  } catch (err) {
    hata(goreli, `JSON değil: ${(err as Error).message}`);
    return;
  }

  const sonuc = dosyaSemasi.safeParse(json);
  if (!sonuc.success) {
    for (const issue of sonuc.error.issues) {
      hata(goreli, `${issue.path.join(".") || "(kök)"}: ${issue.message}`);
    }
    return;
  }

  const veri = sonuc.data;
  const parcalar = path.relative(menuKok, dosyaYolu).split(path.sep);
  const klasorIl = parcalar[0];
  const dosyaAy = path.basename(dosyaYolu, ".json");
  if (veri.il !== klasorIl) hata(goreli, `il alanı klasörle uyuşmuyor (${veri.il} / ${klasorIl})`);
  if (veri.ay !== dosyaAy) hata(goreli, `ay alanı dosya adıyla uyuşmuyor (${veri.ay} / ${dosyaAy})`);

  await surumKontrol(goreli, veri);

  const gunSayisi = ayinGunSayisi(veri.ay);
  const gorulen = new Set<string>();
  for (const gun of Object.keys(veri.gunler)) {
    if (!gecerliGun(veri.ay, gun)) {
      hata(goreli, `geçersiz gün anahtarı: ${gun}`);
      continue;
    }
    gorulen.add(gun);
    const kayit = veri.gunler[gun];
    ogunKontrol(goreli, gun, "kahvaltı", kayit.kahvalti);
    ogunKontrol(goreli, gun, "akşam", kayit.aksam);
  }

  for (let i = 1; i <= gunSayisi; i += 1) {
    const anahtar = `${veri.ay}-${String(i).padStart(2, "0")}`;
    if (!gorulen.has(anahtar)) uyari(goreli, `eksik gün: ${anahtar}`);
  }

  const onceki = await oncekiAyDosyasi(veri.il, veri.ay);
  if (onceki) {
    try {
      const oncekiVeri = dosyaSemasi.parse(JSON.parse(await readFile(onceki, "utf8")));
      const simdi = yemekAdlari(veri.gunler);
      const eski = yemekAdlari(oncekiVeri.gunler);
      const kesisim = [...simdi].filter((ad) => eski.has(ad)).length;
      const birlesim = new Set([...simdi, ...eski]).size;
      const benzerlik = birlesim === 0 ? 0 : kesisim / birlesim;
      if (benzerlik === 1) uyari(goreli, "önceki ayla yemek listesi tamamen aynı");
      else if (benzerlik >= 0.9) uyari(goreli, `önceki ayla aşırı benzer (oran ${benzerlik.toFixed(2)})`);
    } catch {
      uyari(goreli, "önceki ay dosyası karşılaştırılamadı");
    }
  }
}

async function menuDosyalari(): Promise<string[]> {
  const iller = await readdir(menuKok, { withFileTypes: true });
  const dosyalar: string[] = [];
  for (const il of iller) {
    if (!il.isDirectory()) continue;
    const icerik = await readdir(path.join(menuKok, il.name));
    for (const ad of icerik) {
      if (ad.endsWith(".json")) dosyalar.push(path.join(menuKok, il.name, ad));
    }
  }
  return dosyalar;
}

const dosyalar = await menuDosyalari();
if (dosyalar.length === 0) {
  console.error("data/menus altında JSON yok.");
  process.exit(1);
}

for (const dosya of dosyalar) await dosyayiDenetle(dosya);

for (const satir of uyarilar) console.log(`UYARI  ${satir.dosya}: ${satir.mesaj}`);
for (const satir of hatalar) console.error(`HATA   ${satir.dosya}: ${satir.mesaj}`);

if (hatalar.length > 0) {
  console.error(`\n${hatalar.length} hata, ${uyarilar.length} uyarı.`);
  process.exit(1);
}

console.log(`Geçti. ${dosyalar.length} dosya, ${uyarilar.length} uyarı.`);
