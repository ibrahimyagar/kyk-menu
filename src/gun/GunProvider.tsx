import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { acilisGorunumu, istanbulTarih, type OgunAdi } from "../lib/tarih";

interface GunDurum {
  tarih: string;
  ogun: OgunAdi;
  bugun: string;
  tarihSec: (tarih: string) => void;
  ogunSec: (ogun: OgunAdi) => void;
}

const GunBaglami = createContext<GunDurum | null>(null);

export function GunProvider({ children }: { children: ReactNode }) {
  const acilis = useMemo(() => acilisGorunumu(new Date()), []);
  const bugun = useMemo(() => istanbulTarih(new Date()), []);
  const [tarih, setTarih] = useState(acilis.tarih);
  const [ogun, setOgun] = useState<OgunAdi>(acilis.ogun);
  const deger = useMemo(
    () => ({ tarih, ogun, bugun, tarihSec: setTarih, ogunSec: setOgun }),
    [bugun, ogun, tarih],
  );
  return <GunBaglami.Provider value={deger}>{children}</GunBaglami.Provider>;
}

export function useGun(): GunDurum {
  const deger = useContext(GunBaglami);
  if (!deger) throw new Error("Gun saglayicisi yok");
  return deger;
}
