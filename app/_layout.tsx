import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BildirimPlanlayici } from "../src/bildirim/BildirimPlanlayici";
import { MenuProvider } from "../src/menu/MenuProvider";
import { TercihProvider } from "../src/tercih/TercihProvider";
import { ThemeProvider, useTema } from "../src/theme/ThemeProvider";

function Cerceve() {
  const tema = useTema();
  return (
    <>
      <StatusBar style={tema.ad === "gece" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tema.bg } }} />
    </>
  );
}

export default function Root() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TercihProvider>
          <MenuProvider>
            <ThemeProvider>
              <Cerceve />
            </ThemeProvider>
            <BildirimPlanlayici />
          </MenuProvider>
        </TercihProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
