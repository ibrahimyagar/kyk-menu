import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BaglantiSatiri } from "../../src/components/BaglantiSatiri";
import { DateStrip } from "../../src/components/DateStrip";
import { Ikon } from "../../src/components/Ikon";
import { Bos, Iskelet, MealCard } from "../../src/components/MealCard";
import { MealToggle } from "../../src/components/MealToggle";
import { hataliMenuAdresi } from "../../src/config/baglantilar";
import { ilBul } from "../../src/data/iller";
import { oyAnahtari } from "../../src/degerlendirme/DegerlendirmeProvider";
import { OySatiri } from "../../src/degerlendirme/OySatiri";
import { useGun } from "../../src/gun/GunProvider";
import { selamlama } from "../../src/lib/selam";
import { ayAnahtari, ayinGunleri, gunEkle, kisaTarih, tarihParcalari } from "../../src/lib/tarih";
import { useMenuDeposu } from "../../src/menu/MenuProvider";
import { OGUN_BASLIK } from "../../src/menu/ogun";
import { ogunMetni, ogunVar } from "../../src/menu/ozet";
import { PaylasDugmesi } from "../../src/paylas/PaylasDugmesi";
import { useTercih } from "../../src/tercih/TercihProvider";
import { bosluk, yaricap } from "../../src/theme/tokens";
import { useTema } from "../../src/theme/ThemeProvider";

export default function MenuEkrani() {
  const tema = useTema();
  const tercih = useTercih();
  const gun = useGun();
  const depo = useMenuDeposu();
  const [uyari, setUyari] = useState<string | null>(null);
  const il = ilBul(tercih.il ?? "");
  const ay = ayAnahtari(gun.tarih);
  const dosya = tercih.il ? depo.dosya(tercih.il, ay) : null;
  const gorunum = tercih.il ? depo.gorunum(tercih.il, ay) : "il-yok";
  const gunKaydi = dosya?.gunler[gun.tarih];
  const ogun = gunKaydi?.[gun.ogun];
  const menuVar = ogunVar(ogun);

  useEffect(() => {
    if (tercih.il) depo.izle(tercih.il, ay);
  }, [ay, depo.izle, tercih.il]);

  const parca = tarihParcalari(gun.tarih);
  const yarin = gunEkle(gun.bugun, 1);
  const ustBaslik =
    gun.tarih === gun.bugun
      ? selamlama(gun.ogun, tercih.ad)
      : gun.tarih === yarin
        ? "Yarın"
        : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }} edges={["top"]}>
      {/* Ayarlar sekmede duruyor; üstte ikinci bir giriş eklenmedi. */}
      <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x2, flexDirection: "row", alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="İl değiştir"
          onPress={() => router.push("/il")}
          style={{
            minHeight: 40,
            flexDirection: "row",
            alignItems: "center",
            gap: bosluk.x2,
            paddingLeft: bosluk.x3,
            paddingRight: bosluk.x2,
            borderRadius: yaricap.tam,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: tema.kenar,
            backgroundColor: tema.yuzey,
          }}
        >
          <Ikon ad="location-outline" boyut={15} renk={tema.aksan} />
          <Text style={{ color: tema.metin, fontSize: 15 }}>{il?.ad ?? "İl seç"}</Text>
          <Ikon ad="chevron-down" boyut={15} renk={tema.soluk} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x3, paddingBottom: bosluk.x2 }}>
        {ustBaslik ? (
          <Text style={{ color: tema.aksan, fontSize: 12, letterSpacing: 1, marginBottom: 2 }}>
            {ustBaslik.toLocaleUpperCase("tr-TR")}
          </Text>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: bosluk.x2, flexWrap: "wrap" }}>
          <Text style={{ color: tema.metin, fontSize: 30, lineHeight: 36, fontWeight: "600", letterSpacing: -0.5 }}>
            {parca.gunAy}
          </Text>
          <Text style={{ color: tema.soluk, fontSize: 17, lineHeight: 24 }}>{parca.gunAdi}</Text>
        </View>
      </View>

      <DateStrip gunler={ayinGunleri(ay)} secili={gun.tarih} bugun={gun.bugun} onSec={gun.tarihSec} />
      <View style={{ height: bosluk.x2 }} />
      <MealToggle secili={gun.ogun} onSec={gun.ogunSec} />

      <ScrollView contentContainerStyle={{ paddingTop: bosluk.x3, paddingBottom: bosluk.x6 }}>
        {gorunum === "bekliyor" ? (
          <Iskelet />
        ) : gorunum === "internet" ? (
          <Bos metin="İlk menüyü indirmek için internete bağlan." />
        ) : gorunum === "il-yok" ? (
          <Bos metin="Bu ilin menüsü henüz yok. Ayarlardan menü gönderebilirsin." />
        ) : gorunum === "ay-yok" || !dosya ? (
          <Bos metin="Bu ayın menüsü henüz yayınlanmadı." />
        ) : !gunKaydi || !ogun ? (
          <Bos metin="Bu gün için menü yok." />
        ) : (
          <MealCard
            ogun={ogun}
            onKalori={() => router.push({ pathname: "/kalori", params: { tarih: gun.tarih, ogun: gun.ogun } })}
          />
        )}

        {menuVar && ogun && tercih.il ? (
          <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x3, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: bosluk.x3 }}>
            <OySatiri anahtar={oyAnahtari(tercih.il, gun.tarih, gun.ogun)} />
            <PaylasDugmesi
              il={il?.ad ?? ""}
              tarih={gun.tarih}
              ogunAdi={OGUN_BASLIK[gun.ogun]}
              ogun={ogun}
              onUyari={setUyari}
            />
          </View>
        ) : null}
        {uyari ? (
          <Text style={{ color: tema.soluk, fontSize: 13, paddingHorizontal: bosluk.x4, paddingTop: bosluk.x2 }}>{uyari}</Text>
        ) : null}

        {menuVar && ogun ? (
          <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x2 }}>
            <BaglantiSatiri
              adres={hataliMenuAdresi(il?.ad ?? "", gun.tarih, OGUN_BASLIK[gun.ogun], ogunMetni(ogun), tercih.ad)}
              etiket="Menü yanlış mı? Bildir"
              ikon="alert-circle-outline"
            />
          </View>
        ) : null}

        <Text style={{ color: tema.soluk, fontSize: 12, lineHeight: 18, paddingHorizontal: bosluk.x4, paddingTop: bosluk.x2 }}>
          {dosya ? `Son güncelleme: ${kisaTarih(dosya.guncellenmeTarihi)}. ` : ""}
          Resmî uygulama değildir. Yemekhanedeki ilan esastır.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
