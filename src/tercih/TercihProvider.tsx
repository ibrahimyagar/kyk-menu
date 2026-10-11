import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BildirimAyari } from "../bildirim/plan";
import type { OgunAdi } from "../lib/tarih";

const ANAHTAR = "tercih";

export type TemaSecimi = "sistem" | "gunduz" | "gece";

export type BildirimAyarlari = Record<OgunAdi, BildirimAyari>;

/** Takma ad yalnızca cihazda durur: selamlama ve e-posta imzası için. */
export const AD_EN_FAZLA = 24;

interface Kayit {
  il: string | null;
  ad: string;
  tema: TemaSecimi;
  bildirim: BildirimAyarlari;
}

interface Tercih extends Kayit {
  hazir: boolean;
  ilSec: (il: string) => Promise<void>;
  adSec: (ad: string) => Promise<void>;
  temaSec: (tema: TemaSecimi) => Promise<void>;
  bildirimAyarla: (ogun: OgunAdi, ayar: BildirimAyari) => Promise<void>;
}

const varsayilan: Kayit = {
  il: null,
  ad: "",
  tema: "sistem",
  bildirim: {
    kahvalti: { acik: false, dakika: 7 * 60 },
    aksam: { acik: false, dakika: 16 * 60 + 30 },
  },
};

const TercihBaglami = createContext<Tercih | null>(null);

function ayarOku(ham: unknown, yedek: BildirimAyari): BildirimAyari {
  if (!ham || typeof ham !== "object") return yedek;
  const kayit = ham as Partial<BildirimAyari>;
  const dakika = typeof kayit.dakika === "number" && kayit.dakika >= 0 && kayit.dakika < 1440 ? Math.floor(kayit.dakika) : yedek.dakika;
  return { acik: kayit.acik === true, dakika };
}

function kayitOku(ham: string | null): Kayit {
  if (!ham) return varsayilan;
  try {
    const json = JSON.parse(ham) as Partial<Kayit>;
    const tema = json.tema === "gunduz" || json.tema === "gece" || json.tema === "sistem" ? json.tema : "sistem";
    const bildirim = json.bildirim as Partial<BildirimAyarlari> | undefined;
    return {
      il: typeof json.il === "string" ? json.il : null,
      ad: typeof json.ad === "string" ? json.ad.slice(0, AD_EN_FAZLA) : "",
      tema,
      bildirim: {
        kahvalti: ayarOku(bildirim?.kahvalti, varsayilan.bildirim.kahvalti),
        aksam: ayarOku(bildirim?.aksam, varsayilan.bildirim.aksam),
      },
    };
  } catch {
    return varsayilan;
  }
}

export function TercihProvider({ children }: { children: ReactNode }) {
  const [kayit, setKayit] = useState<Kayit>(varsayilan);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ANAHTAR)
      .then((ham) => setKayit(kayitOku(ham)))
      .catch(() => setKayit(varsayilan))
      .finally(() => setHazir(true));
  }, []);

  const yaz = useCallback(async (sonraki: Kayit) => {
    setKayit(sonraki);
    await AsyncStorage.setItem(ANAHTAR, JSON.stringify(sonraki));
  }, []);

  const deger = useMemo<Tercih>(
    () => ({
      ...kayit,
      hazir,
      ilSec: (il) => yaz({ ...kayit, il }),
      adSec: (ad) => yaz({ ...kayit, ad: ad.trim().slice(0, AD_EN_FAZLA) }),
      temaSec: (tema) => yaz({ ...kayit, tema }),
      bildirimAyarla: (ogun, ayar) => yaz({ ...kayit, bildirim: { ...kayit.bildirim, [ogun]: ayar } }),
    }),
    [hazir, kayit, yaz],
  );

  return <TercihBaglami.Provider value={deger}>{children}</TercihBaglami.Provider>;
}

export function useTercih(): Tercih {
  const deger = useContext(TercihBaglami);
  if (!deger) throw new Error("Tercih saglayicisi yok");
  return deger;
}
