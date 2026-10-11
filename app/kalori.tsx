import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ikon } from "../src/components/Ikon";
import { YemekGorseli } from "../src/components/YemekGorseli";
import { ilBul } from "../src/data/iller";
import { ayAnahtari, turkceTarih, type OgunAdi } from "../src/lib/tarih";
import { dilimToplami, kaloriDilimleri } from "../src/menu/kalori";
import { useMenuDeposu } from "../src/menu/MenuProvider";
import { OGUN_BASLIK } from "../src/menu/ogun";
import { grupMetni, ogunVar } from "../src/menu/ozet";
import { useTercih } from "../src/tercih/TercihProvider";
import { bosluk, yaricap } from "../src/theme/tokens";
import { useTema } from "../src/theme/ThemeProvider";

export default function KaloriEkrani() {
  const tema = useTema();
  const tercih = useTercih();
  const depo = useMenuDeposu();
  const parametre = useLocalSearchParams<{ tarih?: string; ogun?: string }>();
  const tarih = parametre.tarih ?? "";
  const ogunAdi: OgunAdi = parametre.ogun === "aksam" ? "aksam" : "kahvalti";
  const il = ilBul(tercih.il ?? "");
  const ogun = tercih.il && tarih ? depo.dosya(tercih.il, ayAnahtari(tarih))?.gunler[tarih]?.[ogunAdi] : undefined;
  const dilimler = ogunVar(ogun) && ogun ? kaloriDilimleri(ogun.gruplar) : [];
  const hesaplanan = dilimToplami(dilimler);
  const toplam = ogun?.toplamKcal ?? (dilimler.length > 0 ? hesaplanan : null);
  const enBuyuk = dilimler.reduce((en, dilim) => Math.max(en, dilim.kcal), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }} edges={["top"]}>
      <View style={{ minHeight: 48, paddingHorizontal: bosluk.x2, flexDirection: "row", alignItems: "center", gap: bosluk.x1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          onPress={() => router.back()}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          <Ikon ad="chevron-back" boyut={24} renk={tema.metin} />
        </Pressable>
        <Text style={{ color: tema.metin, fontSize: 17 }}>Kalori dağılımı</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: bosluk.x4, paddingBottom: bosluk.x8, gap: bosluk.x4 }}>
        <View>
          <Text style={{ color: tema.soluk, fontSize: 13 }}>
            {il?.ad ?? ""} · {OGUN_BASLIK[ogunAdi]}
          </Text>
          <Text style={{ color: tema.metin, fontSize: 22, lineHeight: 30 }}>{tarih ? turkceTarih(tarih) : ""}</Text>
        </View>

        {toplam == null ? (
          <View style={{ padding: bosluk.x4, borderRadius: yaricap.orta, backgroundColor: tema.yuzey, borderWidth: 1, borderColor: tema.kenar, gap: bosluk.x2 }}>
            <Text style={{ color: tema.metin, fontSize: 17, lineHeight: 24 }}>Bu öğün için kalori yayınlanmadı.</Text>
            <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 20 }}>
              Kalori yalnızca kaynak listede yazıyorsa gösterilir. Tahmin üretmiyoruz.
            </Text>
          </View>
        ) : (
          <>
            <View style={{ alignItems: "center", paddingVertical: bosluk.x2 }}>
              <Text style={{ color: tema.metin, fontSize: 40, lineHeight: 48 }}>{toplam}</Text>
              <Text style={{ color: tema.soluk, fontSize: 13 }}>kcal · bu öğünün tamamı</Text>
            </View>

            <View style={{ borderRadius: yaricap.orta, backgroundColor: tema.yuzey, borderWidth: 1, borderColor: tema.kenar, paddingHorizontal: bosluk.x4, paddingVertical: bosluk.x2 }}>
              {dilimler.map((dilim, sira) => {
                const grup = ogun?.gruplar.find(
                  (aday) => (aday.baslik ?? dilim.kategori?.ad ?? "Diğer") === dilim.baslik,
                );
                const renk = dilim.kategori?.renk ?? tema.aksan;
                return (
                  <View
                    key={`${dilim.baslik}-${sira}`}
                    style={{
                      flexDirection: "row",
                      gap: bosluk.x3,
                      paddingVertical: bosluk.x3,
                      borderTopWidth: sira === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: tema.kenar,
                    }}
                  >
                    <YemekGorseli kategori={dilim.kategori} boyut={40} />
                    <View style={{ flex: 1, gap: bosluk.x2 }}>
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: bosluk.x3 }}>
                        <Text style={{ flex: 1, color: tema.metin, fontSize: 16, lineHeight: 22 }}>
                          {dilim.baslik}
                        </Text>
                        <Text style={{ color: tema.metin, fontSize: 16 }}>{dilim.kcal}</Text>
                        <Text style={{ color: tema.soluk, fontSize: 12, width: 38, textAlign: "right" }}>
                          %{Math.round((dilim.kcal / hesaplanan) * 100)}
                        </Text>
                      </View>
                      {grup ? (
                        <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 19 }}>{grupMetni(grup)}</Text>
                      ) : null}
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: tema.yuzey2, overflow: "hidden" }}>
                        <View
                          style={{
                            width: `${enBuyuk > 0 ? (dilim.kcal / enBuyuk) * 100 : 0}%`,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: renk,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 20 }}>
              Sayılar yurdun yayınladığı listeden alınır. Seçmeli gruplarda kaynak tek bir değer
              veriyor, o değer her seçeneğe yazılıdır. Aldığın porsiyona göre gerçek değer değişir.
            </Text>
            {toplam !== hesaplanan ? (
              <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 20 }}>
                Kaynakta yazan toplam {toplam} kcal; gruplardan toplanan {hesaplanan} kcal. Fark,
                listede ayrı satır olarak geçen ek porsiyonlardan geliyor.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
