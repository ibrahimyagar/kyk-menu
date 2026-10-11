import { StyleSheet, Text, View } from "react-native";
import type { Ogun } from "../types/domain";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { YemekListesi } from "./YemekListesi";

/** Öğün adını yazmaz; üstteki seçici onu zaten söylüyor. */
export function MealCard({ ogun }: { ogun: Ogun }) {
  const tema = useTema();
  if (ogun.durum === "aciklanmadi" || ogun.gruplar.length === 0) {
    return <Bos metin="Bu öğün için menü açıklanmadı." />;
  }

  return (
    <View
      style={{
        marginHorizontal: bosluk.x4,
        backgroundColor: tema.yuzey,
        borderRadius: yaricap.orta,
        borderWidth: 1,
        borderColor: tema.kenar,
        paddingHorizontal: bosluk.x4,
        paddingVertical: bosluk.x2,
      }}
    >
      <YemekListesi gruplar={ogun.gruplar} />
      {ogun.toplamKcal != null ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: tema.kenar,
            paddingTop: bosluk.x2,
            marginTop: bosluk.x1,
          }}
        >
          <Text style={{ color: tema.soluk, fontSize: 13 }}>Toplam</Text>
          <Text style={{ color: tema.soluk, fontSize: 13 }}>{ogun.toplamKcal} kcal</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Bos({ metin }: { metin: string }) {
  const tema = useTema();
  return (
    <View style={{ marginHorizontal: bosluk.x4, padding: bosluk.x6, borderRadius: yaricap.orta, backgroundColor: tema.yuzey, borderWidth: 1, borderColor: tema.kenar }}>
      <Text style={{ color: tema.metin, fontSize: 17, lineHeight: 24 }}>{metin}</Text>
    </View>
  );
}

export function Iskelet() {
  const tema = useTema();
  return (
    <View accessibilityLabel="Yükleniyor" style={{ gap: bosluk.x3, padding: bosluk.x4 }}>
      {[0.7, 1, 0.85].map((genislik, index) => (
        <View key={index} style={{ height: 18, width: `${genislik * 100}%`, borderRadius: yaricap.kucuk, backgroundColor: tema.yuzey2 }} />
      ))}
    </View>
  );
}
