import { Pressable, ScrollView, Text, View } from "react-native";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { gunKisa } from "../lib/tarih";

interface Props {
  gunler: string[];
  secili: string;
  bugun: string;
  onSec: (gun: string) => void;
}

export function DateStrip({ gunler, secili, bugun, onSec }: Props) {
  const tema = useTema();
  const baslangic = Math.max(0, gunler.indexOf(secili));

  return (
    <ScrollView
      key={gunler[0] ?? "bos"}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: bosluk.x4, gap: bosluk.x2 }}
      contentOffset={{ x: Math.max(0, baslangic * 56 - 16), y: 0 }}
    >
      {gunler.map((gun) => {
        const seciliMi = gun === secili;
        const parca = gunKisa(gun);
        return (
          <Pressable
            key={gun}
            accessibilityRole="button"
            accessibilityLabel={`${parca.gun} ${parca.hafta}${gun === bugun ? ", bugün" : ""}`}
            accessibilityState={{ selected: seciliMi }}
            onPress={() => onSec(gun)}
            style={{ width: 48, minHeight: 64, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: tema.soluk, fontSize: 13, marginBottom: bosluk.x1 }}>{parca.hafta}</Text>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: yaricap.buyuk,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: seciliMi ? tema.aksan : "transparent",
              }}
            >
              <Text style={{ color: seciliMi ? tema.aksanMetin : tema.metin, fontSize: 17 }}>{parca.gun}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
