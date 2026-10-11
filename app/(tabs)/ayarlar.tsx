import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BildirimAyari } from "../../src/bildirim/plan";
import { bildirimKullanilabilir, izinAl } from "../../src/bildirim/servis";
import { BaglantiSatiri } from "../../src/components/BaglantiSatiri";
import { BildirimSatiri } from "../../src/components/BildirimSatiri";
import { Ikon } from "../../src/components/Ikon";
import { menuGonderAdresi, sehirTalebiMektubu } from "../../src/config/baglantilar";
import { ilBul } from "../../src/data/iller";
import { useDegerlendirme } from "../../src/degerlendirme/DegerlendirmeProvider";
import type { OgunAdi } from "../../src/lib/tarih";
import { AD_EN_FAZLA, useTercih, type TemaSecimi } from "../../src/tercih/TercihProvider";
import { bosluk, golge, yaricap } from "../../src/theme/tokens";
import { useTema } from "../../src/theme/ThemeProvider";

const temaSecenekleri: { id: TemaSecimi; ad: string }[] = [
  { id: "sistem", ad: "Sistem" },
  { id: "gunduz", ad: "Gündüz" },
  { id: "gece", ad: "Gece" },
];

const ogunler: { id: OgunAdi; ad: string }[] = [
  { id: "kahvalti", ad: "Kahvaltı hatırlatması" },
  { id: "aksam", ad: "Akşam hatırlatması" },
];

export default function Ayarlar() {
  const tema = useTema();
  const tercih = useTercih();
  const il = ilBul(tercih.il ?? "");
  const { sayim } = useDegerlendirme();
  const [ad, setAd] = useState(tercih.ad);
  const [izinYok, setIzinYok] = useState(false);
  const [bildirimVar, setBildirimVar] = useState(true);

  useEffect(() => {
    let iptal = false;
    void bildirimKullanilabilir().then((varMi) => {
      if (!iptal) setBildirimVar(varMi);
    });
    return () => {
      iptal = true;
    };
  }, []);

  const bildirimDegis = (ogun: OgunAdi, ayar: BildirimAyari) => {
    if (!ayar.acik) {
      void tercih.bildirimAyarla(ogun, ayar);
      return;
    }
    void (async () => {
      if (!(await izinAl())) {
        setIzinYok(true);
        return;
      }
      setIzinYok(false);
      await tercih.bildirimAyarla(ogun, ayar);
    })();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: bosluk.x4, paddingBottom: bosluk.x8, gap: bosluk.x6 }}>
        <Text style={{ color: tema.metin, fontSize: 30, lineHeight: 36, fontWeight: "600", letterSpacing: -0.5 }}>
          Ayarlar
        </Text>

        <Bolum baslik="Takma ad">
          <TextInput
            value={ad}
            onChangeText={setAd}
            onBlur={() => void tercih.adSec(ad)}
            onSubmitEditing={() => void tercih.adSec(ad)}
            placeholder="Örn. Yafes"
            placeholderTextColor={tema.soluk}
            accessibilityLabel="Takma ad"
            autoCorrect={false}
            maxLength={AD_EN_FAZLA}
            returnKeyType="done"
            style={{
              minHeight: 48,
              borderRadius: yaricap.kucuk,
              backgroundColor: tema.yuzey2,
              color: tema.metin,
              fontSize: 17,
              paddingHorizontal: bosluk.x4,
            }}
          />
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>
            Menü ekranında seni adınla selamlamak için. Yalnızca bu telefonda tutulur, hesap
            açılmaz, kimseye gönderilmez.
          </Text>
        </Bolum>

        <Bolum baslik="Görünüm">
          <View style={{ flexDirection: "row", backgroundColor: tema.yuzey2, borderRadius: yaricap.orta, padding: bosluk.x1 }}>
            {temaSecenekleri.map((secenek) => {
              const aktif = tercih.tema === secenek.id;
              return (
                <Pressable
                  key={secenek.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aktif }}
                  onPress={() => void tercih.temaSec(secenek.id)}
                  style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: yaricap.kucuk, backgroundColor: aktif ? tema.yuzey : "transparent" }}
                >
                  <Text style={{ color: aktif ? tema.aksan : tema.soluk, fontSize: 15 }}>{secenek.ad}</Text>
                </Pressable>
              );
            })}
          </View>
        </Bolum>

        <Bolum baslik="Hatırlatma">
          {ogunler.map((ogun) => (
            <BildirimSatiri
              key={ogun.id}
              baslik={ogun.ad}
              ayar={tercih.bildirim[ogun.id]}
              onDegis={(ayar) => bildirimDegis(ogun.id, ayar)}
              kapali={!bildirimVar}
            />
          ))}
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>
            {!bildirimVar
              ? "Hatırlatma bu ortamda kurulamıyor. Expo Go yerine geliştirme derlemesi veya mağaza sürümü gerekiyor."
              : izinYok
                ? "Bildirim izni kapalı. Telefon ayarlarından izin verebilirsin."
                : "O günün menüsü seçtiğin saatte bildirim olarak gelir. Menü açıklanmamışsa bildirim gönderilmez."}
          </Text>
        </Bolum>

        <Bolum baslik="Katkı">
          <BaglantiSatiri adres={menuGonderAdresi(il?.ad ?? "", tercih.ad)} etiket="Yurdumun menüsünü gönder" ikon="mail-outline" />
          <BaglantiSatiri adres={sehirTalebiMektubu("", tercih.ad)} etiket="Şehrim listede yok" ikon="location-outline" />
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>
            Yurdundaki aylık listenin fotoğrafını gönderirsen o ili ekleyebiliriz. Gelen liste
            kontrol edilmeden yayınlanmaz.
          </Text>
        </Bolum>

        <Bolum baslik="Beğenilerim">
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>
            {sayim.begendi + sayim.begenmedi === 0
              ? "Henüz öğün puanlamadın. Menü ekranındaki başparmaklarla beğendiğin öğünleri işaretleyebilirsin."
              : `${sayim.begendi} beğeni, ${sayim.begenmedi} beğenmeme. Bu notlar yalnızca bu telefonda tutulur, kimseyle paylaşılmaz.`}
          </Text>
        </Bolum>

        <Bolum baslik="Yurt">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="İl değiştir"
            onPress={() => router.push("/il")}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: bosluk.x3 }}
          >
            <Ikon ad="location-outline" boyut={18} renk={tema.aksan} />
            <Text style={{ flex: 1, color: tema.metin, fontSize: 17 }}>{il?.ad ?? "Seçilmedi"}</Text>
            <Text style={{ color: tema.soluk, fontSize: 13 }}>Değiştir</Text>
            <Ikon ad="chevron-forward" boyut={16} renk={tema.soluk} />
          </Pressable>
        </Bolum>

        <View style={{ gap: bosluk.x2, paddingHorizontal: bosluk.x1 }}>
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 19 }}>
            Bu uygulama Gençlik ve Spor Bakanlığı veya KYK'nın resmî uygulaması değildir. Menüler yurtlarda ilan edilen listelerden derlenir; hatalı veya eksik olabilir, yemekhanedeki ilan esastır. Yemek çizimleri temsilidir, o günkü yemeğin fotoğrafı değildir.
          </Text>
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 19 }}>
            Şimdilik yüklü menüsü olan il İstanbul. Diğer iller eklendikçe burada açılır. Uygulama adı henüz seçilmedi.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Başlık kartın dışında küçük büyük harf, içerik yüzey kartında. Ayarlar
 * böylece düz bir metin yığını yerine gruplanmış bir liste gibi okunuyor.
 */
function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  const tema = useTema();
  return (
    <View style={{ gap: bosluk.x2 }}>
      <Text style={{ color: tema.soluk, fontSize: 12, letterSpacing: 0.8, paddingHorizontal: bosluk.x1 }}>
        {baslik.toLocaleUpperCase("tr-TR")}
      </Text>
      <View
        style={[
          {
            gap: bosluk.x3,
            padding: bosluk.x4,
            borderRadius: yaricap.buyuk,
            backgroundColor: tema.yuzey,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: tema.kenar,
          },
          golge(tema),
        ]}
      >
        {children}
      </View>
    </View>
  );
}
