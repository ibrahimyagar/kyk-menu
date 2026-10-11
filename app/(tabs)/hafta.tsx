import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ikon } from "../../src/components/Ikon";
import { useGun } from "../../src/gun/GunProvider";
import { ayAnahtari, ayinGunleri, turkceTarih } from "../../src/lib/tarih";
import { useMenuDeposu } from "../../src/menu/MenuProvider";
import { ogunOzeti, ogunVar } from "../../src/menu/ozet";
import { useTercih } from "../../src/tercih/TercihProvider";
import { bosluk } from "../../src/theme/tokens";
import { useTema } from "../../src/theme/ThemeProvider";
import type { GunMenu, Ogun } from "../../src/types/domain";

function ozet(ogun: Ogun | undefined): string {
  return ogunVar(ogun) ? ogunOzeti(ogun) : "Menü yok";
}

/** Günün toplamı yalnızca iki öğünün de kalorisi yazıyorsa anlamlı. */
function gunKcal(kayit: GunMenu | undefined): number | null {
  const degerler = [kayit?.kahvalti.toplamKcal, kayit?.aksam.toplamKcal];
  if (degerler.some((kcal) => kcal == null)) return null;
  return (degerler as number[]).reduce((toplam, kcal) => toplam + kcal, 0);
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

  /** Gün seçilince menüye dönülür: iki ekran arası gezinme tek dokunuşa iner. */
  const ac = (tarih: string) => {
    gun.tarihSec(tarih);
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x4, paddingBottom: bosluk.x3 }}>
        <Text style={{ color: tema.metin, fontSize: 28, lineHeight: 36 }}>Bu ay</Text>
        <Text style={{ color: tema.soluk, fontSize: 13 }}>Bir güne dokun, menüsü açılsın.</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: bosluk.x8 }}>
        {ayinGunleri(ay).map((tarih) => {
          const kayit = dosya?.gunler[tarih];
          const secili = tarih === gun.tarih;
          const bugun = tarih === gun.bugun;
          const kcal = gunKcal(kayit);
          return (
            <Pressable
              key={tarih}
              accessibilityRole="button"
              accessibilityLabel={`${turkceTarih(tarih)} menüsünü aç`}
              onPress={() => ac(tarih)}
              style={{
                minHeight: 72,
                paddingHorizontal: bosluk.x4,
                paddingVertical: bosluk.x3,
                backgroundColor: secili ? tema.yuzey : "transparent",
                borderTopWidth: 1,
                borderTopColor: tema.kenar,
                borderLeftWidth: 3,
                borderLeftColor: bugun ? tema.aksan : "transparent",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.x2 }}>
                <Text style={{ flex: 1, color: secili ? tema.aksan : tema.metin, fontSize: 16 }}>
                  {turkceTarih(tarih)}
                </Text>
                {kcal != null ? (
                  <Text style={{ color: tema.soluk, fontSize: 12 }} accessibilityLabel={`${kcal} kalori`}>
                    {kcal} kcal
                  </Text>
                ) : null}
                <Ikon ad="chevron-forward" boyut={14} renk={tema.soluk} />
              </View>
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
