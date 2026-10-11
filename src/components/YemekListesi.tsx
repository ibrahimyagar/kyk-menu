import { Text, View } from "react-native";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Grup } from "../types/domain";

interface Props {
  gruplar: Grup[];
  /** Paylaşım kartı gibi dokunulmayan yüzeylerde satırlar sıkışır. */
  kompakt?: boolean;
  kcalGoster?: boolean;
}

export function YemekListesi({ gruplar, kompakt = false, kcalGoster = true }: Props) {
  const tema = useTema();
  const satirYuksekligi = kompakt ? undefined : 44;

  return (
    <>
      {gruplar.map((grup, index) => (
        <View
          key={`${grup.baslik ?? "grup"}-${index}`}
          style={{
            paddingVertical: kompakt ? bosluk.x2 : bosluk.x3,
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: tema.kenar,
            marginTop: index === 0 ? bosluk.x2 : 0,
          }}
        >
          {grup.baslik ? (
            <Text style={{ color: tema.soluk, fontSize: 13, marginBottom: bosluk.x1 }}>{grup.baslik}</Text>
          ) : null}
          {grup.secenekler.map((secenek, sira) => (
            <View key={`${secenek.ad}-${sira}`}>
              {sira > 0 && grup.secim === "biri" ? (
                <Text style={{ color: tema.soluk, fontSize: 13, paddingVertical: bosluk.x1 }}>veya</Text>
              ) : null}
              <View
                style={{
                  minHeight: satirYuksekligi,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: bosluk.x3,
                }}
              >
                <Text style={{ flex: 1, color: tema.metin, fontSize: kompakt ? 16 : 17, lineHeight: kompakt ? 22 : 24 }}>
                  {secenek.ad}
                </Text>
                {kcalGoster && secenek.kcal != null ? (
                  <Text style={{ color: tema.soluk, fontSize: 13 }}>{secenek.kcal} kcal</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}
