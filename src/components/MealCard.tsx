import { Pressable, StyleSheet, Text, View } from "react-native";
import { bosluk, golge, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Ogun } from "../types/domain";
import { KaloriSeridi } from "./KaloriSeridi";
import { YemekListesi } from "./YemekListesi";

/** Öğün adını yazmaz; üstteki seçici onu zaten söylüyor. */
export function MealCard({ ogun, onKalori }: { ogun: Ogun; onKalori?: () => void }) {
  const tema = useTema();
  if (ogun.durum === "aciklanmadi" || ogun.gruplar.length === 0) {
    return <Bos metin="Bu öğün için menü açıklanmadı." />;
  }

  return (
    <View style={[kart(tema.yuzey, tema.kenar), golge(tema)]}>
      <YemekListesi gruplar={ogun.gruplar} />
      <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tema.kenar, marginTop: bosluk.x2 }}>
        <KaloriSeridi ogun={ogun} onBas={onKalori} />
      </View>
    </View>
  );
}

export function Bos({ metin, eylem }: { metin: string; eylem?: { etiket: string; onBas: () => void } }) {
  const tema = useTema();
  return (
    <View style={[kart(tema.yuzey, tema.kenar), golge(tema), { paddingVertical: bosluk.x6, gap: bosluk.x4 }]}>
      <Text style={{ color: tema.metin, fontSize: 17, lineHeight: 24 }}>{metin}</Text>
      {eylem ? (
        <Pressable
          accessibilityRole="button"
          onPress={eylem.onBas}
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: bosluk.x4,
            borderRadius: yaricap.tam,
            backgroundColor: tema.aksan,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: tema.aksanMetin, fontSize: 15, fontWeight: "600" }}>{eylem.etiket}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Iskelet() {
  const tema = useTema();
  return (
    <View accessibilityLabel="Yükleniyor" style={[kart(tema.yuzey, tema.kenar), { gap: bosluk.x4, paddingVertical: bosluk.x6 }]}>
      {[0.7, 1, 0.85, 0.6].map((genislik, index) => (
        <View
          key={index}
          style={{ height: 16, width: `${genislik * 100}%`, borderRadius: yaricap.kucuk, backgroundColor: tema.yuzey2 }}
        />
      ))}
    </View>
  );
}

/** Üç durumun da aynı kart geometrisini kullanması için tek yerden. */
function kart(yuzey: string, kenar: string) {
  return {
    marginHorizontal: bosluk.x4,
    backgroundColor: yuzey,
    borderRadius: yaricap.buyuk,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: kenar,
    paddingHorizontal: bosluk.x5,
    paddingVertical: bosluk.x3,
  } as const;
}
