import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CityPicker } from "../src/components/CityPicker";
import { useTercih } from "../src/tercih/TercihProvider";
import { useTema } from "../src/theme/ThemeProvider";

export default function IlSecimi() {
  const tercih = useTercih();
  const tema = useTema();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }}>
      <CityPicker
        onSelect={(slug) => {
          void tercih.ilSec(slug).then(() => router.replace("/(tabs)"));
        }}
      />
    </SafeAreaView>
  );
}
