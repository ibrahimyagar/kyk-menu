import { Redirect, Tabs } from "expo-router";
import { GunProvider } from "../../src/gun/GunProvider";
import { useTercih } from "../../src/tercih/TercihProvider";
import { useTema } from "../../src/theme/ThemeProvider";

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
        <Tabs.Screen name="index" options={{ title: "Menü" }} />
        <Tabs.Screen name="hafta" options={{ title: "Hafta" }} />
        <Tabs.Screen name="ayarlar" options={{ title: "Ayarlar" }} />
      </Tabs>
    </GunProvider>
  );
}
