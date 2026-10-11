import assert from "node:assert/strict";
import { dahaGuncel, dahaYeni, ertesiAyOndalik, menuDosyasiMi, menuGorunumu } from "../src/menu/karar.ts";
import type { MenuDosyasi } from "../src/types/domain.ts";

function dosya(surum: number): MenuDosyasi {
  return {
    sema: 1,
    il: "istanbul",
    ay: "2026-10",
    surum,
    kaynak: "deneme",
    guncellenmeTarihi: "2026-10-01",
    gunler: {},
  };
}

const ayni = dosya(1);
const yeni = dosya(2);
assert.equal(dahaGuncel(ayni, dosya(1)), ayni);
assert.equal(dahaGuncel(yeni, dosya(1)), yeni);
assert.equal(dahaGuncel(dosya(1), yeni)?.surum, 2);
assert.equal(dahaGuncel(null, null), null);

assert.equal(dahaYeni(1, 1), false);
assert.equal(dahaYeni(1, 2), true);
assert.equal(dahaYeni(null, 1), true);
assert.equal(dahaYeni(1, undefined), false);

assert.equal(ertesiAyOndalik("2026-10-24"), null);
assert.equal(ertesiAyOndalik("2026-10-25"), "2026-11");
assert.equal(ertesiAyOndalik("2026-10-31"), "2026-11");
assert.equal(ertesiAyOndalik("2026-09-23"), null);
assert.equal(ertesiAyOndalik("2026-09-24"), "2026-10");
assert.equal(ertesiAyOndalik("2026-02-21"), null);
assert.equal(ertesiAyOndalik("2026-02-22"), "2026-03");

assert.equal(menuDosyasiMi(dosya(1)), true);
assert.equal(menuDosyasiMi({ sema: 1 }), false);

assert.equal(
  menuGorunumu({
    dosyaVar: true,
    ilBiliniyor: true,
    ayBiliniyor: true,
    yayinVar: true,
    manifestHazir: false,
    agKesik: true,
    istekVar: false,
    onbellekHazir: true,
  }),
  "menu",
);

assert.equal(
  menuGorunumu({
    dosyaVar: false,
    ilBiliniyor: false,
    ayBiliniyor: false,
    yayinVar: false,
    manifestHazir: false,
    agKesik: false,
    istekVar: false,
    onbellekHazir: false,
  }),
  "bekliyor",
);

assert.equal(
  menuGorunumu({
    dosyaVar: false,
    ilBiliniyor: false,
    ayBiliniyor: false,
    yayinVar: false,
    manifestHazir: false,
    agKesik: false,
    istekVar: false,
    onbellekHazir: true,
  }),
  "il-yok",
);

assert.equal(
  menuGorunumu({
    dosyaVar: false,
    ilBiliniyor: true,
    ayBiliniyor: false,
    yayinVar: false,
    manifestHazir: false,
    agKesik: false,
    istekVar: false,
    onbellekHazir: true,
  }),
  "ay-yok",
);

assert.equal(
  menuGorunumu({
    dosyaVar: false,
    ilBiliniyor: false,
    ayBiliniyor: false,
    yayinVar: true,
    manifestHazir: false,
    agKesik: true,
    istekVar: false,
    onbellekHazir: true,
  }),
  "internet",
);

console.log("menu karar gecti");
