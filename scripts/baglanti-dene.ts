import assert from "node:assert/strict";
import { baglantiKur } from "../src/config/baglantilar.ts";

assert.equal(baglantiKur("", { il: "İstanbul" }), null);
assert.equal(baglantiKur("   ", {}), null);

assert.equal(
  baglantiKur("https://ornek/form?entry.1={il}&entry.2={tarih}", { il: "İstanbul", tarih: "2026-10-12" }),
  "https://ornek/form?entry.1=%C4%B0stanbul&entry.2=2026-10-12",
);

// Bilinmeyen yer tutucu olduğu gibi kalır; sessizce boş değer gönderilmez.
assert.equal(baglantiKur("https://ornek/form?x={yok}", { il: "İzmir" }), "https://ornek/form?x={yok}");

// Yer tutucusuz adres aynen açılır.
assert.equal(baglantiKur("https://ornek/form", { il: "Ankara" }), "https://ornek/form");

// Boşluklu şablon kırpılır.
assert.equal(baglantiKur("  https://ornek/form  ", {}), "https://ornek/form");

console.log("baglanti gecti");
