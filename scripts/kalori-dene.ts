import assert from "node:assert/strict";
import { dilimSaydamligi, dilimToplami, grupKcal, kaloriDilimleri, ogunKaloriOzeti } from "../src/menu/kalori.ts";
import type { Grup } from "../src/types/domain.ts";

function grup(secim: Grup["secim"], baslik: string | null, kcaller: (number | undefined)[]): Grup {
  return {
    baslik,
    secim,
    secenekler: kcaller.map((kcal, sira) => ({ ad: `yemek ${sira}`, kcal })),
  };
}

// "biri": seçenekler aynı değeri taşır, o değer grubun kalorisidir.
assert.equal(grupKcal(grup("biri", "Ana yemek", [320, 320])), 320);
// Çelişkili değerlerde sayı uydurulmaz.
assert.equal(grupKcal(grup("biri", "Ana yemek", [320, 410])), null);
// Tek eksik değer tüm grubu belirsiz yapar.
assert.equal(grupKcal(grup("biri", "Ana yemek", [320, undefined])), null);
// "hepsi": porsiyonlar birlikte verildiği için toplanır.
assert.equal(grupKcal(grup("hepsi", "Yanında", [120, 80])), 200);
assert.equal(grupKcal(grup("hepsi", "Yanında", [])), null);

const gruplar = [
  grup("biri", "Çorba", [120, 120]),
  grup("biri", "Ana yemek", [400, 410]), // seçenekler farklı: ilk seçenek + aralık
  grup("biri", "Tatlı", [300, undefined]), // biri eksik: dilime girmez
  grup("hepsi", "Yanında", [90, 60]),
  grup("biri", null, [70, 70]),
];
const dilimler = kaloriDilimleri(gruplar);
assert.deepEqual(
  dilimler.map((dilim) => [dilim.baslik, dilim.kcal, dilim.aralik]),
  [
    ["Çorba", 120, null],
    ["Ana yemek", 400, { min: 400, max: 410 }],
    ["Yanında", 150, null],
    ["Diğer", 70, null],
  ],
);
assert.equal(dilimToplami(dilimler), 740);
// Aralıklı grup varken kaynak toplamı yoksa "toplam" uydurulmaz.
assert.equal(ogunKaloriOzeti({ toplamKcal: null, gruplar }).toplam, null);

// Başlıktan kategori bulunuyorsa dilim o kategorinin rengini taşır.
assert.equal(dilimler[0]?.kategori?.kimlik, "corba");
assert.equal(dilimler[2]?.kategori?.kimlik, "ekmekSu");
// Başlığı ve adı tanınmayan grup kategorisiz kalır; uydurma görsel çizilmez.
assert.equal(dilimler[3]?.kategori, null);

// Kalorisi hiç olmayan ay: şerit çizilmez, tahmin üretilmez.
assert.deepEqual(kaloriDilimleri([grup("biri", "Çorba", [undefined, undefined])]), []);
assert.equal(dilimToplami([]), 0);

// Tonlar: ilk dilim tam doygun, son dilim en soluk, sıra bozulmaz.
assert.equal(dilimSaydamligi(0, 1), 1);
assert.equal(dilimSaydamligi(0, 4), 1);
assert.equal(Number(dilimSaydamligi(3, 4).toFixed(2)), 0.45);
assert.ok(dilimSaydamligi(1, 4) > dilimSaydamligi(2, 4));

// Eksik satır toplanıp "toplam" diye yazılmaz.
const eksikToplam = ogunKaloriOzeti({
  toplamKcal: null,
  gruplar: [grup("biri", "Çorba", [120, 120]), grup("hepsi", "Yanında", [undefined])],
});
assert.equal(eksikToplam.toplam, null);
assert.equal(eksikToplam.dilimler.length, 1);

const kaynakToplam = ogunKaloriOzeti({
  toplamKcal: 600,
  gruplar: [grup("biri", "Çorba", [120, 120]), grup("hepsi", "Yanında", [undefined])],
});
assert.equal(kaynakToplam.toplam, 600);

const aralik = ogunKaloriOzeti({
  toplamKcal: null,
  kcalAralik: { min: 1100, max: 1500 },
  gruplar: [grup("biri", "Çorba", [undefined])],
});
assert.deepEqual(aralik.aralik, { min: 1100, max: 1500 });
assert.equal(aralik.toplam, null);

console.log("kalori gecti");
