import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { ayAnahtari, type OgunAdi } from "../lib/tarih";
import { useMenuDeposu } from "../menu/MenuProvider";
import { useTercih } from "../tercih/TercihProvider";
import { bildirimPlani, planImzasi } from "./plan";
import { izinVarMi, planUygula, tumunuIptal } from "./servis";

const GUN_SAYISI = 14;
/** iOS bekleyen bildirim sınırı 64; altında kalıyoruz. */
const EN_FAZLA = 56;

/**
 * Bildirim planını kurar. Ekran çizmez.
 * Her açılışta ve uygulama öne geldiğinde yeniden kurulur, çünkü iOS
 * yalnızca sınırlı sayıda bekleyen bildirim tutar.
 */
export function BildirimPlanlayici() {
  const tercih = useTercih();
  const depo = useMenuDeposu();
  const imza = useRef<string | null>(null);

  const acikMi = tercih.bildirim.kahvalti.acik || tercih.bildirim.aksam.acik;
  const il = tercih.il;
  const ayarlar = tercih.bildirim;
  const dosyaBul = depo.dosya;

  useEffect(() => {
    if (!tercih.hazir) return;

    const kur = () => {
      void (async () => {
        if (!il || !acikMi) {
          if (imza.current !== "") {
            imza.current = "";
            await tumunuIptal();
          }
          return;
        }
        if (!(await izinVarMi())) return;
        const isler = bildirimPlani({
          simdi: new Date(),
          gunSayisi: GUN_SAYISI,
          enFazla: EN_FAZLA,
          ayarlar,
          ogunBul: (tarih: string, ogun: OgunAdi) => dosyaBul(il, ayAnahtari(tarih))?.gunler[tarih]?.[ogun],
        });
        const yeni = planImzasi(isler);
        if (yeni === imza.current) return;
        imza.current = yeni;
        await planUygula(isler);
      })();
    };

    kur();
    const abone = AppState.addEventListener("change", (durum) => {
      if (durum === "active") kur();
    });
    return () => abone.remove();
  }, [acikMi, ayarlar, dosyaBul, il, tercih.hazir]);

  return null;
}
