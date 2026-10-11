import assert from "node:assert/strict";
import { acilisGorunumu, ayAnahtari, ayinGunleri, gunEkle, tarihParcalari } from "../src/lib/tarih.ts";

const sabah = acilisGorunumu(new Date("2026-10-01T06:00:00+03:00"));
assert.equal(sabah.tarih, "2026-10-01");
assert.equal(sabah.ogun, "kahvalti");

const sinirOncesi = acilisGorunumu(new Date("2026-10-01T12:29:00+03:00"));
assert.equal(sinirOncesi.ogun, "kahvalti");

const sinir = acilisGorunumu(new Date("2026-10-01T12:30:00+03:00"));
assert.equal(sinir.tarih, "2026-10-01");
assert.equal(sinir.ogun, "aksam");

const gece = acilisGorunumu(new Date("2026-10-01T23:00:00+03:00"));
assert.equal(gece.tarih, "2026-10-02");
assert.equal(gece.ogun, "kahvalti");

// Ay sonu geçişi: 31 Ekim gece yarısından önce ertesi ayın kahvaltısına geçer.
const aySonu = acilisGorunumu(new Date("2026-10-31T23:00:00+03:00"));
assert.equal(aySonu.tarih, "2026-11-01");
assert.equal(ayAnahtari(aySonu.tarih), "2026-11");

// Cihaz saat dilimi başka olsa da "bugün" İstanbul'a göre hesaplanır.
// 31 Ekim 23:00 +03 anı Londra'da 20:00, Tokyo'da 1 Kasım 05:00.
const ayniAn = new Date("2026-10-31T20:00:00Z");
assert.equal(acilisGorunumu(ayniAn).tarih, "2026-11-01");

assert.equal(ayinGunleri("2026-11").length, 30);
assert.equal(ayinGunleri("2026-02").length, 28);
assert.equal(ayinGunleri("2028-02").length, 29);
assert.equal(ayinGunleri("2026-12").at(-1), "2026-12-31");

assert.equal(gunEkle("2026-12-31", 1), "2027-01-01");
assert.equal(gunEkle("2027-01-01", -1), "2026-12-31");

// Başlık iki parçaya bölünüyor: büyük "28 Ekim", altında "Çarşamba".
assert.deepEqual(tarihParcalari("2026-10-28"), { gunAy: "28 Ekim", gunAdi: "Çarşamba" });
assert.deepEqual(tarihParcalari("2026-01-01"), { gunAy: "1 Ocak", gunAdi: "Perşembe" });

console.log("tarih gecti");
