import { DATA_BASE_URL } from "../config/veri";
import type { Manifest, MenuDosyasi } from "../types/domain";
import { manifestMi, menuDosyasiMi } from "./karar";

const ZAMAN_ASIMI_MS = 4000;

async function zamanAsimli(adres: string): Promise<Response | null> {
  const kontrol = new AbortController();
  const zaman = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI_MS);
  try {
    return await fetch(adres, { signal: kontrol.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(zaman);
  }
}

export async function manifestIndir(): Promise<Manifest | null> {
  if (!DATA_BASE_URL) return null;
  const yanit = await zamanAsimli(`${DATA_BASE_URL}/v1/manifest.json`);
  if (!yanit?.ok) return null;
  try {
    const json: unknown = await yanit.json();
    return manifestMi(json) ? json : null;
  } catch {
    return null;
  }
}

export async function menuIndir(il: string, ay: string, surum: number): Promise<MenuDosyasi | null> {
  if (!DATA_BASE_URL) return null;
  const adres = `${DATA_BASE_URL}/v1/menu/${encodeURIComponent(il)}/${encodeURIComponent(ay)}.json?v=${surum}`;
  const yanit = await zamanAsimli(adres);
  if (!yanit?.ok) return null;
  try {
    const json: unknown = await yanit.json();
    if (!menuDosyasiMi(json) || json.il !== il || json.ay !== ay) return null;
    return json;
  } catch {
    return null;
  }
}
