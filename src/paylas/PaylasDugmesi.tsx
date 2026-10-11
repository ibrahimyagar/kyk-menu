import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ikon } from "../components/Ikon";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Ogun } from "../types/domain";
import { gorselPaylas } from "./paylas";
import { PaylasimKarti } from "./PaylasimKarti";

interface Props {
  il: string;
  tarih: string;
  ogunAdi: string;
  ogun: Ogun;
}

const uyariMetni = {
  desteklenmiyor: "Bu cihazda paylaşım açılamadı.",
  hata: "Görsel hazırlanamadı. Tekrar dene.",
};

export function PaylasDugmesi({ onUyari, ...kart }: Props & { onUyari?: (metin: string | null) => void }) {
  const tema = useTema();
  const kartRef = useRef<View>(null);
  const [mesgul, setMesgul] = useState(false);

  const bas = () => {
    if (mesgul) return;
    setMesgul(true);
    onUyari?.(null);
    void (async () => {
      const sonuc = await gorselPaylas(kartRef.current);
      if (sonuc !== "tamam") onUyari?.(uyariMetni[sonuc]);
      setMesgul(false);
    })();
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Menüyü görsel olarak paylaş"
        accessibilityState={{ busy: mesgul }}
        onPress={bas}
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: bosluk.x2,
          paddingHorizontal: bosluk.x4,
          borderRadius: yaricap.tam,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: tema.kenar,
          backgroundColor: tema.yuzey,
          opacity: mesgul ? 0.6 : 1,
        }}
      >
        <Ikon ad="share-outline" boyut={18} renk={tema.metin} />
        <Text style={{ color: tema.metin, fontSize: 15 }}>{mesgul ? "Hazırlanıyor…" : "Paylaş"}</Text>
      </Pressable>

      {/* Ekran dışında durur; view-shot görünür olmasını gerektirmez. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", left: -10000, top: 0 }}
      >
        <PaylasimKarti ref={kartRef} {...kart} />
      </View>
    </>
  );
}
