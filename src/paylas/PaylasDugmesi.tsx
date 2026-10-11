import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
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

export function PaylasDugmesi(props: Props) {
  const tema = useTema();
  const kart = useRef<View>(null);
  const [mesgul, setMesgul] = useState(false);
  const [uyari, setUyari] = useState<keyof typeof uyariMetni | null>(null);

  const bas = () => {
    if (mesgul) return;
    setMesgul(true);
    setUyari(null);
    void (async () => {
      const sonuc = await gorselPaylas(kart.current);
      if (sonuc !== "tamam") setUyari(sonuc);
      setMesgul(false);
    })();
  };

  return (
    <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x4, gap: bosluk.x2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: mesgul }}
        onPress={bas}
        style={{
          minHeight: 48,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: yaricap.orta,
          borderWidth: 1,
          borderColor: tema.kenar,
          backgroundColor: tema.yuzey,
          opacity: mesgul ? 0.6 : 1,
        }}
      >
        <Text style={{ color: tema.metin, fontSize: 16 }}>{mesgul ? "Hazırlanıyor…" : "Görsel olarak paylaş"}</Text>
      </Pressable>
      {uyari ? <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>{uyariMetni[uyari]}</Text> : null}

      {/* Ekran dışında durur; view-shot görünür olmasını gerektirmez. */}
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", left: -10000, top: 0 }}
      >
        <PaylasimKarti ref={kart} {...props} />
      </View>
    </View>
  );
}
