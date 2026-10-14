/**
 * Faz 0 kaynak yoklaması. Her adres için HTTP durumunu, son adresi ve
 * robots.txt içeriğini kaydeder. Yalnızca GET; giriş, çerez veya gizli uç
 * nokta yok. Çıktı docs/veri-kaynagi-raporu.md için ham kanıt.
 *
 * Kullanım: node scripts/kaynak-yokla.mjs > data/raw/faz0/yoklama.json
 */
const AJAN = "kyk-menu-arastirma/0.1 (+iletisim: yafestahl@gmail.com)";
const ZAMAN_ASIMI = 12000;

const adresler = [
  "https://gsb.gov.tr/",
  "https://kygm.gsb.gov.tr/",
  "https://biz.gsb.gov.tr/",
  "https://biz.gsb.gov.tr/yurtYemekTakip/",
  "https://yurtyemek.gsb.gov.tr/",
  "https://kykyemek.com/",
  "https://kykyemekliste.com/",
  "https://yurtmenu.net/",
  "https://kykmenulistesi.com.tr/",
  "https://github.com/alidnmz05/yurtmenu-public",
  "https://github.com/bulutsoft-dev/Yurtta-Ye-Mobile",
  "https://play.google.com/store/apps/details?id=com.yurt.yemek&hl=tr",
  "https://play.google.com/store/apps/details?id=com.ikarus.kykmenusu&hl=tr",
];

async function getir(adres) {
  const kontrol = new AbortController();
  const zamanlayici = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI);
  try {
    const yanit = await fetch(adres, { headers: { "User-Agent": AJAN }, redirect: "follow", signal: kontrol.signal });
    const govde = await yanit.text();
    return { durum: yanit.status, son: yanit.url, tur: yanit.headers.get("content-type"), uzunluk: govde.length, govde };
  } catch (hata) {
    return { durum: null, hata: String(hata?.cause?.code ?? hata?.name ?? hata) };
  } finally {
    clearTimeout(zamanlayici);
  }
}

const sonuclar = [];
for (const adres of adresler) {
  const sayfa = await getir(adres);
  const kok = new URL(adres).origin;
  const robots = kok.includes("github.com") || kok.includes("play.google.com") ? null : await getir(`${kok}/robots.txt`);
  sonuclar.push({
    adres,
    zaman: new Date().toISOString(),
    durum: sayfa.durum,
    son: sayfa.son,
    tur: sayfa.tur,
    uzunluk: sayfa.uzunluk,
    hata: sayfa.hata,
    robots: robots
      ? { durum: robots.durum, metin: robots.durum === 200 ? robots.govde.slice(0, 1500) : null, hata: robots.hata }
      : "atlandı (büyük platform, kendi politikası)",
  });
  await new Promise((coz) => setTimeout(coz, 1500));
}
console.log(JSON.stringify(sonuclar, null, 2));
