import Constants from "expo-constants";
import { Platform } from "react-native";
import type { BildirimIsi } from "./plan";

type Modul = typeof import("expo-notifications");

const KANAL = "menu";

/**
 * expo-notifications içe aktarıldığı anda cihaz push kaydını kurmaya çalışıyor
 * ve Expo Go bunu SDK 53'te kaldırdığı için hata atıyor. Metro bu hatayı
 * ölümcül olarak bildirdiği için try/catch kurtarmıyor; modüle hiç
 * dokunmamak gerekiyor.
 *
 * `executionEnvironment` Expo Go ile geliştirme derlemesini ayırt etmiyor
 * (ikisi de "storeClient"), bu yüzden kullanımdan kaldırılmış da olsa
 * `appOwnership` tek güvenilir ayraç.
 */
const EXPO_GO = Constants.appOwnership === "expo";

let yukleme: Promise<Modul | null> | null = null;

function modul(): Promise<Modul | null> {
  if (EXPO_GO) return Promise.resolve(null);
  if (!yukleme) {
    try {
      yukleme = Promise.resolve(import("expo-notifications"))
        .then((gelen) => {
          gelen.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowBanner: true,
              shouldShowList: true,
              shouldPlaySound: false,
              shouldSetBadge: false,
            }),
          });
          return gelen;
        })
        .catch(() => null);
    } catch {
      yukleme = Promise.resolve(null);
    }
  }
  return yukleme;
}

/** Bu ortamda yerel bildirim kurulabiliyor mu. */
export async function bildirimKullanilabilir(): Promise<boolean> {
  return (await modul()) !== null;
}

async function kanalKur(bildirim: Modul): Promise<void> {
  if (Platform.OS !== "android") return;
  await bildirim.setNotificationChannelAsync(KANAL, {
    name: "Menü hatırlatması",
    importance: bildirim.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/** İzin verilmişse true. Sorulmamışsa bir kez sorar. */
export async function izinAl(): Promise<boolean> {
  const bildirim = await modul();
  if (!bildirim) return false;
  const mevcut = await bildirim.getPermissionsAsync();
  if (mevcut.granted) return true;
  if (!mevcut.canAskAgain) return false;
  const sonuc = await bildirim.requestPermissionsAsync();
  return sonuc.granted;
}

export async function izinVarMi(): Promise<boolean> {
  const bildirim = await modul();
  if (!bildirim) return false;
  const mevcut = await bildirim.getPermissionsAsync();
  return mevcut.granted;
}

export async function tumunuIptal(): Promise<void> {
  const bildirim = await modul();
  if (!bildirim) return;
  await bildirim.cancelAllScheduledNotificationsAsync();
}

/** Eski planı silip yenisini kurar. Kısmi güncelleme yok; plan tek parça. */
export async function planUygula(isler: BildirimIsi[]): Promise<void> {
  const bildirim = await modul();
  if (!bildirim) return;
  await kanalKur(bildirim);
  await bildirim.cancelAllScheduledNotificationsAsync();
  for (const is of isler) {
    await bildirim.scheduleNotificationAsync({
      identifier: is.kimlik,
      content: { title: is.baslik, body: is.govde, sound: false, data: { tarih: is.tarih, ogun: is.ogun } },
      trigger: { type: bildirim.SchedulableTriggerInputTypes.DATE, date: is.an, channelId: KANAL },
    });
  }
}
