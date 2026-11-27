import assert from "node:assert/strict";
import type { Ogun } from "../src/types/domain.ts";
import {
  ayniYemek,
  gunuBirlestir,
  kayitTarihi,
  mevcutKapsiyor,
  ogunBirlestir,
  ogunCevir,
  YURTMENU_KAYNAK,
  type DisMenu,
} from "./kykyurtmenu-birlestir.ts";

function disMenu(kalemler: [string, number | null][], toplam: number | null, ek: Partial<DisMenu> = {}): DisMenu {
  return {
    city_slug: "ankara",
    date: "2026-10-12",
    meal_type: "dinner",
    total_calories_kcal: toplam,
    status: "success",
    items: kalemler.map(([name, calories_kcal]) => ({ name, calories_kcal, choice: "single", alternatives: [] })),
    ...ek,
  };
}

function ogun(adlar: string[], ek: Partial<Ogun> = {}): Ogun {
  return { toplamKcal: null, gruplar: adlar.map((ad) => ({ baslik: null, secim: "hepsi", secenekler: [{ ad }] })), ...ek };
}

const gelen = ogunCevir(disMenu([["Mercimek çorbası", 140], ["Tavuk sote", 400]], 540));
const aralikli = ogun(["Mercimek Çorba", "Tavuk sote"], { kcalAralik: { min: 1100, max: 1500 } });
const farkli = ogun(["Ezogelin çorbası", "Kuru fasulye"], { toplamKcal: 700 });

// Yedek sayfa: 1 Ekim istendi, site 12 Ekim'i gösterdi. Kayıt 12 Ekim'e yazılır.
assert.deepEqual(kayitTarihi(disMenu([], null, { source_url: "https://kykyurtmenu.com/ankara/aksam?date=2026-10-01" })), {
  tarih: "2026-10-12",
  yedekSayfa: true,
});
assert.deepEqual(kayitTarihi(disMenu([], null, { source_url: "https://kykyurtmenu.com/ankara/aksam?date=2026-10-12" })), {
  tarih: "2026-10-12",
  yedekSayfa: false,
});
assert.equal(kayitTarihi(disMenu([], null, { date: "12.10.2026" })), null);

// "?" yer tutucu yemek olarak alınmaz.
assert.equal(ogunCevir(disMenu([["?", null], ["Haşlanmış yumurta", 70]], 70)).gruplar.length, 1);
assert.equal(ogunCevir(disMenu([["?", null]], null)).durum, "aciklanmadi");

assert.ok(mevcutKapsiyor(aralikli, gelen));
assert.ok(!mevcutKapsiyor(farkli, gelen));
// kykyurtmenu su/ekmek/zeytini ve parantez içini yazmıyor; bitişik yazım farkı çelişki değil.
assert.ok(
  mevcutKapsiyor(
    ogun(["Etsiz kuru fasulye", "Soslu karışık kızartma (kabak, patlıcan, biber)", "500 ml su", "Siyah zeytin"]),
    ogunCevir(disMenu([["Etsiz kurufasulye", 300], ["Soslu karışık kızartma", 250]], 550)),
  ),
);
assert.ok(ayniYemek("Et sote + küp patates", "Et sote"));
assert.ok(ayniYemek("Mısırlı havuçlu ayşberg salata", "Mısırlı havuçlu aysberg salata"));
assert.ok(ayniYemek("Tulumba tatlısı", "Tulumba"));
assert.ok(!ayniYemek("Sucuklu yumurta", "Sucuklu omlet"));
assert.deepEqual(
  ogunCevir({
    ...disMenu([], null),
    items: [{ name: "Meyveli", calories_kcal: null, choice: "one_of", alternatives: [{ name: "Çikolatalı yaş pasta", calories_kcal: null }] }],
  }).gruplar[0]?.secenekler.map((s) => s.ad),
  ["Meyveli yaş pasta", "Çikolatalı yaş pasta"],
);
const kisaltilmis = ogunCevir({
  ...disMenu([], null),
  items: [{ name: "Peynirli", calories_kcal: 300, choice: "one_of", alternatives: [{ name: "Ispanaklı börek", calories_kcal: 280 }] }],
});
assert.deepEqual(
  kisaltilmis.gruplar[0]?.secenekler.map((s) => s.ad),
  ["Peynirli börek", "Ispanaklı börek"],
);
// Gelende mevcutta olmayan yemek varsa çelişki.
assert.ok(!mevcutKapsiyor(ogun(["Soslu makarna"]), ogunCevir(disMenu([["Salçalı makarna", 300]], 300))));
assert.ok(!mevcutKapsiyor(ogun(["Mercimek çorbası"]), gelen));
// Kısa ek farkı dışında önek eşleşmesi sayılmaz.
assert.ok(!ayniYemek("Pilav", "Pilavüstü tavuk"));

const varsayilan = { oncelik: "mevcut", etiketle: true } as const;
const yurtmenu = { oncelik: "yurtmenu", etiketle: true } as const;

// Toplamı yazılmamış öğün, yemekler aynı: kalori eklenir, ad ve fazladan satırlar mevcut kaynaktan kalır.
const [zengin, zenginSonuc] = ogunBirlestir(aralikli, gelen, varsayilan);
assert.equal(zenginSonuc, "zenginlesti");
assert.equal(zengin?.toplamKcal, 540);
assert.equal(zengin?.kcalAralik, null);
assert.deepEqual(zengin?.gruplar[0]?.secenekler[0], { ad: "Mercimek Çorba", kcal: 140 });

// Yemekler farklı: varsayılan öncelikte ezilmez, yurtmenu önceliğinde değiştirilir ve kaynağı yazılır.
assert.deepEqual(ogunBirlestir(farkli, gelen, varsayilan), [farkli, "atlandi-ad-uyusmuyor"]);
const [degisen, degisenSonuc] = ogunBirlestir(farkli, gelen, yurtmenu);
assert.equal(degisenSonuc, "degistirildi");
assert.equal(degisen?.kaynak, YURTMENU_KAYNAK);
assert.equal(degisen?.toplamKcal, 540);

// Dosya zaten kykyurtmenu'dan geldiyse öğüne ayrıca kaynak yazılmaz.
assert.equal(ogunBirlestir(farkli, gelen, { oncelik: "yurtmenu", etiketle: false })[0]?.kaynak, undefined);

// Kaynak öğünü vermediyse mevcut kalır, kalori uydurulmaz.
const bos = ogunCevir({ ...disMenu([], null), status: "empty" });
assert.deepEqual(ogunBirlestir(farkli, bos, yurtmenu), [farkli, "kaynakta-yok"]);

// Daha önce aynı kaynaktan eklenmiş öğün yalnızca etiketlenir.
assert.equal(ogunBirlestir(gelen, gelen, yurtmenu)[1], "etiketlendi");

// İki öğün de kaynakta yoksa gün açılmaz.
assert.equal(gunuBirlestir(undefined, { kahvalti: bos, aksam: bos }, yurtmenu).gun, null);

console.log("kykyurtmenu birlestir gecti");
