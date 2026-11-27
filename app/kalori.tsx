import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ikon } from "../src/components/Ikon";
import { KaloriSatiri } from "../src/components/KaloriSatiri";
import { ilBul } from "../src/data/iller";
import { ayAnahtari, turkceTarih, type OgunAdi } from "../src/lib/tarih";
import { dilimToplami, ogunKaloriOzeti } from "../src/menu/kalori";
import { kategoriBul } from "../src/menu/kategori";
import { useMenuDeposu } from "../src/menu/MenuProvider";
import { OGUN_BASLIK } from "../src/menu/ogun";
import { grupMetni, ogunVar } from "../src/menu/ozet";
import { useTercih } from "../src/tercih/TercihProvider";
import { bosluk, yaricap } from "../src/theme/tokens";
import { useTema } from "../src/theme/ThemeProvider";
import type { Grup, Ogun } from "../src/types/domain";

export default function KaloriEkrani() {
  const tema = useTema();
  const tercih = useTercih();
  const depo = useMenuDeposu();
  const parametre = useLocalSearchParams<{ tarih?: string; ogun?: string }>();
  const tarih = parametre.tarih ?? "";
  const ogunAdi: OgunAdi = parametre.ogun === "aksam" ? "aksam" : "kahvalti";
  const il = ilBul(tercih.il ?? "");
  const ogun = tercih.il && tarih ? depo.dosya(tercih.il, ayAnahtari(tarih))?.gunler[tarih]?.[ogunAdi] : undefined;
  const ozet = ogunVar(ogun) && ogun ? ogunKaloriOzeti(ogun) : { dilimler: [], toplam: null, aralik: null };
  const { dilimler, toplam, aralik } = ozet;
  const hesaplanan = dilimToplami(dilimler);
  const secmeliVar = dilimler.some((dilim) => dilim.aralik);
  const enBuyuk = dilimler.reduce((en, dilim) => Math.max(en, dilim.aralik?.max ?? dilim.kcal), 0);

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

        {toplam != null ? (
          <>
            <BuyukSayi deger={String(toplam)} alt="kcal · bu öğünün tamamı" />
            <Liste>
              {dilimler.map((dilim, sira) => (
                <KaloriSatiri
                  key={`${dilim.baslik}-${sira}`}
                  ilk={sira === 0}
                  kategori={dilim.kategori}
                  baslik={dilim.baslik}
                  metin={dilim.aralik ? secenekKalorileri(dilim.grup) : grupMetni(dilim.grup)}
                  deger={dilim.aralik ? `${dilim.aralik.min}–${dilim.aralik.max}` : String(dilim.kcal)}
                  yuzde={secmeliVar ? undefined : Math.round((dilim.kcal / hesaplanan) * 100)}
                  oran={dilim.aralik || enBuyuk === 0 ? undefined : dilim.kcal / enBuyuk}
                />
              ))}
            </Liste>
            <Not>
              Sayılar kaynağın yayınladığı listeden alınır. Aldığın porsiyona ve seçtiğin yemeğe göre gerçek değer
              değişir.
            </Not>
            {secmeliVar && toplam === hesaplanan ? (
              <Not>
                Kaynağın toplamı, seçmeli gruplarda ilk seçenek alınarak hesaplanmış. Başka seçenek alırsan toplam
                değişir.
              </Not>
            ) : null}
            {toplam !== hesaplanan ? (
              <Not>
                Kaynakta yazan toplam {toplam} kcal; gruplardan toplanan {hesaplanan} kcal. Kalorisi yazılmayan
                satırlar olabilir; farkı düzeltmiyoruz, kaynaktaki toplamı gösteriyoruz.
              </Not>
            ) : null}
          </>
        ) : aralik && ogun ? (
          <>
            <BuyukSayi deger={`${aralik.min}–${aralik.max}`} alt="kcal · kaynağın verdiği aralık" />
            <OgunListesi ogun={ogun} />
            <Not>
              Bu öğün için kaynak yemek başına kalori yayınlamadı, yalnızca öğünün {aralik.min}–{aralik.max} kcal
              aralığını verdi. Yemek başına sayı uydurmuyoruz; kaynak yayınlarsa burada kahvaltıdaki gibi görünür.
            </Not>
          </>
        ) : (
          <View style={{ padding: bosluk.x4, borderRadius: yaricap.orta, backgroundColor: tema.yuzey, borderWidth: 1, borderColor: tema.kenar, gap: bosluk.x2 }}>
            <Text style={{ color: tema.metin, fontSize: 17, lineHeight: 24 }}>Bu öğün için kalori yayınlanmadı.</Text>
            <Not>Kalori yalnızca kaynak listede yazıyorsa gösterilir. Tahmin üretmiyoruz.</Not>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BuyukSayi({ deger, alt }: { deger: string; alt: string }) {
  const tema = useTema();
  return (
    <View style={{ alignItems: "center", paddingVertical: bosluk.x2 }}>
      <Text style={{ color: tema.metin, fontSize: 40, lineHeight: 48 }}>{deger}</Text>
      <Text style={{ color: tema.soluk, fontSize: 13 }}>{alt}</Text>
    </View>
  );
}

function Liste({ children }: { children: ReactNode }) {
  const tema = useTema();
  return (
    <View
      style={{
        borderRadius: yaricap.orta,
        backgroundColor: tema.yuzey,
        borderWidth: 1,
        borderColor: tema.kenar,
        paddingHorizontal: bosluk.x4,
        paddingVertical: bosluk.x2,
      }}
    >
      {children}
    </View>
  );
}

function OgunListesi({ ogun }: { ogun: Ogun }) {
  return (
    <Liste>
      {ogun.gruplar.map((grup, sira) => {
        const kategori = kategoriBul(grup);
        return (
          <KaloriSatiri
            key={`${grup.baslik ?? "grup"}-${sira}`}
            ilk={sira === 0}
            kategori={kategori}
            baslik={grup.baslik ?? kategori?.ad ?? "Diğer"}
            metin={grupMetni(grup)}
          />
        );
      })}
    </Liste>
  );
}

function secenekKalorileri(grup: Grup): string {
  return grup.secenekler.map((secenek) => `${secenek.ad} ${secenek.kcal ?? "—"}`).join(" · ");
}

function Not({ children }: { children: ReactNode }) {
  const tema = useTema();
  return <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 20 }}>{children}</Text>;
}
