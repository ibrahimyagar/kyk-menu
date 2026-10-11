import assert from "node:assert/strict";
import { acilisGorunumu } from "../src/lib/tarih.ts";

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

console.log("tarih gecti");
