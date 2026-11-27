import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { DATA_BASE_URL } from "../config/veri";
import { ayAnahtari, gunEkle, istanbulTarih } from "../lib/tarih";
import { useTercih } from "../tercih/TercihProvider";
import type { Manifest, MenuDosyasi } from "../types/domain";
import { manifestIndir, menuIndir } from "./ag";
import { dahaGuncel, dahaYeni, ertesiAyOndalik, katalogBirlestir, menuGorunumu, type MenuGorunumu } from "./karar";
import { depoOku, depoYaz, manifestOku, manifestYaz } from "./depo";

interface MenuDepo {
  dosya: (il: string, ay: string) => MenuDosyasi | null;
  ildeKayitVar: (il: string) => boolean;
  gorunum: (il: string, ay: string) => MenuGorunumu;
  /** Ayı indirir; eldeki kopya varsa önce o gösterilir, arkada sürüm denetlenir. */
  izle: (il: string, ay: string) => void;
  /** Son denemede yayına ulaşılamadı. Ekrandaki menü cihazdaki kopyadır. */
  cevrimdisi: boolean;
}

const MenuBaglami = createContext<MenuDepo | null>(null);

/** Manifest bu süreden eskiyse yeniden sorulur. */
const MANIFEST_OMRU_MS = 15 * 60 * 1000;

function buAy(): string {
  return ayAnahtari(istanbulTarih(new Date()));
}

function gecenAy(): string {
  return ayAnahtari(gunEkle(`${buAy()}-01`, -1));
}

function kumeyeEkle(kume: ReadonlySet<string>, deger: string, ekle: boolean): ReadonlySet<string> {
  if (kume.has(deger) === ekle) return kume;
  const yeni = new Set(kume);
  if (ekle) yeni.add(deger);
  else yeni.delete(deger);
  return yeni;
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const tercih = useTercih();
  const [dosyalar, setDosyalar] = useState<Record<string, MenuDosyasi>>({});
  const [katalog, setKatalog] = useState<Record<string, number>>({});
  const [agKesik, setAgKesik] = useState(false);
  const [manifestHazir, setManifestHazir] = useState(false);
  const [onbellekHazir, setOnbellekHazir] = useState(false);
  const [bekleyen, setBekleyen] = useState<ReadonlySet<string>>(() => new Set());
  const dosyalarRef = useRef(dosyalar);
  dosyalarRef.current = dosyalar;
  const manifestRef = useRef<{ manifest: Manifest; alindi: number } | null>(null);
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
        const [saklanan, manifest] = await Promise.all([depoOku(gecenAy()), manifestOku()]);
        if (iptal) return;
        for (const dosya of saklanan) ekle(dosya);
        if (manifest) setKatalog((eski) => katalogBirlestir(eski, manifest));
      } catch {
        // Depo okunamazsa menü ağdan gelir.
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
    const eldeki = manifestRef.current;
    if (eldeki && Date.now() - eldeki.alindi < MANIFEST_OMRU_MS) return eldeki.manifest;
    manifestUcus.current ??= manifestIndir().then((gelen) => {
      manifestUcus.current = null;
      if (gelen) {
        manifestRef.current = { manifest: gelen, alindi: Date.now() };
        void manifestYaz(gelen);
      }
      return gelen;
    });
    return manifestUcus.current;
  }, []);

  const ayIndir = useCallback(
    async (il: string, ay: string, uzak: number | undefined) => {
      const anahtar = `${il}/${ay}`;
      const yerel = dosyalarRef.current[anahtar]?.surum ?? null;
      if (!dahaYeni(yerel, uzak) || indirme.current.has(anahtar)) return;
      indirme.current.add(anahtar);
      setBekleyen((eski) => kumeyeEkle(eski, anahtar, true));
      const indirilen = await menuIndir(il, ay, uzak ?? 0);
      indirme.current.delete(anahtar);
      setBekleyen((eski) => kumeyeEkle(eski, anahtar, false));
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
    const il = tercih.il;
    izle(il, buAy());
    const abone = AppState.addEventListener("change", (durum) => {
      if (durum === "active") izle(il, buAy());
    });
    return () => abone.remove();
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
      cevrimdisi: agKesik,
    };
  }, [agKesik, bekleyen, dosyalar, izle, katalog, manifestHazir, onbellekHazir]);

  return <MenuBaglami.Provider value={deger}>{children}</MenuBaglami.Provider>;
}

export function useMenuDeposu(): MenuDepo {
  const deger = useContext(MenuBaglami);
  if (!deger) throw new Error("Menu deposu yok");
  return deger;
}
