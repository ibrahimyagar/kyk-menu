import { Image, View } from "react-native";
import type { Kategori, KategoriKimlik } from "../menu/kategori";
import { yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";

/* Metro statik yol ister; harita bu yüzden elle yazılı. Görseller 160 piksele
   küçültülmüş (scripts/gorsel-kucult.mjs), toplam 46 KB. */
const gorseller: Record<KategoriKimlik, number> = {
  corba: require("../../assets/yemek/yemek-corba.jpg"),
  anaYemek: require("../../assets/yemek/yemek-ana-yemek.jpg"),
  pilav: require("../../assets/yemek/yemek-pilav.jpg"),
  salata: require("../../assets/yemek/yemek-salata.jpg"),
  ekmekSu: require("../../assets/yemek/yemek-ekmek-su.jpg"),
  tatli: require("../../assets/yemek/yemek-tatli.jpg"),
  icecek: require("../../assets/yemek/yemek-icecek.jpg"),
  yumurta: require("../../assets/yemek/yemek-yumurta.jpg"),
  kizartma: require("../../assets/yemek/yemek-kizartma.jpg"),
  hamurIsi: require("../../assets/yemek/yemek-hamur-isi.jpg"),
  peynir: require("../../assets/yemek/yemek-peynir.jpg"),
  zeytin: require("../../assets/yemek/yemek-zeytin.jpg"),
  meyve: require("../../assets/yemek/yemek-meyve.jpg"),
  alGotur: require("../../assets/yemek/yemek-al-gotur.jpg"),
};

interface Props {
  kategori: Kategori | null;
  boyut?: number;
}

/**
 * Kategori çizimi. Çizimler temsilidir, tabaktaki görüntünün fotoğrafı değil;
 * bu yüzden gerçekçi fotoğraf değil düz illüstrasyon kullanılıyor.
 * Kategori tanınmazsa görsel yerine nötr bir kare çizilir.
 */
export function YemekGorseli({ kategori, boyut = 44 }: Props) {
  const tema = useTema();
  const kutu = { width: boyut, height: boyut, borderRadius: yaricap.kucuk } as const;

  if (!kategori) {
    return <View style={[kutu, { backgroundColor: tema.yuzey2 }]} />;
  }

  return (
    <Image
      source={gorseller[kategori.kimlik]}
      accessibilityLabel={`${kategori.ad} çizimi`}
      resizeMode="cover"
      style={kutu}
    />
  );
}
