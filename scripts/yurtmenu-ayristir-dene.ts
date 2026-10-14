import assert from "node:assert/strict";
import { satirCoz, yurtmenuKayitVar, yurtmenuOgun } from "./yurtmenu-ayristir.ts";

const zeytin = satirCoz("Siyah veya yeşil zeytin ~56 kcal");
assert.equal(zeytin.secim, "biri");
assert.deepEqual(zeytin.secenekler.map((y) => y.ad), ["Siyah zeytin", "Yeşil zeytin"]);
assert.equal(zeytin.secenekler[0].kcal, 56);

const uc = satirCoz("Et veya tavuk hamburger veya biber dolma ~326 kcal");
assert.equal(uc.secenekler.length, 3);
assert.equal(uc.secenekler[2].ad, "Biber dolma");

const html = `
  <div class="menu-card breakfast-card">
    <ul id="breakfast-menu" class="menu-items">
      <li class="menu-item"><span class="menu-item-name">Menemen</span></li>
      <li class="menu-item"><span class="menu-item-name">Salçalı Sosis</span></li>
      <li class="menu-item"><span class="menu-item-name">Siyah/Yeşil Zeytin</span></li>
      <li class="menu-item"><span class="menu-item-name">200 ml Bardak Su</span></li>
      <li class="menu-item"><span class="menu-item-name">Çeyrek Ekmek</span></li>
      <li class="menu-item"><span class="menu-item-name">Al Götür Menü</span></li>
    </ul>
  </div>
  <div class="menu-card dinner-card">
    <ul id="dinner-menu" class="menu-items">
      <li class="menu-item"><span class="menu-item-name">Yayla Çorbası/Arabaşı Çorba</span></li>
      <li class="menu-item"><span class="menu-item-name">Kuru Fasulye</span></li>
      <li class="menu-item"><span class="menu-item-name">Şehriyeli Pirinç Pilavı</span></li>
    </ul>
  </div>
`;

assert.equal(yurtmenuKayitVar(html), true);
const kahvalti = yurtmenuOgun(html, "breakfast");
assert.equal(kahvalti.durum, undefined);
assert.equal(kahvalti.gruplar[0].baslik, "Yumurta");
assert.equal(kahvalti.gruplar[2].secim, "biri");
assert.deepEqual(kahvalti.gruplar[2].secenekler.map((y) => y.ad), ["Siyah zeytin", "Yeşil zeytin"]);
assert.equal(kahvalti.gruplar.at(-2)?.baslik, "Al götür");
assert.equal(kahvalti.gruplar.at(-1)?.baslik, "Yanında");

const aksam = yurtmenuOgun(html, "dinner");
assert.equal(aksam.gruplar[0].baslik, "Çorba");
assert.deepEqual(aksam.gruplar[0].secenekler.map((y) => y.ad), ["Yayla çorbası", "Arabaşı çorba"]);
assert.equal(aksam.gruplar[2].baslik, "Yan yemek");

const bos = `<p>Bu tarih için menü kaydı bulunamadı.</p><div class="menu-card breakfast-card"><ul class="menu-items"><li class="menu-item"><span class="menu-item-name">Veri yok.</span></li></ul></div>`;
assert.equal(yurtmenuKayitVar(bos), false);
assert.equal(yurtmenuOgun(bos, "breakfast").durum, "aciklanmadi");

console.log("yurtmenu ayristir gecti");
