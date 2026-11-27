import { StyleSheet, Text, View } from "react-native";
import type { Kategori } from "../menu/kategori";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { YemekGorseli } from "./YemekGorseli";

interface Props {
  kategori: Kategori | null;
  baslik: string;
  metin?: string;
  /** "224" veya "140–180". Kaynak satır kalorisi vermediyse boş kalır. */
  deger?: string;
  yuzde?: number;
  /** En büyük dilime göre 0–1 arası çubuk boyu. */
  oran?: number;
  ilk: boolean;
}

export function KaloriSatiri({ kategori, baslik, metin, deger, yuzde, oran, ilk }: Props) {
  const tema = useTema();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: bosluk.x3,
        paddingVertical: bosluk.x3,
        borderTopWidth: ilk ? 0 : StyleSheet.hairlineWidth,
        borderTopColor: tema.kenar,
      }}
    >
      <YemekGorseli kategori={kategori} boyut={40} />
      <View style={{ flex: 1, gap: bosluk.x2, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: bosluk.x3 }}>
          <Text style={{ flex: 1, color: tema.metin, fontSize: 16, lineHeight: 22 }}>{baslik}</Text>
          {deger ? <Text style={{ color: tema.metin, fontSize: 16 }}>{deger}</Text> : null}
          {yuzde != null ? (
            <Text style={{ color: tema.soluk, fontSize: 12, width: 38, textAlign: "right" }}>%{yuzde}</Text>
          ) : null}
        </View>
        {metin ? <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 19 }}>{metin}</Text> : null}
        {oran != null ? (
          <View style={{ height: 6, borderRadius: 3, backgroundColor: tema.yuzey2, overflow: "hidden" }}>
            <View
              style={{
                width: `${oran * 100}%`,
                height: 6,
                borderRadius: 3,
                backgroundColor: kategori?.renk ?? tema.aksan,
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
