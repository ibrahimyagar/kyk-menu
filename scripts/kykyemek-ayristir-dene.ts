import assert from "node:assert/strict";
import { ayDosyasiKur, htmlCoz, ogunAyristir, slashAyir, tarihCoz, yemekAdi } from "./kykyemek-ayristir.ts";

assert.equal(htmlCoz("Per&#x15F;embe"), "Perşembe");
assert.equal(yemekAdi("Haşlanmış Yumurta"), "Haşlanmış yumurta");
assert.equal(yemekAdi("500 ml Su"), "500 ml su");
assert.equal(
  yemekAdi("Hamburger (80-100 gr hamburger ekmeği içerisinde domates, marul, kornişon turşu ile)"),
  "Hamburger",
);
assert.deepEqual(slashAyir("Siyah/Yeşil Zeytin"), ["Siyah Zeytin", "Yeşil Zeytin"]);
assert.deepEqual(slashAyir("Peynirli/Ispanaklı Börek"), ["Peynirli Börek", "Ispanaklı Börek"]);
assert.deepEqual(slashAyir("Ayran/Meyve Suyu"), ["Ayran", "Meyve Suyu"]);
assert.equal(tarihCoz("1 Ekim 2026 Perşembe"), "2026-10-01");
assert.equal(tarihCoz("14 Ekim 2026 Çarşamba"), "2026-10-14");

const kahvalti = ogunAyristir(`
  <p class="text-center cardDate">1 Ekim 2026 Perşembe</p>
  <div class='card-body' id="areaone_0">
    <div>
      <p class="food-main-text">Haşlanmış Yumurta</p>
      <p class="food-main-text">Patates Kavurması</p>
      <p class="food-main-text">Karışık Pizza</p>
      <p class="food-main-text">Krem Peynir</p>
      <p class="food-main-text">Siyah/Yeşil Zeytin</p>
      <p class="fw-bold food-detail-text">500 ml Su</p>
      <p class="fw-bold food-detail-text">Çeyrek Ekmek</p>
    </div>
    <div>
      <button data-foods='[{"name":"Haşlanmış Yumurta","calori":90},{"name":"Siyah/Yeşil Zeytin","calori":40}]'>~600 kcal</button>
    </div>
  </div>
`);

assert.equal(kahvalti.durum, undefined);
assert.equal(kahvalti.toplamKcal, 600);
assert.equal(kahvalti.gruplar.length, 6);
assert.equal(kahvalti.gruplar[0].baslik, "Yumurta");
assert.equal(kahvalti.gruplar[0].secenekler[0].ad, "Haşlanmış yumurta");
assert.equal(kahvalti.gruplar[0].secenekler[0].kcal, 90);
assert.equal(kahvalti.gruplar[2].baslik, "Hamur işi");
assert.equal(kahvalti.gruplar[4].secim, "biri");
assert.deepEqual(kahvalti.gruplar[4].secenekler.map((y) => y.ad), ["Siyah zeytin", "Yeşil zeytin"]);
assert.equal(kahvalti.gruplar[4].secenekler[0].kcal, 40);
assert.equal(kahvalti.gruplar[5].baslik, "Yanında");

const aksam = ogunAyristir(`
  <p class="cardDate">1 Ekim 2026 Perşembe</p>
  <div class='card-body' id="areaone_0">
    <div>
      <p class="food-main-text">
        <span class='food-main-text'>Ezogelin Çorba</span><span class='slash-separator'>/</span><span class='food-main-text'>Mısır Çorba</span>
      </p>
      <p class="food-main-text">
        <span class='food-main-text'>Tavuk Pirzola</span><span class='food-detail-text'>+Sebze Sote</span><span class='slash-separator'>/</span><span class='food-main-text'>Soslu Karışık Kızartma</span><span class='food-detail-text'>(Kabak, Patlıcan, Biber)</span>
      </p>
      <p class="food-main-text"><span class='food-main-text'>Tereyağlı Makarna</span></p>
      <p class="food-main-text">Haydari</p>
      <p class="fw-bold food-detail-text">500 ml Su</p>
      <p class="fw-bold food-detail-text">Çeyrek Ekmek</p>
    </div>
    <div>
      <p class="text-end food-main-text">1100-1500 kcal</p>
    </div>
  </div>
`);

assert.equal(aksam.toplamKcal, null);
assert.deepEqual(aksam.kcalAralik, { min: 1100, max: 1500 });
assert.equal(aksam.gruplar[0].baslik, "Çorba");
assert.equal(aksam.gruplar[1].baslik, "Ana yemek");
assert.equal(aksam.gruplar[0].secim, "biri");
assert.deepEqual(aksam.gruplar[0].secenekler.map((y) => y.ad), ["Ezogelin çorba", "Mısır çorba"]);
assert.equal(aksam.gruplar[1].secenekler[0].ad, "Tavuk pirzola + sebze sote");
assert.equal(aksam.gruplar[1].secenekler[1].ad, "Soslu karışık kızartma (kabak, patlıcan, biber)");
assert.equal(aksam.gruplar[2].baslik, "Yan yemek");
assert.equal(aksam.gruplar[3].baslik, "Salata");
assert.equal(aksam.gruplar[3].secenekler[0].ad, "Haydari");

const bos = ogunAyristir(`<div class='card-body' id="areaone_0"><div></div></div>`);
assert.equal(bos.durum, "aciklanmadi");
assert.equal(bos.gruplar.length, 0);

const dosya = ayDosyasiKur({
  il: "ankara",
  ay: "2026-10",
  kahvalti: { "2026-10-01": kahvalti },
  aksam: { "2026-10-01": aksam },
  kaynak: "test",
  guncellenmeTarihi: "2026-10-14",
});
assert.equal(dosya.gunler["2026-10-01"].kahvalti.gruplar[0].secenekler[0].ad, "Haşlanmış yumurta");
assert.equal(dosya.gunler["2026-09-30"], undefined);

console.log("kykyemek ayristir gecti");
