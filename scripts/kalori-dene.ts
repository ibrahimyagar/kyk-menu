import assert from "node:assert/strict";
import { dilimSaydamligi, dilimToplami, grupKcal, kaloriDilimleri } from "../src/menu/kalori.ts";
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
  grup("biri", "Ana yemek", [400, 410]), // belirsiz: dilime girmez
  grup("hepsi", "Yanında", [90, 60]),
  grup("biri", null, [70, 70]),
];
const dilimler = kaloriDilimleri(gruplar);
assert.deepEqual(
  dilimler.map((dilim) => [dilim.baslik, dilim.kcal]),
  [
    ["Çorba", 120],
    ["Yanında", 150],
    ["Diğer", 70],
  ],
);
assert.equal(dilimToplami(dilimler), 340);

// Başlıktan kategori bulunuyorsa dilim o kategorinin rengini taşır.
assert.equal(dilimler[0]?.kategori?.kimlik, "corba");
assert.equal(dilimler[1]?.kategori?.kimlik, "ekmekSu");
// Başlığı ve adı tanınmayan grup kategorisiz kalır; uydurma görsel çizilmez.
assert.equal(dilimler[2]?.kategori, null);

// Kalorisi hiç olmayan ay: şerit çizilmez, tahmin üretilmez.
assert.deepEqual(kaloriDilimleri([grup("biri", "Çorba", [undefined, undefined])]), []);
assert.equal(dilimToplami([]), 0);

// Tonlar: ilk dilim tam doygun, son dilim en soluk, sıra bozulmaz.
assert.equal(dilimSaydamligi(0, 1), 1);
assert.equal(dilimSaydamligi(0, 4), 1);
assert.equal(Number(dilimSaydamligi(3, 4).toFixed(2)), 0.45);
assert.ok(dilimSaydamligi(1, 4) > dilimSaydamligi(2, 4));

console.log("kalori gecti");
