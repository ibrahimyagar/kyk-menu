import { StyleSheet, Text, View } from "react-native";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Grup } from "../types/domain";

/** "Ana yemek" ve "Hamur işi" en uzun etiketler; 13 punto ile buraya sığıyor. */
const ETIKET_GENISLIGI = 80;

/**
 * Grup başına tek satır: solda etiket, sağda yemekler. Kalori burada yazmaz;
 * kart altındaki şerit toplamı, detay sayfası dağılımı gösteriyor.
 */
export function YemekListesi({ gruplar }: { gruplar: Grup[] }) {
  const tema = useTema();

  return (
    <>
      {gruplar.map((grup, index) => (
        <View
          key={`${grup.baslik ?? "grup"}-${index}`}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: bosluk.x3,
            paddingVertical: bosluk.x2,
            borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
            borderTopColor: tema.kenar,
          }}
        >
          {grup.baslik ? (
            <Text style={{ width: ETIKET_GENISLIGI, color: tema.soluk, fontSize: 13, lineHeight: 22 }}>
              {grup.baslik}
            </Text>
          ) : null}
          <Text style={{ flex: 1, color: tema.metin, fontSize: 16, lineHeight: 22 }}>
            {grup.secenekler.map((secenek, sira) => (
              <Text key={`${secenek.ad}-${sira}`}>
                {sira > 0 ? (
                  <Text style={{ color: tema.soluk }}>{grup.secim === "biri" ? " veya " : ", "}</Text>
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
