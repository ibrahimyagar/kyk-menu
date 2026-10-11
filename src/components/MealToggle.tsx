import { Pressable, Text, View } from "react-native";
import type { OgunAdi } from "../lib/tarih";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";

const etiket: Record<OgunAdi, string> = { kahvalti: "Kahvaltı", aksam: "Akşam" };

export function MealToggle({ secili, onSec }: { secili: OgunAdi; onSec: (ogun: OgunAdi) => void }) {
  const tema = useTema();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: tema.yuzey2,
        borderRadius: yaricap.orta,
        padding: bosluk.x1,
        marginHorizontal: bosluk.x4,
      }}
    >
      {(["kahvalti", "aksam"] as const).map((ogun) => {
        const aktif = ogun === secili;
        return (
          <Pressable
            key={ogun}
            accessibilityRole="button"
            accessibilityState={{ selected: aktif }}
            onPress={() => onSec(ogun)}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: yaricap.kucuk,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: aktif ? tema.yuzey : "transparent",
            }}
          >
            <Text style={{ color: aktif ? tema.aksan : tema.soluk, fontSize: 16 }}>{etiket[ogun]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
