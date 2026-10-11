import * as Linking from "expo-linking";
import { Pressable, Text, View } from "react-native";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { Ikon, type IkonAdi } from "./Ikon";

interface Props {
  adres: string | null;
  etiket: string;
  ikon?: IkonAdi;
}

/** Adres yoksa hiçbir şey çizmez; kullanıcı ölü bağlantı görmez. */
export function BaglantiSatiri({ adres, etiket, ikon }: Props) {
  const tema = useTema();
  if (!adres) return null;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(adres)}
      style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: bosluk.x2 }}
    >
      {ikon ? <Ikon ad={ikon} boyut={18} renk={tema.aksan} /> : null}
      <Text style={{ flex: 1, color: tema.aksan, fontSize: 15 }}>{etiket}</Text>
      <Ikon ad="chevron-forward" boyut={16} renk={tema.soluk} />
    </Pressable>
  );
}