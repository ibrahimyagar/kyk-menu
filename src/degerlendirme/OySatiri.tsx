import { Pressable, View } from "react-native";
import { Ikon, type IkonAdi } from "../components/Ikon";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { useDegerlendirme, type Oy } from "./DegerlendirmeProvider";

const secenekler: { oy: Oy; ikon: IkonAdi; dolu: IkonAdi; etiket: string }[] = [
  { oy: "begendi", ikon: "thumbs-up-outline", dolu: "thumbs-up", etiket: "Beğendim" },
  { oy: "begenmedi", ikon: "thumbs-down-outline", dolu: "thumbs-down", etiket: "Beğenmedim" },
];

/** Tek dokunuşla oy; ikinci dokunuş oyu geri alır. */
export function OySatiri({ anahtar }: { anahtar: string }) {
  const tema = useTema();
  const degerlendirme = useDegerlendirme();
  const secili = degerlendirme.oy(anahtar);

  return (
    <View style={{ flexDirection: "row", gap: bosluk.x2 }}>
      {secenekler.map((secenek) => {
        const aktif = secili === secenek.oy;
        return (
          <Pressable
            key={secenek.oy}
            accessibilityRole="button"
            accessibilityLabel={secenek.etiket}
            accessibilityHint="Bu not yalnızca bu telefonda tutulur. Tekrar dokunursan geri alınır."
            accessibilityState={{ selected: aktif }}
            onPress={() => degerlendirme.oyVer(anahtar, secenek.oy)}
            style={{
              width: 48,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: yaricap.kucuk,
              borderWidth: 1,
              borderColor: aktif ? tema.aksan : tema.kenar,
              backgroundColor: aktif ? tema.aksanZemin : tema.yuzey,
            }}
          >
            <Ikon ad={aktif ? secenek.dolu : secenek.ikon} boyut={18} renk={aktif ? tema.aksan : tema.soluk} />
          </Pressable>
        );
      })}
    </View>
  );
}
