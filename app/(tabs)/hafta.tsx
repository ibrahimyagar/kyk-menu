import { useEffect } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMenuDeposu } from "../../src/menu/MenuProvider";
import { ogunOzeti, ogunVar } from "../../src/menu/ozet";
import { useGun } from "../../src/gun/GunProvider";
import { ayAnahtari, ayinGunleri, turkceTarih } from "../../src/lib/tarih";
import { useTercih } from "../../src/tercih/TercihProvider";
import { bosluk } from "../../src/theme/tokens";
import { useTema } from "../../src/theme/ThemeProvider";
import type { Ogun } from "../../src/types/domain";

function ozet(ogun: Ogun | undefined): string {
  return ogunVar(ogun) ? ogunOzeti(ogun) : "Menü yok";
}

export default function Hafta() {
  const tema = useTema();
  const tercih = useTercih();
  const gun = useGun();
  const depo = useMenuDeposu();
  const ay = ayAnahtari(gun.tarih);
  const dosya = tercih.il ? depo.dosya(tercih.il, ay) : null;
  useEffect(() => {
    if (tercih.il) depo.izle(tercih.il, ay);
  }, [ay, depo.izle, tercih.il]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }} edges={["top"]}>
      <Text style={{ color: tema.metin, fontSize: 28, lineHeight: 36, padding: bosluk.x4 }}>Hafta</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: bosluk.x8 }}>
        {ayinGunleri(ay).map((tarih) => {
          const kayit = dosya?.gunler[tarih];
          const secili = tarih === gun.tarih;
          return (
            <Pressable
              key={tarih}
              accessibilityRole="button"
              onPress={() => gun.tarihSec(tarih)}
              style={{
                minHeight: 72,
                paddingHorizontal: bosluk.x4,
                paddingVertical: bosluk.x3,
                backgroundColor: secili ? tema.yuzey : "transparent",
                borderTopWidth: 1,
                borderTopColor: tema.kenar,
              }}
            >
              <Text style={{ color: secili ? tema.aksan : tema.metin, fontSize: 16 }}>{turkceTarih(tarih)}</Text>
              <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18, marginTop: bosluk.x1 }} numberOfLines={2}>
                Kahvaltı: {ozet(kayit?.kahvalti)}
              </Text>
              <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                Akşam: {ozet(kayit?.aksam)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
