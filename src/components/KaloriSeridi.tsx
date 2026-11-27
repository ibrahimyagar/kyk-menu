import { Pressable, Text, View } from "react-native";
import { dilimSaydamligi, ogunKaloriOzeti } from "../menu/kalori";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { KcalAralik, Ogun } from "../types/domain";
import { Ikon } from "./Ikon";

interface Props {
  ogun: Pick<Ogun, "gruplar" | "toplamKcal" | "kcalAralik">;
  onBas?: () => void;
}

function aralikMetni(aralik: KcalAralik): string {
  return `${aralik.min}–${aralik.max} kcal`;
}

/**
 * Kartın imza öğesi: grupların kalori payı tek bir şeritte. Kaynak aralık
 * verdiyse aynı yerde aralık yazılır; orta değer uydurulmaz.
 */
export function KaloriSeridi({ ogun, onBas }: Props) {
  const tema = useTema();
  const { dilimler, toplam, aralik } = ogunKaloriOzeti(ogun);

  if (toplam == null && !aralik) {
    return (
      <Text style={{ color: tema.soluk, fontSize: 12, paddingVertical: bosluk.x2 }}>
        Kalori bilgisi bu öğün için yayınlanmadı
      </Text>
    );
  }

  const acilir = Boolean(onBas) && (dilimler.length > 0 || aralik != null);
  const etiket = toplam != null ? `Toplam ${toplam} kcal` : aralik ? aralikMetni(aralik) : "";

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
      ) : (
        <View style={{ height: 8, borderRadius: 4, backgroundColor: tema.aksanZemin }} />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.x2 }}>
        <Text style={{ flex: 1, color: tema.soluk, fontSize: 13 }}>{etiket}</Text>
        {acilir ? (
          <>
            <Text style={{ color: tema.aksan, fontSize: 13 }}>{dilimler.length > 0 ? "Dağılım" : "Kaynak"}</Text>
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
      accessibilityLabel={toplam != null ? `Kalori dağılımını aç, toplam ${toplam} kalori` : `Kalori kaynağını aç, ${etiket}`}
      onPress={onBas}
      style={{ minHeight: 44, justifyContent: "center" }}
    >
      {govde}
    </Pressable>
  );
}
