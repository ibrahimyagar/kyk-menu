import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { kategoriBul, KATEGORILER } from "../src/menu/kategori.ts";
import type { Grup, MenuDosyasi } from "../src/types/domain.ts";

function grup(baslik: string | null, adlar: string[]): Grup {
  return { baslik, secim: "biri", secenekler: adlar.map((ad) => ({ ad })) };
}

// Başlık doğrudan eşleşiyor.
assert.equal(kategoriBul(grup("Çorba", ["Mercimek çorbası"]))?.kimlik, "corba");
assert.equal(kategoriBul(grup("Hamur işi", ["Simit"]))?.kimlik, "hamurIsi");
// Büyük/küçük harf ve boşluk farkı sorun olmamalı.
assert.equal(kategoriBul(grup("  ÇORBA ", ["Ezogelin"]))?.kimlik, "corba");
// "Ek" grubu kase görseline düşüyor.
assert.equal(kategoriBul(grup("Ek", ["Turşu"]))?.kimlik, "salata");

// Başlık yoksa yemek adındaki anahtar kelime.
assert.equal(kategoriBul(grup(null, ["Pirinç pilavı"]))?.kimlik, "pilav");
assert.equal(kategoriBul(grup(null, ["Sade omlet"]))?.kimlik, "yumurta");
assert.equal(kategoriBul(grup(null, ["Ayran"]))?.kimlik, "icecek");
// "fasulye" içindeki "su" ekmek-su sayılmaz; garnitür ana yemeği ezmez.
assert.equal(kategoriBul(grup(null, ["Zeytinyağlı taze fasulye"]))?.kimlik, "anaYemek");
assert.equal(kategoriBul(grup(null, ["Tavuk pirzola + patates kızartma"]))?.kimlik, "anaYemek");
assert.equal(kategoriBul(grup(null, ["Soslu pideli köfte", "Mevsim türlü"]))?.kimlik, "anaYemek");
assert.equal(kategoriBul(grup(null, ["Karnabahar kızartması + yoğurt"]))?.kimlik, "kizartma");
assert.equal(kategoriBul(grup(null, ["Sucuklu yumurta"]))?.kimlik, "yumurta");
assert.equal(kategoriBul(grup(null, ["500 ml su"]))?.kimlik, "ekmekSu");

// Hiçbir kurala uymayan grup kategorisiz kalır; görsel uydurulmaz.
assert.equal(kategoriBul(grup(null, ["Tanımsız bir şey"])), null);
assert.equal(kategoriBul(grup("Bilinmeyen başlık", ["Tanımsız bir şey"])), null);

// Gerçek veride her grup bir kategoriye düşmeli; düşmezse boş kare çıkar.
const dosyalar = ["data/menus/istanbul/2026-09.json", "data/menus/istanbul/2026-10.json"];
const eksik = new Set<string>();
let sayac = 0;
for (const yol of dosyalar) {
  const veri = JSON.parse(readFileSync(yol, "utf8")) as MenuDosyasi;
  for (const gunMenu of Object.values(veri.gunler)) {
    for (const ogun of Object.values(gunMenu)) {
      for (const g of ogun.gruplar ?? []) {
        sayac += 1;
        if (!kategoriBul(g)) eksik.add(g.baslik ?? g.secenekler[0]?.ad ?? "?");
      }
    }
  }
}
assert.ok(sayac > 0, "veri okunamadi");
assert.deepEqual([...eksik], [], "kategorisi bulunamayan gruplar var");

// Her kategorinin rengi tanımlı ve altı haneli hex olmalı.
for (const kategori of Object.values(KATEGORILER)) {
  assert.match(kategori.renk, /^#[0-9A-F]{6}$/i, `${kategori.kimlik} rengi hatalı`);
}

console.log(`kategori gecti (${sayac} grup)`);
