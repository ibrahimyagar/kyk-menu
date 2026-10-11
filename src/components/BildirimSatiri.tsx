import { Pressable, Switch, Text, View } from "react-native";
import { dakikaKaydir, saatMetni, type BildirimAyari } from "../bildirim/plan";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";

const ADIM = 30;

interface Props {
  baslik: string;
  ayar: BildirimAyari;
  onDegis: (ayar: BildirimAyari) => void;
  kapali?: boolean;
}

export function BildirimSatiri({ baslik, ayar, onDegis, kapali = false }: Props) {
  const tema = useTema();

  return (
    <View style={{ opacity: kapali ? 0.5 : 1 }}>
      <View style={{ minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: bosluk.x4 }}>
        <Text style={{ flex: 1, color: tema.metin, fontSize: 17 }}>{baslik}</Text>
        <Switch
          value={ayar.acik}
          onValueChange={(acik) => onDegis({ ...ayar, acik })}
          disabled={kapali}
          accessibilityLabel={`${baslik} bildirimi`}
          trackColor={{ false: tema.yuzey2, true: tema.aksan }}
          thumbColor={tema.yuzey}
        />
      </View>
      {ayar.acik && !kapali ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.x3, paddingTop: bosluk.x2 }}>
          <Adim etiket="30 dakika geri" isaret="−" onBas={() => onDegis({ ...ayar, dakika: dakikaKaydir(ayar.dakika, -ADIM) })} />
          <Text
            accessibilityLabel={`Saat ${saatMetni(ayar.dakika)}`}
            style={{ color: tema.metin, fontSize: 20, minWidth: 72, textAlign: "center" }}
          >
            {saatMetni(ayar.dakika)}
          </Text>
          <Adim etiket="30 dakika ileri" isaret="+" onBas={() => onDegis({ ...ayar, dakika: dakikaKaydir(ayar.dakika, ADIM) })} />
        </View>
      ) : null}
    </View>
  );
}

function Adim({ etiket, isaret, onBas }: { etiket: string; isaret: string; onBas: () => void }) {
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiket}
      onPress={onBas}
      style={{
        width: 44,
        height: 44,
        borderRadius: yaricap.kucuk,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tema.yuzey2,
      }}
    >
      <Text style={{ color: tema.metin, fontSize: 20 }}>{isaret}</Text>
    </Pressable>
  );
}
