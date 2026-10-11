import { Text, View } from "react-native";
import { bosluk } from "../theme/tokens";
import { useTema } from "../theme/ThemeProvider";
import type { Grup } from "../types/domain";

/**
 * Grup başına tek satır. Grup etiketi ("Yumurta", "Hamur işi") yazılmaz;
 * yemeğin adı neyi yediğini zaten söylüyor, etiket satırı daraltıyordu.
 * Kalori de burada değil: kart altındaki şerit toplamı, detay sayfası
 * dağılımı gösteriyor.
 */
export function YemekListesi({ gruplar }: { gruplar: Grup[] }) {
  const tema = useTema();

  return (
    <>
      {gruplar.map((grup, index) => (
        <View
          key={`${grup.baslik ?? "grup"}-${index}`}
          style={{ flexDirection: "row", alignItems: "flex-start", gap: bosluk.x3, paddingVertical: bosluk.x2 }}
        >
          {/* Satır ritmi için nokta; hizası ilk satırın orta yüksekliğinde. */}
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: tema.aksan,
              opacity: 0.45,
              marginTop: 10,
            }}
          />
          <Text style={{ flex: 1, color: tema.metin, fontSize: 17, lineHeight: 24 }}>
            {grup.secenekler.map((secenek, sira) => (
              <Text key={`${secenek.ad}-${sira}`}>
                {sira > 0 ? (
                  <Text style={{ color: tema.soluk, fontSize: 15 }}>
                    {grup.secim === "biri" ? " veya " : ", "}
                  </Text>
                ) : null}
                {secenek.ad}
              </Text>
            ))}
          </Text>
        </View>
      ))}
    </>
  );
}
