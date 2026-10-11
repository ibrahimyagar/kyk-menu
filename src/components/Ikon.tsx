import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";

export type IkonAdi = keyof typeof Ionicons.glyphMap;

/** Simge seti tek yerden geçsin; ileride set değişirse burada değişir. */
export function Ikon({ ad, boyut = 20, renk }: { ad: IkonAdi; boyut?: number; renk: ColorValue }) {
  return <Ionicons name={ad} size={boyut} color={renk} />;
}
