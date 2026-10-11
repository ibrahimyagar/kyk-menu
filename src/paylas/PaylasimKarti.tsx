import { forwardRef } from "react";
import { Text, View } from "react-native";
import { YemekListesi } from "../components/YemekListesi";
import { turkceTarih } from "../lib/tarih";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Ogun } from "../types/domain";

/** Karelenmeden okunabilsin diye sabit genişlik; yakalama cihaz ölçeğiyle büyütülür. */
export const KART_GENISLIGI = 360;

interface Props {
  il: string;
  tarih: string;
  ogunAdi: string;
  ogun: Ogun;
}

export const PaylasimKarti = forwardRef<View, Props>(function PaylasimKarti({ il, tarih, ogunAdi, ogun }, ref) {
  const tema = useTema();

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: KART_GENISLIGI,
        backgroundColor: tema.bg,
        padding: bosluk.x6,
        gap: bosluk.x3,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={{ color: tema.soluk, fontSize: 14 }}>{il}</Text>
        <Text style={{ color: tema.aksan, fontSize: 14 }}>{ogunAdi}</Text>
      </View>
      <Text style={{ color: tema.metin, fontSize: 24, lineHeight: 32 }}>{turkceTarih(tarih)}</Text>
      <View
        style={{
          backgroundColor: tema.yuzey,
          borderRadius: yaricap.orta,
          borderWidth: 1,
          borderColor: tema.kenar,
          paddingHorizontal: bosluk.x4,
          paddingBottom: bosluk.x2,
        }}
      >
        <YemekListesi gruplar={ogun.gruplar} kcalGoster={false} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        {ogun.toplamKcal != null ? (
          <Text style={{ color: tema.soluk, fontSize: 13 }}>{ogun.toplamKcal} kcal</Text>
        ) : (
          <View />
        )}
        <Text style={{ color: tema.soluk, fontSize: 11 }}>Resmî değildir, ilan esastır</Text>
      </View>
    </View>
  );
});
