import { Pressable, ScrollView, Text, View } from "react-native";
import { gunKisa } from "../lib/tarih";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";

interface Props {
  gunler: string[];
  secili: string;
  bugun: string;
  onSec: (gun: string) => void;
}

const HUCRE = 52;

/**
 * Tek tek daire yerine gün adı ve sayıyı birlikte taşıyan dikey hücre:
 * seçili gün dolu, bugün soluk vurgu zemini, diğerleri boş.
 */
export function DateStrip({ gunler, secili, bugun, onSec }: Props) {
  const tema = useTema();
  const baslangic = Math.max(0, gunler.indexOf(secili));

  return (
    <ScrollView
      key={gunler[0] ?? "bos"}
      horizontal
      showsHorizontalScrollIndicator={false}
      /* ScrollView varsayılanı flexGrow/flexShrink 1; sütun içinde kardeş
         listeyle yarışıp şeridi kırpıyordu. İçerik yüksekliği kalsın. */
      style={{ flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{ paddingHorizontal: bosluk.x4, gap: bosluk.x2, alignItems: "center" }}
      contentOffset={{ x: Math.max(0, baslangic * (HUCRE + bosluk.x2) - bosluk.x4), y: 0 }}
    >
      {gunler.map((gun) => {
        const seciliMi = gun === secili;
        const bugunMu = gun === bugun;
        const parca = gunKisa(gun);
        const yazi = seciliMi ? tema.aksanMetin : bugunMu ? tema.aksan : tema.metin;
        return (
          <Pressable
            key={gun}
            accessibilityRole="button"
            accessibilityLabel={`${parca.gun} ${parca.hafta}${bugunMu ? ", bugün" : ""}`}
            accessibilityState={{ selected: seciliMi }}
            onPress={() => onSec(gun)}
            style={{
              width: HUCRE,
              minHeight: 62,
              paddingVertical: bosluk.x2,
              borderRadius: yaricap.orta,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              backgroundColor: seciliMi ? tema.aksan : bugunMu ? tema.aksanZemin : "transparent",
            }}
          >
            <Text
              style={{
                color: seciliMi ? tema.aksanMetin : tema.soluk,
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              {parca.hafta}
            </Text>
            <Text style={{ color: yazi, fontSize: 19, fontWeight: seciliMi ? "600" : "400" }}>{parca.gun}</Text>
          </Pressable>
        );
      })}
      <View style={{ width: bosluk.x2 }} />
    </ScrollView>
  );
}
