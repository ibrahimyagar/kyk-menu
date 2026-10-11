import assert from "node:assert/strict";
import {
  baglantiKur,
  hataliMenuAdresi,
  ILETISIM_EPOSTA,
  mailtoKur,
  menuGonderAdresi,
  sehirTalebiMektubu,
} from "../src/config/baglantilar.ts";

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

// E-posta adresi tanımlı olduğu sürece üç geri bildirim yolu da açık olmalı.
assert.ok(ILETISIM_EPOSTA.trim(), "iletisim e-postasi tanimsiz");

const mektup = mailtoKur("Konu & test", "satır 1\nsatır 2");
assert.ok(mektup?.startsWith(`mailto:${ILETISIM_EPOSTA}?subject=`));
assert.ok(mektup?.includes("Konu%20%26%20test"));
assert.ok(mektup?.includes("sat%C4%B1r%201%0Asat%C4%B1r%202"));

const hatali = hataliMenuAdresi("İstanbul", "2026-10-12", "Akşam yemeği", "Çorba: Mercimek");
assert.ok(hatali?.startsWith("mailto:"), "form yokken e-posta yolu acik olmali");
assert.ok(hatali?.includes(encodeURIComponent("Çorba: Mercimek")), "govdede gorunen menu olmali");
assert.ok(hatali?.includes(encodeURIComponent("2026-10-12")));

// Aranan şehir yazılmamışsa konu sabit kalır, gövde kullanıcıyı yönlendirir.
assert.ok(sehirTalebiMektubu("")?.includes(encodeURIComponent("Şehir talebi")));
assert.ok(sehirTalebiMektubu("Rize")?.includes(encodeURIComponent("Şehir talebi: Rize")));

assert.ok(menuGonderAdresi("İstanbul")?.includes(encodeURIComponent("Menü gönderimi: İstanbul")));

// Takma ad varsa imza satırı eklenir, yoksa gövde değişmez.
assert.ok(menuGonderAdresi("İstanbul", "Yafes")?.includes(encodeURIComponent("-- Yafes")));
assert.ok(!menuGonderAdresi("İstanbul", "   ")?.includes(encodeURIComponent("--")));
assert.equal(menuGonderAdresi("İstanbul"), menuGonderAdresi("İstanbul", ""));

console.log("baglanti gecti");
