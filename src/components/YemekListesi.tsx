import { Text, View } from "react-native";
import { kategoriBul } from "../menu/kategori";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Grup } from "../types/domain";
import { YemekGorseli } from "./YemekGorseli";

/**
 * Grup başına tek satır: solda kategori çizimi, sağda yemekler. Grup etiketi
 * ("Yumurta", "Hamur işi") yazılmaz; çizim ve yemeğin adı onu zaten söylüyor.
 * Kalori de burada değil: kart altındaki şerit toplamı, detay sayfası dağılımı
 * gösteriyor. Görsel 36 piksel ve dikey boşluk 4; menü tek ekrana sığsın diye.
 */
export function YemekListesi({ gruplar }: { gruplar: Grup[] }) {
  const tema = useTema();

  return (
    <>
      {gruplar.map((grup, index) => (
        <View
          key={`${grup.baslik ?? "grup"}-${index}`}
          style={{ flexDirection: "row", alignItems: "center", gap: bosluk.x3, paddingVertical: bosluk.x1 }}
        >
          <YemekGorseli kategori={kategoriBul(grup)} boyut={36} />
          <Text style={{ flex: 1, color: tema.metin, fontSize: 16, lineHeight: 22 }}>
            {grup.secenekler.map((secenek, sira) => (
              <Text key={`${secenek.ad}-${sira}`}>
                {sira > 0 ? (
                  <Text style={{ color: tema.soluk, fontSize: 15 }}>
                    {grup.secim === "biri" ? " veya " : ", "}
                  </Text>
                ) : null}
                {secenek.ad}
              </Text>
            ))}
          </Text>
        </View>
      ))}
    </>
  );
}
