import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { BildirimIsi } from "./plan";

const KANAL = "menu";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function kanalKur(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(KANAL, {
    name: "Menü hatırlatması",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

/** İzin verilmişse true. Sorulmamışsa bir kez sorar. */
export async function izinAl(): Promise<boolean> {
  const mevcut = await Notifications.getPermissionsAsync();
  if (mevcut.granted) return true;
  if (!mevcut.canAskAgain) return false;
  const sonuc = await Notifications.requestPermissionsAsync();
  return sonuc.granted;
}

export async function izinVarMi(): Promise<boolean> {
  const mevcut = await Notifications.getPermissionsAsync();
  return mevcut.granted;
}

export async function tumunuIptal(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Eski planı silip yenisini kurar. Kısmi güncelleme yok; plan tek parça. */
export async function planUygula(isler: BildirimIsi[]): Promise<void> {
  await kanalKur();
  await tumunuIptal();
  for (const is of isler) {
    await Notifications.scheduleNotificationAsync({
      identifier: is.kimlik,
      content: { title: is.baslik, body: is.govde, sound: false, data: { tarih: is.tarih, ogun: is.ogun } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: is.an, channelId: KANAL },
    });
  }
}
