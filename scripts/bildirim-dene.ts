import assert from "node:assert/strict";
import { bildirimPlani, dakikaKaydir, istanbulAni, planImzasi, saatMetni } from "../src/bildirim/plan.ts";
import type { Ogun } from "../src/types/domain.ts";

assert.equal(saatMetni(7 * 60), "07:00");
assert.equal(saatMetni(16 * 60 + 30), "16:30");
assert.equal(saatMetni(0), "00:00");

assert.equal(dakikaKaydir(0, -30), 1410);
assert.equal(dakikaKaydir(1410, 30), 0);
assert.equal(dakikaKaydir(7 * 60, 30), 7 * 60 + 30);

assert.equal(istanbulAni("2026-10-12", 16 * 60 + 30).toISOString(), "2026-10-12T13:30:00.000Z");

const dolu: Ogun = {
  toplamKcal: 600,
  gruplar: [
    { baslik: "Çorba", secim: "hepsi", secenekler: [{ ad: "Mercimek çorbası" }] },
    { baslik: "Ana yemek", secim: "biri", secenekler: [{ ad: "Tavuk pirzola" }, { ad: "Köfte" }] },
    { baslik: "Yan yemek", secim: "hepsi", secenekler: [{ ad: "Pirinç pilavı" }] },
    { baslik: "Tatlı", secim: "hepsi", secenekler: [{ ad: "Revani" }] },
  ],
};
const bos: Ogun = { durum: "aciklanmadi", toplamKcal: null, gruplar: [] };

const ayarlar = {
  kahvalti: { acik: false, dakika: 7 * 60 },
  aksam: { acik: true, dakika: 16 * 60 + 30 },
};

// 12 Ekim 09:00 +03: aynı günün akşamı dahil, 14 günün akşamı planlanır.
const plan = bildirimPlani({
  simdi: new Date("2026-10-12T09:00:00+03:00"),
  gunSayisi: 14,
  enFazla: 56,
  ayarlar,
  ogunBul: (tarih, ogun) => (ogun === "aksam" && tarih <= "2026-10-15" ? dolu : undefined),
});
assert.equal(plan.length, 4);
assert.equal(plan[0]?.kimlik, "2026-10-12:aksam");
assert.equal(plan[0]?.baslik, "Bugün akşam");
assert.equal(plan[0]?.govde, "Mercimek çorbası · Tavuk pirzola · Pirinç pilavı");
assert.deepEqual(
  plan.map((is) => is.an.getTime()),
  [...plan].sort((a, b) => a.an.getTime() - b.an.getTime()).map((is) => is.an.getTime()),
);

// Saat geçtiyse o gün atlanır.
const gecKalan = bildirimPlani({
  simdi: new Date("2026-10-12T18:00:00+03:00"),
  gunSayisi: 2,
  enFazla: 56,
  ayarlar,
  ogunBul: () => dolu,
});
assert.equal(gecKalan.length, 1);
assert.equal(gecKalan[0]?.tarih, "2026-10-13");

// Açıklanmamış öğün bildirim üretmez.
assert.equal(
  bildirimPlani({
    simdi: new Date("2026-10-12T09:00:00+03:00"),
    gunSayisi: 14,
    enFazla: 56,
    ayarlar,
    ogunBul: () => bos,
  }).length,
  0,
);

// Hepsi kapalıysa plan boş.
assert.equal(
  bildirimPlani({
    simdi: new Date("2026-10-12T09:00:00+03:00"),
    gunSayisi: 14,
    enFazla: 56,
    ayarlar: { kahvalti: { acik: false, dakika: 420 }, aksam: { acik: false, dakika: 990 } },
    ogunBul: () => dolu,
  }).length,
  0,
);

// İki öğün açıkken sınır aşılmaz ve sıra bozulmaz.
const ikili = bildirimPlani({
  simdi: new Date("2026-10-12T05:00:00+03:00"),
  gunSayisi: 14,
  enFazla: 10,
  ayarlar: { kahvalti: { acik: true, dakika: 420 }, aksam: { acik: true, dakika: 990 } },
  ogunBul: () => dolu,
});
assert.equal(ikili.length, 10);
assert.equal(ikili[0]?.ogun, "kahvalti");
assert.equal(ikili[1]?.ogun, "aksam");

assert.equal(planImzasi(plan) === planImzasi(plan), true);
assert.notEqual(planImzasi(plan), planImzasi(gecKalan));

console.log("bildirim gecti");
