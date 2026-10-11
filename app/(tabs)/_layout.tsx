import { Redirect, Tabs } from "expo-router";
import type { ColorValue } from "react-native";
import { Ikon, type IkonAdi } from "../../src/components/Ikon";
import { GunProvider } from "../../src/gun/GunProvider";
import { useTercih } from "../../src/tercih/TercihProvider";
import { useTema } from "../../src/theme/ThemeProvider";

/** Seçili sekme dolu, diğerleri çizgi simge: aktif sekme tek bakışta belli olsun. */
function sekmeSimgesi(bos: IkonAdi, dolu: IkonAdi) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ikon ad={focused ? dolu : bos} boyut={22} renk={color} />
  );
}

export default function Sekmeler() {
  const tema = useTema();
  const tercih = useTercih();
  if (!tercih.hazir) return null;
  if (!tercih.il) return <Redirect href="/" />;

  return (
    <GunProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: tema.yuzey,
            borderTopColor: tema.kenar,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: tema.aksan,
          tabBarInactiveTintColor: tema.soluk,
          tabBarLabelStyle: { fontSize: 13 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Menü", tabBarIcon: sekmeSimgesi("restaurant-outline", "restaurant") }} />
        <Tabs.Screen name="hafta" options={{ title: "Hafta", tabBarIcon: sekmeSimgesi("calendar-outline", "calendar") }} />
        <Tabs.Screen name="ayarlar" options={{ title: "Ayarlar", tabBarIcon: sekmeSimgesi("options-outline", "options") }} />
      </Tabs>
    </GunProvider>
  );
}
