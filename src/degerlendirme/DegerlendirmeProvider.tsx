import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { OgunAdi } from "../lib/tarih";

const ANAHTAR = "degerlendirme:v1";

export type Oy = "begendi" | "begenmedi";

/**
 * Oylar şimdilik yalnızca cihazda. Ortak puan göstermek sunucu, moderasyon ve
 * gizlilik metni değişikliği gerektiriyor; o karar verilene kadar depo arayüzü
 * aynı kalacak şekilde ayrıldı.
 */
interface Degerlendirme {
  oy: (anahtar: string) => Oy | null;
  oyVer: (anahtar: string, oy: Oy) => void;
  sayim: { begendi: number; begenmedi: number };
}

const DegerlendirmeBaglami = createContext<Degerlendirme | null>(null);

export function oyAnahtari(il: string, tarih: string, ogun: OgunAdi): string {
  return `${il}:${tarih}:${ogun}`;
}

function kayitOku(ham: string | null): Record<string, Oy> {
  if (!ham) return {};
  try {
    const json = JSON.parse(ham) as Record<string, unknown>;
    const temiz: Record<string, Oy> = {};
    for (const [anahtar, deger] of Object.entries(json)) {
      if (deger === "begendi" || deger === "begenmedi") temiz[anahtar] = deger;
    }
    return temiz;
  } catch {
    return {};
  }
}

export function DegerlendirmeProvider({ children }: { children: ReactNode }) {
  const [oylar, setOylar] = useState<Record<string, Oy>>({});

  useEffect(() => {
    AsyncStorage.getItem(ANAHTAR)
      .then((ham) => setOylar(kayitOku(ham)))
      .catch(() => setOylar({}));
  }, []);

  const oyVer = useCallback((anahtar: string, oy: Oy) => {
    setOylar((eski) => {
      const sonraki = { ...eski };
      if (sonraki[anahtar] === oy) delete sonraki[anahtar];
      else sonraki[anahtar] = oy;
      void AsyncStorage.setItem(ANAHTAR, JSON.stringify(sonraki));
      return sonraki;
    });
  }, []);

  const deger = useMemo<Degerlendirme>(() => {
    const degerler = Object.values(oylar);
    return {
      oy: (anahtar) => oylar[anahtar] ?? null,
      oyVer,
      sayim: {
        begendi: degerler.filter((oy) => oy === "begendi").length,
        begenmedi: degerler.filter((oy) => oy === "begenmedi").length,
      },
    };
  }, [oyVer, oylar]);

  return <DegerlendirmeBaglami.Provider value={deger}>{children}</DegerlendirmeBaglami.Provider>;
}

export function useDegerlendirme(): Degerlendirme {
  const deger = useContext(DegerlendirmeBaglami);
  if (!deger) throw new Error("Degerlendirme saglayicisi yok");
  return deger;
}
