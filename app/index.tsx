import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CityPicker } from "../src/components/CityPicker";
import { Iskelet } from "../src/components/MealCard";
import { useTercih } from "../src/tercih/TercihProvider";
import { useTema } from "../src/theme/ThemeProvider";

export default function Giris() {
  const tercih = useTercih();
  const tema = useTema();
  if (!tercih.hazir) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }}>
        <Iskelet />
      </SafeAreaView>
    );
  }
  if (tercih.il) return <Redirect href="/(tabs)" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tema.bg }}>
      <CityPicker onSelect={(slug) => void tercih.ilSec(slug)} />
    </SafeAreaView>
  );
}
