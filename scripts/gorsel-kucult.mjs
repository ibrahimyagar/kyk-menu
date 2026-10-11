import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import sharp from "sharp";

/**
 * Üretilen 1024 piksel kare görselleri uygulama boyutuna indirir. Ham hâlleri
 * listede 44 dp gösteriliyor; 1024 piksel bellekte görsel başına ~4 MB tutuyor
 * ve paketi gereksiz büyütüyor. Kaynak dosyalar depoya girmiyor, çıktılar girer.
 *
 * Kullanım: node scripts/gorsel-kucult.mjs <kaynak-klasor>
 */
const KENAR = 160;
const kaynakKlasor = process.argv[2];
const hedefKlasor = "assets/yemek";

if (!kaynakKlasor) {
  console.error("Kaynak klasör gerekli: node scripts/gorsel-kucult.mjs <klasor>");
  process.exit(1);
}

mkdirSync(hedefKlasor, { recursive: true });

const dosyalar = readdirSync(kaynakKlasor).filter((ad) => /^yemek-.*\.(jpg|jpeg|png)$/i.test(ad));
if (dosyalar.length === 0) {
  console.error(`${kaynakKlasor} içinde yemek-*.jpg bulunamadı`);
  process.exit(1);
}

let toplam = 0;
for (const dosya of dosyalar) {
  const hedef = join(hedefKlasor, `${basename(dosya).replace(/\.(jpg|jpeg|png)$/i, "")}.jpg`);
  await sharp(join(kaynakKlasor, dosya))
    .resize(KENAR, KENAR, { fit: "cover" })
    .jpeg({ quality: 82, chromaSubsampling: "4:4:4" })
    .toFile(hedef);
  const boyut = statSync(hedef).size;
  toplam += boyut;
  console.log(`${hedef} ${(boyut / 1024).toFixed(1)} KB`);
}
console.log(`toplam ${(toplam / 1024).toFixed(1)} KB, ${dosyalar.length} dosya`);
