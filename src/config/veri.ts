import Constants from "expo-constants";

/** `npm run serve:data` bu portta `publish/` klasörünü sunar. */
export const YEREL_VERI_PORTU = 8090;

/**
 * Geliştirmede Metro'nun çalıştığı bilgisayar (ör. 192.168.1.172:8081) aynı
 * zamanda veri sunucusudur; telefon ona aynı yerel ağdan ulaşır.
 */
function yerelAdres(): string {
  if (!__DEV__) return "";
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:${YEREL_VERI_PORTU}` : "";
}

/**
 * Menü dosyalarının yayın kökü: `${DATA_BASE_URL}/v1/manifest.json`.
 * Üretimde EXPO_PUBLIC_DATA_BASE_URL ile verilir; boşsa ağ isteği yapılmaz.
 */
export const DATA_BASE_URL = (process.env.EXPO_PUBLIC_DATA_BASE_URL || yerelAdres()).replace(/\/+$/, "");
