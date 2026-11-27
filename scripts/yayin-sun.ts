import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Geliştirme için `publish/` klasörünü yerel ağa sunar; Expo Go telefondan
 * http://<bilgisayar-ip>:8090/v1/manifest.json adresine ulaşır.
 * Yalnızca okuma; klasör dışına çıkan yollar reddedilir.
 */

const kok = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "publish");
const PORT = Number(process.env.PORT ?? 8090);
const TURLER: Record<string, string> = { ".json": "application/json; charset=utf-8" };

function yerelIpler(): string[] {
  return Object.values(networkInterfaces())
    .flatMap((arayuzler) => arayuzler ?? [])
    .filter((a) => a.family === "IPv4" && !a.internal)
    .map((a) => a.address);
}

const sunucu = createServer(async (istek, yanit) => {
  const yol = decodeURIComponent(new URL(istek.url ?? "/", "http://yerel").pathname);
  const dosya = path.join(kok, path.normalize(yol));
  yanit.setHeader("Access-Control-Allow-Origin", "*");
  yanit.setHeader("Cache-Control", "no-cache");
  if (istek.method !== "GET" || !dosya.startsWith(kok + path.sep)) {
    yanit.writeHead(404).end();
    return;
  }
  try {
    if (!(await stat(dosya)).isFile()) throw new Error("dosya değil");
  } catch {
    yanit.writeHead(404).end();
    return;
  }
  yanit.writeHead(200, { "Content-Type": TURLER[path.extname(dosya)] ?? "application/octet-stream" });
  createReadStream(dosya).pipe(yanit);
  console.log(`${istek.method} ${yol}`);
});

sunucu.listen(PORT, "0.0.0.0", () => {
  console.log(`publish/ sunuluyor (port ${PORT}):`);
  for (const ip of yerelIpler()) console.log(`  http://${ip}:${PORT}/v1/manifest.json`);
});
