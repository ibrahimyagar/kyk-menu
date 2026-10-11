import { Pressable, Text, View } from "react-native";
import { dilimSaydamligi, dilimToplami, kaloriDilimleri } from "../menu/kalori";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Grup } from "../types/domain";
import { Ikon } from "./Ikon";

interface Props {
  gruplar: Grup[];
  toplamKcal?: number | null;
  onBas?: () => void;
}

/**
 * Kartın imza öğesi: grupların kalori payı tek bir şeritte, her dilim kendi
 * yemek kategorisinin renginde. Rakiplerde kalori ya hiç yok ya da her satırda
 * tekrar eden rozet olarak duruyor.
 */
export function KaloriSeridi({ gruplar, toplamKcal, onBas }: Props) {
  const tema = useTema();
  const dilimler = kaloriDilimleri(gruplar);
  const toplam = toplamKcal ?? (dilimler.length > 0 ? dilimToplami(dilimler) : null);

  if (toplam == null) {
    return (
      <Text style={{ color: tema.soluk, fontSize: 12, paddingVertical: bosluk.x2 }}>
        Kalori bilgisi bu ay yayınlanmadı
      </Text>
    );
  }

  const acilir = Boolean(onBas) && dilimler.length > 0;
  const govde = (
    <View style={{ gap: bosluk.x2, paddingVertical: bosluk.x2 }}>
      {dilimler.length > 0 ? (
        <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", gap: 2 }}>
          {dilimler.map((dilim, sira) => (
            <View
              key={`${dilim.baslik}-${sira}`}
              style={{
                flex: dilim.kcal,
                borderRadius: 4,
                backgroundColor: dilim.kategori?.renk ?? tema.aksan,
                opacity: dilim.kategori ? 1 : dilimSaydamligi(sira, dilimler.length),
              }}
            />
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.x2 }}>
        <Text style={{ flex: 1, color: tema.soluk, fontSize: 13 }}>Toplam {toplam} kcal</Text>
        {acilir ? (
          <>
            <Text style={{ color: tema.aksan, fontSize: 13 }}>Dağılım</Text>
            <Ikon ad="chevron-forward" boyut={14} renk={tema.aksan} />
          </>
        ) : null}
      </View>
    </View>
  );

  if (!acilir) return govde;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Kalori dağılımını aç, toplam ${toplam} kalori`}
      onPress={onBas}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      {govde}
    </Pressable>
  );
}
