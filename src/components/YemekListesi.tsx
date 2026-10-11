import { StyleSheet, Text, View } from "react-native";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Grup } from "../types/domain";

/** "Ana yemek" ve "Hamur işi" en uzun etiketler; 13 punto ile buraya sığıyor. */
const ETIKET_GENISLIGI = 80;

/**
 * Grubun kalorisi. "biri" gruplarında seçenekler aynı değeri taşıdığı için o
 * değer, "hepsi" gruplarında hepsi verildiği için toplam. Eksik değer varsa
 * sayı üretilmez.
 */
export function grupKcal(grup: Grup): number | null {
  const degerler = grup.secenekler.map((secenek) => secenek.kcal);
  if (degerler.length === 0 || degerler.some((kcal) => kcal == null)) return null;
  const sayilar = degerler as number[];
  if (grup.secim === "biri") {
    const ilk = sayilar[0] as number;
    return sayilar.every((kcal) => kcal === ilk) ? ilk : null;
  }
  return sayilar.reduce((toplam, kcal) => toplam + kcal, 0);
}

interface Props {
  gruplar: Grup[];
  kcalGoster?: boolean;
}

/** Grup başına tek satır: solda etiket, sağda yemekler. Kaydırmadan okunur. */
export function YemekListesi({ gruplar, kcalGoster = true }: Props) {
  const tema = useTema();

  return (
    <>
      {gruplar.map((grup, index) => {
        const kcal = kcalGoster ? grupKcal(grup) : null;
        return (
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
            {kcal != null ? (
              <Text
                accessibilityLabel={`${kcal} kalori`}
                style={{ color: tema.soluk, fontSize: 12, lineHeight: 22 }}
              >
                {kcal}
              </Text>
            ) : null}
          </View>
        );
      })}
    </>
  );
}
