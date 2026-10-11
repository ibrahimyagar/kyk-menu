import { Pressable, Text, View } from "react-native";
import type { OgunAdi } from "../lib/tarih";
import { bosluk, golge, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { Ikon, type IkonAdi } from "./Ikon";

const etiket: Record<OgunAdi, string> = { kahvalti: "Kahvaltı", aksam: "Akşam" };
const simge: Record<OgunAdi, IkonAdi> = { kahvalti: "sunny-outline", aksam: "moon-outline" };

export function MealToggle({ secili, onSec }: { secili: OgunAdi; onSec: (ogun: OgunAdi) => void }) {
  const tema = useTema();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: tema.yuzey2,
        borderRadius: yaricap.tam,
        padding: 3,
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
            style={[
              {
                flex: 1,
                minHeight: 42,
                flexDirection: "row",
                gap: bosluk.x2,
                borderRadius: yaricap.tam,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: aktif ? tema.yuzey : "transparent",
              },
              aktif ? golge(tema) : null,
            ]}
          >
            <Ikon ad={simge[ogun]} boyut={16} renk={aktif ? tema.aksan : tema.soluk} />
            <Text style={{ color: aktif ? tema.aksan : tema.soluk, fontSize: 16, fontWeight: aktif ? "600" : "400" }}>
              {etiket[ogun]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
