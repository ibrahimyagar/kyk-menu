import assert from "node:assert/strict";
import { selamlama } from "../src/lib/selam.ts";

assert.equal(selamlama("kahvalti", ""), "Günaydın");
assert.equal(selamlama("aksam", ""), "İyi akşamlar");
assert.equal(selamlama("kahvalti", "Yafes"), "Günaydın, Yafes");
// Boşluk kırpılır, böylece "Günaydın,  " gibi bir metin çıkmaz.
assert.equal(selamlama("aksam", "   "), "İyi akşamlar");
assert.equal(selamlama("aksam", "  Ayşe "), "İyi akşamlar, Ayşe");

console.log("selam gecti");
