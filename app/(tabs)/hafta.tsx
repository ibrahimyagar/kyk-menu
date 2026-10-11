import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ikon, type IkonAdi } from "../../src/components/Ikon";
import { useGun } from "../../src/gun/GunProvider";
import { ayAnahtari, ayinGunleri, tarihParcalari } from "../../src/lib/tarih";
import { useMenuDeposu } from "../../src/menu/MenuProvider";
import { ogunOzeti, ogunVar } from "../../src/menu/ozet";
import { useTercih } from "../../src/tercih/TercihProvider";
import { bosluk, yaricap } from "../../src/theme/tokens";
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

/** Güneş/ay simgesi öğünü söylüyor; "Kahvaltı:" etiketi satırı daraltıyordu. */
function OgunOzeti({ ikon, metin }: { ikon: IkonAdi; metin: string }) {
  const tema = useTema();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: bosluk.x2 }}>
      <Ikon ad={ikon} boyut={13} renk={tema.soluk} />
      <Text style={{ flex: 1, color: tema.metin, fontSize: 14, lineHeight: 19 }} numberOfLines={1}>
        {metin}
      </Text>
    </View>
  );
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
        <Text style={{ color: tema.metin, fontSize: 30, lineHeight: 36, fontWeight: "600", letterSpacing: -0.5 }}>
          Bu ay
        </Text>
        <Text style={{ color: tema.soluk, fontSize: 13 }}>Bir güne dokun, menüsü açılsın.</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: bosluk.x4, paddingBottom: bosluk.x8, gap: bosluk.x2 }}>
        {ayinGunleri(ay).map((tarih) => {
          const kayit = dosya?.gunler[tarih];
          const bugun = tarih === gun.bugun;
          const kcal = gunKcal(kayit);
          const parca = tarihParcalari(tarih);
          return (
            <Pressable
              key={tarih}
              accessibilityRole="button"
              accessibilityLabel={`${parca.gunAy} ${parca.gunAdi} menüsünü aç`}
              onPress={() => ac(tarih)}
              style={{
                minHeight: 72,
                flexDirection: "row",
                alignItems: "center",
                gap: bosluk.x3,
                padding: bosluk.x3,
                borderRadius: yaricap.orta,
                backgroundColor: tema.yuzey,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: bugun ? tema.aksan : tema.kenar,
              }}
            >
              {/* Sol blokta sadece gün sayısı: listede göz tek kolonu takip eder. */}
              <View
                style={{
                  width: 46,
                  paddingVertical: bosluk.x1,
                  borderRadius: yaricap.kucuk,
                  alignItems: "center",
                  backgroundColor: bugun ? tema.aksan : tema.yuzey2,
                }}
              >
                <Text style={{ color: bugun ? tema.aksanMetin : tema.metin, fontSize: 18, fontWeight: "600" }}>
                  {Number(tarih.slice(8))}
                </Text>
                <Text style={{ color: bugun ? tema.aksanMetin : tema.soluk, fontSize: 10, letterSpacing: 0.4 }}>
                  {parca.gunAdi.slice(0, 3).toLocaleUpperCase("tr-TR")}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <OgunOzeti ikon="sunny-outline" metin={ozet(kayit?.kahvalti)} />
                <OgunOzeti ikon="moon-outline" metin={ozet(kayit?.aksam)} />
                {kcal != null ? (
                  <Text style={{ color: tema.soluk, fontSize: 11, marginTop: 1 }} accessibilityLabel={`${kcal} kalori`}>
                    {kcal} kcal
                  </Text>
                ) : null}
              </View>
              <Ikon ad="chevron-forward" boyut={14} renk={tema.soluk} />
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
