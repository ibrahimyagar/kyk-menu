import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BaglantiSatiri } from "../../src/components/BaglantiSatiri";
import { DateStrip } from "../../src/components/DateStrip";
import { Bos, Iskelet, MealCard } from "../../src/components/MealCard";
import { MealToggle } from "../../src/components/MealToggle";
import { MENU_YANLIS_FORM } from "../../src/config/baglantilar";
import { ilBul } from "../../src/data/iller";
import { useMenuDeposu } from "../../src/menu/MenuProvider";
import { ogunVar } from "../../src/menu/ozet";
import { PaylasDugmesi } from "../../src/paylas/PaylasDugmesi";
import { useGun } from "../../src/gun/GunProvider";
import { ayAnahtari, ayinGunleri, gunEkle, kisaTarih, turkceTarih } from "../../src/lib/tarih";
import { useTercih } from "../../src/tercih/TercihProvider";
import { bosluk } from "../../src/theme/tokens";
import { useTema } from "../../src/theme/ThemeProvider";

const ogunBaslik = { kahvalti: "Kahvaltı", aksam: "Akşam yemeği" } as const;

export default function MenuEkrani() {
  const tema = useTema();
  const tercih = useTercih();
  const gun = useGun();
  const depo = useMenuDeposu();
  const il = ilBul(tercih.il ?? "");
  const ay = ayAnahtari(gun.tarih);
  const dosya = tercih.il ? depo.dosya(tercih.il, ay) : null;
  const gorunum = tercih.il ? depo.gorunum(tercih.il, ay) : "il-yok";
  const gunKaydi = dosya?.gunler[gun.tarih];
  useEffect(() => {
    if (tercih.il) depo.izle(tercih.il, ay);
  }, [ay, depo.izle, tercih.il]);
  const yarin = gunEkle(gun.bugun, 1);
  const baslikTarih = gun.tarih === gun.bugun ? `Bugün · ${turkceTarih(gun.tarih)}` : gun.tarih === yarin ? `Yarın · ${turkceTarih(gun.tarih)}` : turkceTarih(gun.tarih);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }} edges={["top"]}>
      <View style={{ minHeight: 48, paddingHorizontal: bosluk.x4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable accessibilityRole="button" accessibilityLabel="İl değiştir" onPress={() => router.push("/il")} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: tema.metin, fontSize: 17 }}>{il?.ad ?? "İl seç"} ▾</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Ayarlar" onPress={() => router.push("/(tabs)/ayarlar")} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: bosluk.x2 }}>
          <Text style={{ color: tema.soluk, fontSize: 20 }}>⚙</Text>
        </Pressable>
      </View>
      <Text style={{ color: tema.metin, fontSize: 22, lineHeight: 30, paddingHorizontal: bosluk.x4, paddingBottom: bosluk.x2 }}>{baslikTarih}</Text>
      <DateStrip gunler={ayinGunleri(ay)} secili={gun.tarih} bugun={gun.bugun} onSec={gun.tarihSec} />
      <View style={{ height: bosluk.x3 }} />
      <MealToggle secili={gun.ogun} onSec={gun.ogunSec} />
      <ScrollView contentContainerStyle={{ paddingTop: bosluk.x3, paddingBottom: bosluk.x6 }}>
        {gorunum === "bekliyor" ? (
          <Iskelet />
        ) : gorunum === "internet" ? (
          <Bos metin="İlk menüyü indirmek için internete bağlan." />
        ) : gorunum === "il-yok" ? (
          <Bos metin="Bu ilin menüsü henüz yok." />
        ) : gorunum === "ay-yok" || !dosya ? (
          <Bos metin="Bu ayın menüsü henüz yayınlanmadı." />
        ) : !gunKaydi ? (
          <Bos metin="Bu gün için menü yok." />
        ) : (
          <MealCard ogun={gunKaydi[gun.ogun]} />
        )}
        {gunKaydi && ogunVar(gunKaydi[gun.ogun]) ? (
          <PaylasDugmesi
            il={il?.ad ?? ""}
            tarih={gun.tarih}
            ogunAdi={ogunBaslik[gun.ogun]}
            ogun={gunKaydi[gun.ogun]}
          />
        ) : null}
        <View style={{ paddingHorizontal: bosluk.x4 }}>
          <BaglantiSatiri
            sablon={MENU_YANLIS_FORM}
            degerler={{ il: il?.ad ?? "", tarih: gun.tarih, ogun: ogunBaslik[gun.ogun] }}
            etiket="Menü yanlış mı?"
          />
        </View>
        <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18, paddingHorizontal: bosluk.x4, paddingTop: bosluk.x4 }}>
          {dosya ? `Son güncelleme: ${kisaTarih(dosya.guncellenmeTarihi)}. ` : ""}
          Resmî uygulama değildir. Yemekhanedeki ilan esastır.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
