import * as Sharing from "expo-sharing";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";

export type PaylasimSonucu = "tamam" | "desteklenmiyor" | "hata";

/** Kartı PNG olarak yakalayıp sistem paylaşım sayfasını açar. */
export async function gorselPaylas(hedef: View | null): Promise<PaylasimSonucu> {
  if (!hedef) return "hata";
  try {
    if (!(await Sharing.isAvailableAsync())) return "desteklenmiyor";
    const dosya = await captureRef(hedef, { format: "png", quality: 1, result: "tmpfile" });
    await Sharing.shareAsync(dosya, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: "Menüyü paylaş",
    });
    return "tamam";
  } catch {
    return "hata";
  }
}
