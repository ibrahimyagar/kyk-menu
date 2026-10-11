import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DATA_BASE_URL } from "../config/veri";
import { gomuluHarita } from "../data/menuler";
import { ayAnahtari, istanbulTarih } from "../lib/tarih";
import { useTercih } from "../tercih/TercihProvider";
import type { Manifest, MenuDosyasi } from "../types/domain";
import { manifestIndir, menuIndir } from "./ag";
import { dahaGuncel, dahaYeni, ertesiAyOndalik, menuGorunumu, type MenuGorunumu } from "./karar";
import { depoOku, depoYaz } from "./depo";

interface MenuDepo {
  dosya: (il: string, ay: string) => MenuDosyasi | null;
  ildeKayitVar: (il: string) => boolean;
  gorunum: (il: string, ay: string) => MenuGorunumu;
  izle: (il: string, ay: string) => void;
}

const MenuBaglami = createContext<MenuDepo | null>(null);

function katalogBaslangic(): Record<string, number> {
  const harita: Record<string, number> = {};
  for (const dosya of Object.values(gomuluHarita())) harita[`${dosya.il}/${dosya.ay}`] = dosya.surum;
  return harita;
}

function katalogBirlestir(eski: Record<string, number>, manifest: Manifest): Record<string, number> {
  let degisti = false;
  const yeni = { ...eski };
  for (const [il, bilgi] of Object.entries(manifest.iller)) {
    for (const [ay, kayit] of Object.entries(bilgi.aylar)) {
      const anahtar = `${il}/${ay}`;
      const surum = Math.max(yeni[anahtar] ?? 0, kayit.surum);
      if (yeni[anahtar] !== surum) {
        yeni[anahtar] = surum;
        degisti = true;
      }
    }
  }
  return degisti ? yeni : eski;
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const tercih = useTercih();
  const [dosyalar, setDosyalar] = useState<Record<string, MenuDosyasi>>(() => ({ ...gomuluHarita() }));
  const [katalog, setKatalog] = useState<Record<string, number>>(katalogBaslangic);
  const [agKesik, setAgKesik] = useState(false);
  const [manifestHazir, setManifestHazir] = useState(false);
  const [onbellekHazir, setOnbellekHazir] = useState(false);
  const [bekleyen, setBekleyen] = useState<ReadonlySet<string>>(() => new Set());
  const dosyalarRef = useRef(dosyalar);
  dosyalarRef.current = dosyalar;
  const manifestRef = useRef<Manifest | null>(null);
  const manifestUcus = useRef<Promise<Manifest | null> | null>(null);
  const indirme = useRef(new Set<string>());

  const ekle = useCallback((gelen: MenuDosyasi) => {
    setDosyalar((eski) => {
      const anahtar = `${gelen.il}/${gelen.ay}`;
      const secilen = dahaGuncel(eski[anahtar] ?? null, gelen);
      if (!secilen || secilen === eski[anahtar]) return eski;
      return { ...eski, [anahtar]: secilen };
    });
  }, []);

  useEffect(() => {
    let iptal = false;
    void (async () => {
      try {
        const saklanan = await depoOku();
        if (iptal) return;
        for (const dosya of saklanan) ekle(dosya);
        const elde = new Set(saklanan.map((dosya) => `${dosya.il}/${dosya.ay}`));
        for (const dosya of Object.values(gomuluHarita())) {
          if (!elde.has(`${dosya.il}/${dosya.ay}`)) void depoYaz(dosya);
        }
      } catch {
        // Depo okunamazsa gömülü kopya ekranda kalır.
      } finally {
        if (!iptal) setOnbellekHazir(true);
      }
    })();
    return () => {
      iptal = true;
    };
  }, [ekle]);

  const manifestAl = useCallback(async (): Promise<Manifest | null> => {
    if (!DATA_BASE_URL) return null;
    if (manifestRef.current) return manifestRef.current;
    if (!manifestUcus.current) {
      manifestUcus.current = manifestIndir().then((gelen) => {
        manifestUcus.current = null;
        if (gelen) manifestRef.current = gelen;
        return gelen;
      });
    }
    return manifestUcus.current;
  }, []);

  const ayIndir = useCallback(
    async (il: string, ay: string, uzak: number | undefined) => {
      const anahtar = `${il}/${ay}`;
      const yerel = dosyalarRef.current[anahtar]?.surum ?? null;
      if (!dahaYeni(yerel, uzak) || indirme.current.has(anahtar)) return;
      indirme.current.add(anahtar);
      setBekleyen((eski) => {
        if (eski.has(anahtar)) return eski;
        const yeni = new Set(eski);
        yeni.add(anahtar);
        return yeni;
      });
      const indirilen = await menuIndir(il, ay, uzak ?? 0);
      indirme.current.delete(anahtar);
      setBekleyen((eski) => {
        if (!eski.has(anahtar)) return eski;
        const yeni = new Set(eski);
        yeni.delete(anahtar);
        return yeni;
      });
      if (!indirilen) {
        setAgKesik(true);
        return;
      }
      ekle(indirilen);
      void depoYaz(indirilen);
    },
    [ekle],
  );

  const izle = useCallback(
    (il: string, ay: string) => {
      if (!DATA_BASE_URL || !il) return;
      void (async () => {
        const manifest = await manifestAl();
        if (!manifest) {
          setAgKesik(true);
          return;
        }
        setAgKesik(false);
        setManifestHazir(true);
        setKatalog((eski) => katalogBirlestir(eski, manifest));
        await ayIndir(il, ay, manifest.iller[il]?.aylar[ay]?.surum);
        const sonraki = ertesiAyOndalik(istanbulTarih(new Date()));
        if (!sonraki || sonraki === ay) return;
        await ayIndir(il, sonraki, manifest.iller[il]?.aylar[sonraki]?.surum);
      })();
    },
    [ayIndir, manifestAl],
  );

  useEffect(() => {
    if (!tercih.hazir || !tercih.il) return;
    izle(tercih.il, ayAnahtari(istanbulTarih(new Date())));
  }, [izle, tercih.hazir, tercih.il]);

  const deger = useMemo<MenuDepo>(() => {
    const iller = new Set<string>();
    for (const anahtar of [...Object.keys(katalog), ...Object.keys(dosyalar)]) {
      const il = anahtar.slice(0, anahtar.indexOf("/"));
      if (il) iller.add(il);
    }
    return {
      dosya: (il, ay) => dosyalar[`${il}/${ay}`] ?? null,
      ildeKayitVar: (il) => iller.has(il),
      gorunum: (il, ay) => {
        const anahtar = `${il}/${ay}`;
        return menuGorunumu({
          dosyaVar: Boolean(dosyalar[anahtar]),
          ilBiliniyor: iller.has(il),
          ayBiliniyor: katalog[anahtar] != null || Boolean(dosyalar[anahtar]),
          yayinVar: Boolean(DATA_BASE_URL),
          manifestHazir,
          agKesik,
          istekVar: bekleyen.has(anahtar),
          onbellekHazir,
        });
      },
      izle,
    };
  }, [agKesik, bekleyen, dosyalar, izle, katalog, manifestHazir, onbellekHazir]);

  return <MenuBaglami.Provider value={deger}>{children}</MenuBaglami.Provider>;
}

export function useMenuDeposu(): MenuDepo {
  const deger = useContext(MenuBaglami);
  if (!deger) throw new Error("Menu deposu yok");
  return deger;
}
