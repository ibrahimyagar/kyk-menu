import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { sehirTalebiMektubu } from "../config/baglantilar";
import { ILLER } from "../data/iller";
import { useMenuDeposu } from "../menu/MenuProvider";
import { useTercih } from "../tercih/TercihProvider";
import type { Il } from "../types/domain";
import { bosluk, yaricap } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import { BaglantiSatiri } from "./BaglantiSatiri";
import { Ikon } from "./Ikon";

interface Props {
  onSelect: (slug: string) => void;
}

export function CityPicker({ onSelect }: Props) {
  const tema = useTema();
  const depo = useMenuDeposu();
  const tercih = useTercih();
  const [sorgu, setSorgu] = useState("");
  const liste = useMemo(() => {
    const aranan = sorgu.trim().toLocaleLowerCase("tr-TR");
    const filtre = ILLER.filter((il) => il.ad.toLocaleLowerCase("tr-TR").includes(aranan));
    return [...filtre].sort((a, b) => {
      const aVar = depo.ildeKayitVar(a.slug) ? 0 : 1;
      const bVar = depo.ildeKayitVar(b.slug) ? 0 : 1;
      if (aVar !== bVar) return aVar - bVar;
      return a.ad.localeCompare(b.ad, "tr");
    });
  }, [depo, sorgu]);

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <Text
        style={{
          color: tema.metin,
          fontSize: 30,
          lineHeight: 38,
          fontWeight: "600",
          letterSpacing: -0.5,
          paddingHorizontal: bosluk.x4,
          paddingTop: bosluk.x6,
        }}
      >
        Hangi ilde yurtta kalıyorsun?
      </Text>
      <Text style={{ color: tema.soluk, fontSize: 15, lineHeight: 22, paddingHorizontal: bosluk.x4, paddingTop: bosluk.x2, paddingBottom: bosluk.x4 }}>
        Bir kez seçilir. Sonraki açılışta menü doğrudan gelir.
      </Text>
      <TextInput
        value={sorgu}
        onChangeText={setSorgu}
        placeholder="İl ara"
        placeholderTextColor={tema.soluk}
        accessibilityLabel="İl ara"
        autoCorrect={false}
        style={{
          marginHorizontal: bosluk.x4,
          minHeight: 48,
          borderRadius: yaricap.orta,
          borderWidth: 1,
          borderColor: tema.kenar,
          backgroundColor: tema.yuzey,
          color: tema.metin,
          fontSize: 17,
          paddingHorizontal: bosluk.x4,
          marginBottom: bosluk.x3,
        }}
      />
      <FlatList
        data={liste}
        keyExtractor={(il) => il.slug}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <IlSatiri il={item} onSelect={onSelect} />}
        ListEmptyComponent={
          <Text style={{ color: tema.soluk, fontSize: 15, lineHeight: 22, paddingHorizontal: bosluk.x4, paddingBottom: bosluk.x3 }}>
            "{sorgu.trim()}" için il bulunamadı.
          </Text>
        }
        ListFooterComponent={
          <View style={{ paddingHorizontal: bosluk.x4, paddingTop: bosluk.x4, paddingBottom: bosluk.x8, gap: bosluk.x1 }}>
            <BaglantiSatiri
              adres={sehirTalebiMektubu(sorgu.trim(), tercih.ad)}
              etiket="Şehrini bulamadın mı? Bize yaz"
              ikon="mail-outline"
            />
            <Text style={{ color: tema.soluk, fontSize: 13, lineHeight: 18 }}>
              Menüsü yüklü olmayan iller "Yakında" olarak görünür. Yurdundaki listeyi gönderirsen o
              ili önce ekleriz.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function IlSatiri({ il, onSelect }: { il: Il; onSelect: (slug: string) => void }) {
  const tema = useTema();
  const depo = useMenuDeposu();
  const varMi = depo.ildeKayitVar(il.slug);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={varMi ? il.ad : `${il.ad}, yakında`}
      onPress={() => onSelect(il.slug)}
      style={{ minHeight: 52, paddingHorizontal: bosluk.x4, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
    >
      <Text style={{ color: varMi ? tema.metin : tema.soluk, fontSize: 17 }}>{il.ad}</Text>
      {varMi ? (
        <Ikon ad="chevron-forward" boyut={16} renk={tema.soluk} />
      ) : (
        <Text style={{ color: tema.soluk, fontSize: 13 }}>Yakında</Text>
      )}
    </Pressable>
  );
}
