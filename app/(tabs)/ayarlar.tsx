import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BildirimAyari } from "../../src/bildirim/plan";
import { izinAl } from "../../src/bildirim/servis";
import { BildirimSatiri } from "../../src/components/BildirimSatiri";
import { ilBul } from "../../src/data/iller";
import type { OgunAdi } from "../../src/lib/tarih";
import { useTercih, type TemaSecimi } from "../../src/tercih/TercihProvider";
import { bosluk, yaricap } from "../../src/theme/tokens";
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
  const [izinYok, setIzinYok] = useState(false);

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
        <Text style={{ color: tema.metin, fontSize: 28, lineHeight: 36 }}>Ayarlar</Text>

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
            />
          ))}
          <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>
            {izinYok
              ? "Bildirim izni kapalı. Telefon ayarlarından izin verebilirsin."
              : "O günün menüsü seçtiğin saatte bildirim olarak gelir. Menü açıklanmamışsa bildirim gönderilmez."}
          </Text>
        </Bolum>

        <Pressable accessibilityRole="button" onPress={() => router.push("/il")} style={{ minHeight: 52, justifyContent: "center" }}>
          <Text style={{ color: tema.soluk, fontSize: 13 }}>İl</Text>
          <Text style={{ color: tema.metin, fontSize: 17 }}>{il?.ad ?? "Seçilmedi"}</Text>
        </Pressable>

        <Text style={{ color: tema.soluk, fontSize: 14, lineHeight: 20 }}>
          Bu uygulama Gençlik ve Spor Bakanlığı veya KYK'nın resmî uygulaması değildir. Menüler yurtlarda ilan edilen listelerden derlenir; hatalı veya eksik olabilir, yemekhanedeki ilan esastır.
        </Text>
        <Text style={{ color: tema.soluk, fontSize: 14, lineHeight: 20 }}>
          Şimdilik yüklü menüsü olan il İstanbul. Diğer iller eklendikçe burada açılır. Uygulama adı henüz seçilmedi.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: ReactNode }) {
  const tema = useTema();
  return (
    <View style={{ gap: bosluk.x2 }}>
      <Text style={{ color: tema.soluk, fontSize: 13 }}>{baslik}</Text>
      {children}
    </View>
  );
}
