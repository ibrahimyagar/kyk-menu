import * as Linking from "expo-linking";
import { Pressable, Text } from "react-native";
import { baglantiKur } from "../config/baglantilar";
import { useTema } from "../theme/ThemeProvider";

interface Props {
  sablon: string;
  degerler?: Record<string, string>;
  etiket: string;
}

/** Şablon tanımlı değilse hiçbir şey çizmez. */
export function BaglantiSatiri({ sablon, degerler = {}, etiket }: Props) {
  const tema = useTema();
  const adres = baglantiKur(sablon, degerler);
  if (!adres) return null;

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(adres)}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      <Text style={{ color: tema.aksan, fontSize: 15 }}>{etiket}</Text>
    </Pressable>
  );
}
