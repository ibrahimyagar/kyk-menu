"""kykyurtmenu.com menülerini JSON olarak dışa aktarır.

Yalnızca herkese açık sayfaları okur ve robots.txt kurallarına uyar.
Veri, Next.js sayfasının içine gömülü `item` nesnesinden ve aynı
sayfadaki JSON-LD listesinden alınır. Kaynakta olmayan değer uydurulmaz.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

SOURCE = "https://www.kykyurtmenu.com/"
BASE = "https://kykyurtmenu.com"
USER_AGENT = "kyk-menu-arastirma/0.1 (+iletisim: yafestahl@gmail.com)"
UA_TOKEN = "kyk-menu-arastirma"
SCHEMA_VERSION = "1.0"
ISTANBUL = timezone(timedelta(hours=3))
MEALS = {"kahvalti": "breakfast", "aksam": "dinner"}
SLOTS = ("first", "second", "third", "fourth", "fifth", "sixth")
# Site iki biçim kullanıyor: "A / B" + "140 / 180" ve "A/B" + "140,180".
ALT_SPLIT = re.compile(r"\s*/\s*")
CAL_SPLIT = re.compile(r"\s*[/,]\s*")
MAX_RATE_LIMIT_HITS = 3
BACKEND_DOWN_MARKER = "Sunucu bağlantısı kurulamadı"


def backend_down(html: str) -> bool:
    return BACKEND_DOWN_MARKER in html


def now_iso() -> str:
    return datetime.now(ISTANBUL).isoformat(timespec="seconds")


def istanbul_today() -> str:
    return datetime.now(ISTANBUL).date().isoformat()


# --------------------------------------------------------------------------- robots


@dataclass
class RobotsRules:
    allow: list[str] = field(default_factory=list)
    disallow: list[str] = field(default_factory=list)

    def allowed(self, path_and_query: str) -> bool:
        """Google kuralı: en uzun eşleşen kural kazanır, eşitlikte Allow."""
        best_len, best_allow = -1, True
        for pattern, is_allow in [(p, True) for p in self.allow] + [(p, False) for p in self.disallow]:
            if pattern and _robots_match(pattern, path_and_query):
                if len(pattern) > best_len or (len(pattern) == best_len and is_allow):
                    best_len, best_allow = len(pattern), is_allow
        return best_allow


def _robots_match(pattern: str, target: str) -> bool:
    anchored = pattern.endswith("$")
    body = pattern[:-1] if anchored else pattern
    regex = "^" + ".*".join(re.escape(part) for part in body.split("*")) + ("$" if anchored else "")
    return re.match(regex, target) is not None


def parse_robots(text: str, ua_token: str) -> RobotsRules:
    groups: list[tuple[list[str], RobotsRules]] = []
    agents: list[str] = []
    rules = RobotsRules()
    last_was_agent = False
    for raw in text.splitlines():
        line = raw.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, value = (part.strip() for part in line.split(":", 1))
        key = key.lower()
        if key == "user-agent":
            if not last_was_agent:
                agents, rules = [], RobotsRules()
                groups.append((agents, rules))
            agents.append(value.lower())
            last_was_agent = True
            continue
        last_was_agent = False
        if key == "allow":
            rules.allow.append(value)
        elif key == "disallow":
            rules.disallow.append(value)
    specific = [r for a, r in groups if any(ua_token.lower().startswith(x) and x != "*" for x in a)]
    if specific:
        return specific[0]
    wildcard = [r for a, r in groups if "*" in a]
    return wildcard[0] if wildcard else RobotsRules()


# --------------------------------------------------------------------------- http


class RateLimitAbort(RuntimeError):
    pass


class Fetcher:
    """Sınırlı eşzamanlılık, istekler arası asgari bekleme, önbellek ve kontrollü yeniden deneme."""

    def __init__(self, cache_dir: Path | None, cache_ttl: int, delay: float, retries: int, timeout: int) -> None:
        self.cache_dir = cache_dir
        self.cache_ttl = cache_ttl
        self.delay = delay
        self.retries = retries
        self.timeout = timeout
        self._lock = threading.Lock()
        self._next_slot = 0.0
        self.rate_limit_hits = 0
        self.requests_made = 0
        self.cache_hits = 0

    def get(self, url: str) -> str:
        cached = self._read_cache(url)
        if cached is not None and not backend_down(cached):
            with self._lock:
                self.cache_hits += 1
            return cached
        body = self._fetch_with_retry(url)
        if not backend_down(body):
            self._write_cache(url, body)
        return body

    def _wait_turn(self) -> None:
        with self._lock:
            now = time.monotonic()
            start = max(now, self._next_slot)
            self._next_slot = start + self.delay
        time.sleep(max(0.0, start - time.monotonic()))

    def _fetch_with_retry(self, url: str) -> str:
        last_error: Exception | None = None
        for attempt in range(self.retries + 1):
            if self.rate_limit_hits >= MAX_RATE_LIMIT_HITS:
                raise RateLimitAbort("site hız sınırı bildirdi; çalışma durduruldu")
            self._wait_turn()
            try:
                return self._fetch_once(url)
            except urllib.error.HTTPError as error:
                last_error = error
                if error.code == 429:
                    with self._lock:
                        self.rate_limit_hits += 1
                    time.sleep(_retry_after(error, fallback=30))
                elif 500 <= error.code < 600:
                    time.sleep(2 ** (attempt + 1))
                else:
                    raise
            except (urllib.error.URLError, TimeoutError, ConnectionError) as error:
                last_error = error
                time.sleep(2 ** (attempt + 1))
        assert last_error is not None
        raise last_error

    def _fetch_once(self, url: str) -> str:
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,*/*"})
        with urllib.request.urlopen(request, timeout=self.timeout) as response:
            with self._lock:
                self.requests_made += 1
            return response.read().decode("utf-8")

    def _cache_path(self, url: str) -> Path | None:
        if self.cache_dir is None:
            return None
        return self.cache_dir / (hashlib.sha1(url.encode("utf-8")).hexdigest() + ".html")

    def _read_cache(self, url: str) -> str | None:
        path = self._cache_path(url)
        if path is None or not path.exists():
            return None
        if time.time() - path.stat().st_mtime > self.cache_ttl:
            return None
        return path.read_text(encoding="utf-8")

    def _write_cache(self, url: str, body: str) -> None:
        path = self._cache_path(url)
        if path is None:
            return
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")


def _retry_after(error: urllib.error.HTTPError, fallback: int) -> int:
    value = error.headers.get("Retry-After") if error.headers else None
    try:
        return max(1, min(300, int(value))) if value else fallback
    except ValueError:
        return fallback


# --------------------------------------------------------------------------- parse


def discover_cities(sitemap_xml: str) -> list[str]:
    slugs = re.findall(r"<loc>https?://[^/]+/([a-z0-9-]+)/kahvalti</loc>", sitemap_xml)
    return sorted(set(slugs))


def city_names(sitemap_slugs: list[str], html_by_slug: dict[str, str]) -> dict[str, str]:
    names: dict[str, str] = {}
    for slug in sitemap_slugs:
        html = html_by_slug.get(slug, "")
        match = re.search(r'"name":"([^"]+?) KYK Yemek Listesi"', html)
        names[slug] = match.group(1) if match else slug
    return names


def decode_rsc(html: str) -> str:
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)', html)
    return "".join(json.loads(f'"{chunk}"') for chunk in chunks)


def extract_item(rsc: str) -> dict[str, Any] | None:
    match = re.search(r'"item":\s*', rsc)
    if match is None:
        return None
    start = match.end()
    if rsc.startswith("null", start):
        return None
    try:
        value, _ = json.JSONDecoder().raw_decode(rsc, start)
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


def extract_ld_itemlist(html: str) -> dict[str, Any] | None:
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, flags=re.S):
        try:
            data = json.loads(block)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict) and data.get("@type") == "ItemList":
            return data
    return None


def parse_calories(raw: str, expected: int) -> tuple[list[int | None], bool, bool]:
    """Kalori metnini seçeneklere böler.

    Döner: (değerler, adet_uyumsuz, kaynakta_sifir_vardi). Adet tutmazsa hepsi None.
    Kaynaktaki "0" doğrulanmış sıfır sayılmaz; None yazılır, ham metin ayrıca saklanır.
    """
    text = (raw or "").strip()
    if not text:
        return [None] * expected, False, False
    parts = CAL_SPLIT.split(text)
    if len(parts) != expected:
        return [None] * expected, True, False
    values: list[int | None] = []
    had_zero = False
    for part in parts:
        digits = re.fullmatch(r"\s*(\d+)\s*(?:kcal)?\s*", part, flags=re.I)
        value = int(digits.group(1)) if digits else None
        if value == 0:
            had_zero, value = True, None
        values.append(value)
    return values, False, had_zero


def build_items(item: dict[str, Any]) -> tuple[list[dict[str, Any]], list[tuple[str, str]]]:
    items: list[dict[str, Any]] = []
    issues: list[tuple[str, str]] = []
    for slot in SLOTS:
        raw_name = (item.get(slot) or "").strip()
        if not raw_name:
            continue
        names = [name.strip() for name in ALT_SPLIT.split(raw_name) if name.strip()]
        raw_calories = item.get(f"{slot}Calories")
        calories, mismatch, had_zero = parse_calories(str(raw_calories or ""), len(names))
        if mismatch:
            issues.append(("calorie_count_mismatch", f"{slot}: {len(names)} seçenek, kalori metni {raw_calories!r}; null yazıldı"))
        if had_zero:
            issues.append(("source_zero_as_null", f"{slot}: kaynakta 0 yazıyor ({raw_name!r}); doğrulanmadığı için null"))
        options = [{"name": n, "calories_kcal": c} for n, c in zip(names, calories)]
        items.append(
            {
                "name": options[0]["name"],
                "category": None,
                "slot": slot,
                "calories_kcal": options[0]["calories_kcal"],
                "portion": None,
                "choice": "one_of" if len(options) > 1 else "single",
                "alternatives": options[1:],
                "source_text": {"name": raw_name, "calories": item.get(f"{slot}Calories")},
            }
        )
    return items, issues


# --------------------------------------------------------------------------- validate


def validate_record(record: dict[str, Any], expected_date: str, ld: dict[str, Any] | None) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    key = {"city": record["city"], "date": record["date"], "meal_type": record["meal_type"]}

    def add(kind: str, detail: Any) -> None:
        findings.append({**key, "type": kind, "detail": detail})

    if record["date"] != expected_date:
        add("date_mismatch", {"expected": expected_date, "source": record["date"]})
    if not record["items"]:
        add("empty_menu", None)

    for entry in record["items"]:
        for option in [entry, *entry["alternatives"]]:
            if option["calories_kcal"] is None:
                add("missing_calories", option["name"])

    first_options = [entry["calories_kcal"] for entry in record["items"]]
    total = record["total_calories_kcal"]
    if total is not None and first_options:
        known = [c for c in first_options if c is not None]
        computed = sum(known)
        if computed != total:
            add("total_mismatch", {"source_total": total, "sum_of_first_options": computed, "items_without_calories": len(first_options) - len(known)})
        elif len(known) != len(first_options):
            add("total_excludes_unknown_items", {"source_total": total, "items_without_calories": len(first_options) - len(known)})

    if ld is not None:
        # JSON-LD her yuvada yalnızca ilk seçeneğin adını taşıyor; kalori metni bazen tam, bazen ilk değer.
        # Karşılaştırma ikisinin ortak bilgisiyle yapılır: ilk seçenek adı + ilk kalori değeri.
        ld_rows = [(row.get("name", "").strip(), _first_calorie_token(row.get("description"))) for row in ld.get("itemListElement", [])]
        src_rows = [(e["name"], _first_calorie_token(e["source_text"]["calories"])) for e in record["items"]]
        if ld_rows != src_rows:
            add("jsonld_mismatch", {"jsonld": ld_rows, "item": src_rows})
    return findings


def _first_calorie_token(text: Any) -> str:
    cleaned = str(text or "").replace("kcal", "").strip()
    return CAL_SPLIT.split(cleaned)[0] if cleaned else ""


# --------------------------------------------------------------------------- run


@dataclass
class Task:
    slug: str
    meal_slug: str
    date: str | None  # None: tarihsiz sayfa (sitenin "bugün"ü)

    @property
    def url(self) -> str:
        suffix = f"?date={self.date}" if self.date else ""
        return f"{BASE}/{self.slug}/{self.meal_slug}{suffix}"

    @property
    def path(self) -> str:
        suffix = f"?date={self.date}" if self.date else ""
        return f"/{self.slug}/{self.meal_slug}{suffix}"


def date_range(start: str, end: str) -> list[str]:
    first, last = date.fromisoformat(start), date.fromisoformat(end)
    if last < first:
        raise ValueError("--to, --from'dan önce olamaz")
    return [(first + timedelta(days=i)).isoformat() for i in range((last - first).days + 1)]


def path_allowed(task: Task, robots: RobotsRules, owner_permission: bool) -> bool:
    """Site sahibi izni yalnızca tarih parametresini açar; tarihsiz yol robots'ta kapalıysa yine girilmez."""
    if robots.allowed(task.path):
        return True
    return owner_permission and task.date is not None and robots.allowed(f"/{task.slug}/{task.meal_slug}")


def run_task(task: Task, fetcher: Fetcher, robots: RobotsRules, today: str, owner_permission: bool = False) -> dict[str, Any]:
    expected_date = task.date or today
    base = {"city_slug": task.slug, "date": expected_date, "meal_type": MEALS[task.meal_slug], "source_url": task.url}
    if not path_allowed(task, robots, owner_permission):
        return {"ok": False, **base, "reason": "robots_disallowed", "detail": "robots.txt bu adresi botlara kapatıyor; istek gönderilmedi"}
    try:
        html = fetcher.get(task.url)
    except RateLimitAbort as error:
        return {"ok": False, **base, "reason": "rate_limited_aborted", "detail": str(error)}
    except urllib.error.HTTPError as error:
        return {"ok": False, **base, "reason": f"http_{error.code}", "detail": str(error)}
    except Exception as error:  # ağ hatası vb.; kayda geçer, gizlenmez
        return {"ok": False, **base, "reason": "network_error", "detail": repr(error)}
    return {"ok": True, **base, "html": html, "retrieved_at": now_iso()}


def run_all(tasks: list[Task], fetcher: Fetcher, robots: RobotsRules, today: str, concurrency: int, owner_permission: bool = False) -> list[dict[str, Any]]:
    done = 0
    lock = threading.Lock()

    def one(task: Task) -> dict[str, Any]:
        nonlocal done
        result = run_task(task, fetcher, robots, today, owner_permission)
        with lock:
            done += 1
            if done % 50 == 0 or done == len(tasks):
                print(f"  {done}/{len(tasks)} sayfa", flush=True)
        return result

    with ThreadPoolExecutor(max_workers=concurrency) as pool:
        return list(pool.map(one, tasks))


def to_record(result: dict[str, Any], city_name: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]], dict[str, Any] | None]:
    html = result["html"]
    failure = {k: result[k] for k in ("city_slug", "date", "meal_type", "source_url")}
    if backend_down(html):
        return None, [], {**failure, "reason": "site_backend_unavailable", "detail": "sayfa 'Sunucu bağlantısı kurulamadı / Backend API şu an kapalı' diyor"}
    item = extract_item(decode_rsc(html))
    if item is None:
        return None, [], {**failure, "reason": "no_menu_on_page", "detail": "sayfada menü nesnesi yok"}
    items, issues = build_items(item)
    total = item.get("totalCalories")
    record = {
        "city": city_name,
        "city_slug": result["city_slug"],
        "date": item.get("date") or result["date"],
        "meal_type": result["meal_type"],
        "total_calories_kcal": total if isinstance(total, int) else None,
        "items": items,
        "source_url": result["source_url"],
        "source_id": item.get("id"),
        "retrieved_at": result["retrieved_at"],
        "status": "success" if items else "empty",
    }
    findings = validate_record(record, result["date"], extract_ld_itemlist(html))
    findings += [{"city": city_name, "date": record["date"], "meal_type": record["meal_type"], "type": kind, "detail": detail} for kind, detail in issues]
    return record, findings, None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    json.loads(tmp.read_text(encoding="utf-8"))
    tmp.replace(path)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="kykyurtmenu.com menülerini JSON'a aktarır.")
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parent / "output")
    parser.add_argument("--cities", help="virgülle il slug'ları (ör. ankara,istanbul); boşsa site haritasındaki hepsi")
    parser.add_argument("--meals", default="kahvalti,aksam")
    parser.add_argument("--from", dest="date_from", help="YYYY-MM-DD; verilmezse yalnızca sitenin bugünkü sayfası")
    parser.add_argument("--to", dest="date_to", help="YYYY-MM-DD")
    parser.add_argument("--concurrency", type=int, default=2, help="eşzamanlı istek (1-4)")
    parser.add_argument("--delay", type=float, default=1.5, help="istek başlangıçları arası asgari saniye")
    parser.add_argument("--retries", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=25)
    parser.add_argument("--cache-ttl", type=int, default=3600, help="önbellek ömrü (saniye)")
    parser.add_argument("--no-cache", action="store_true")
    parser.add_argument("--split", choices=["none", "city", "month"], default="none")
    parser.add_argument("--backend-retry-wait", type=int, default=60, help="site arka ucu kapalı sayfaları yeniden denemeden önce bekleme (sn); 0 = deneme")
    parser.add_argument(
        "--owner-permission",
        help="site sahibinin izin beyanı (metin). Verilirse robots.txt'nin ?date= yasağı bu çalıştırma için kaldırılır; /api/ kapalı kalır. Beyan çıktıya yazılır.",
    )
    args = parser.parse_args(argv)
    args.concurrency = max(1, min(4, args.concurrency))
    if bool(args.date_from) != bool(args.date_to):
        parser.error("--from ve --to birlikte verilmeli")
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    started = now_iso()
    today = istanbul_today()
    out: Path = args.out
    fetcher = Fetcher(None if args.no_cache else out / ".cache", args.cache_ttl, args.delay, args.retries, args.timeout)

    robots_text = fetcher.get(f"{BASE}/robots.txt")
    robots = parse_robots(robots_text, UA_TOKEN)
    sitemap_slugs = discover_cities(fetcher.get(f"{BASE}/sitemap.xml"))
    slugs = [s.strip() for s in args.cities.split(",")] if args.cities else sitemap_slugs
    unknown = sorted(set(slugs) - set(sitemap_slugs))
    slugs = [s for s in slugs if s in sitemap_slugs]
    meals = [m.strip() for m in args.meals.split(",") if m.strip() in MEALS]
    dates: list[str | None] = date_range(args.date_from, args.date_to) if args.date_from else [None]

    tasks = [Task(slug, meal, d) for slug in slugs for meal in meals for d in dates]
    print(f"{len(sitemap_slugs)} il keşfedildi; {len(tasks)} sayfa denenecek.", flush=True)

    owner_permission = bool(args.owner_permission)
    results = run_all(tasks, fetcher, robots, today, args.concurrency, owner_permission)
    down = [i for i, r in enumerate(results) if r.get("ok") and backend_down(r["html"])]
    if down and args.backend_retry_wait > 0:
        print(f"{len(down)} sayfada sitenin arka ucu kapalı; {args.backend_retry_wait} sn sonra bir kez yeniden denenecek.", flush=True)
        time.sleep(args.backend_retry_wait)
        retried = run_all([tasks[i] for i in down], fetcher, robots, today, args.concurrency, owner_permission)
        for index, result in zip(down, retried):
            results[index] = result

    names = city_names(sitemap_slugs, {r["city_slug"]: r["html"] for r in results if r.get("ok")})
    menus: list[dict[str, Any]] = []
    findings: list[dict[str, Any]] = []
    failed: list[dict[str, Any]] = [{k: v for k, v in r.items() if k != "ok"} for r in results if not r["ok"]]
    seen: dict[tuple[str, str, str], str] = {}
    for result in (r for r in results if r["ok"]):
        record, record_findings, failure = to_record(result, names.get(result["city_slug"], result["city_slug"]))
        if failure:
            failed.append(failure)
            continue
        assert record is not None
        key = (record["city_slug"], record["date"], record["meal_type"])
        if key in seen:
            findings.append({"city": record["city"], "date": record["date"], "meal_type": record["meal_type"], "type": "duplicate", "detail": {"kept": seen[key], "dropped": record["source_url"]}})
            continue
        seen[key] = record["source_url"]
        menus.append(record)
        findings.extend(record_findings)

    menus.sort(key=lambda m: (m["city_slug"], m["date"], m["meal_type"]))
    exported_at = now_iso()
    cities_exported = sorted({m["city_slug"] for m in menus if m["status"] == "success"})
    metadata = {
        "source": SOURCE,
        "exported_at": exported_at,
        "schema_version": SCHEMA_VERSION,
        "cities_discovered": len(sitemap_slugs),
        "cities_exported": len(cities_exported),
        "records_exported": len(menus),
        "date_scope": {"from": args.date_from, "to": args.date_to} if args.date_from else {"site_today": today},
        "permission_override": {"statement": args.owner_permission, "overridden_rule": "Disallow: /*?date=*"} if args.owner_permission else None,
        "notes": [
            "category kaynakta yok; null bırakıldı. slot alanı kaynaktaki sıradır (first..fourth).",
            "calories_kcal kaynakta boşsa null. total_calories_kcal kaynaktaki totalCalories değeridir; düzeltilmedi.",
            "alternatives: aynı yuvadaki ' / ' ile ayrılmış seçenekler; ilk seçenek name alanında.",
        ],
    }
    write_json(out / "kyk_menuleri.json", {"metadata": metadata, "menus": menus})
    write_split(out, metadata, menus, args.split)

    report = build_report(started, exported_at, args, robots, sitemap_slugs, slugs, unknown, meals, dates, tasks, menus, failed, findings, fetcher)
    write_json(out / "export_report.json", report)
    write_json(out / "failed_records.json", failed)
    print_summary(out, report)
    return 0


def write_split(out: Path, metadata: dict[str, Any], menus: list[dict[str, Any]], mode: str) -> None:
    if mode == "none":
        return
    groups: dict[str, list[dict[str, Any]]] = {}
    for menu in menus:
        key = menu["city_slug"] if mode == "city" else menu["date"][:7]
        groups.setdefault(key, []).append(menu)
    for key, group in groups.items():
        write_json(out / mode / f"{key}.json", {"metadata": {**metadata, "records_exported": len(group), "split": {mode: key}}, "menus": group})


def build_report(started, exported_at, args, robots, sitemap_slugs, slugs, unknown, meals, dates, tasks, menus, failed, findings, fetcher) -> dict[str, Any]:
    by_type: dict[str, int] = {}
    for finding in findings:
        by_type[finding["type"]] = by_type.get(finding["type"], 0) + 1
    success = [m for m in menus if m["status"] == "success"]
    per_city: dict[str, dict[str, int]] = {}
    for slug in slugs:
        per_city[slug] = {meal: 0 for meal in MEALS.values()}
    for menu in success:
        per_city[menu["city_slug"]][menu["meal_type"]] += 1
    complete = len(failed) == 0 and len(success) == len(tasks)
    return {
        "started_at": started,
        "finished_at": exported_at,
        "complete": complete,
        "robots": {
            "user_agent": USER_AGENT,
            "date_pages_allowed": robots.allowed("/ankara/kahvalti?date=2026-01-01"),
            "rules_applied": {"allow": robots.allow, "disallow": robots.disallow},
            "owner_permission_statement": args.owner_permission,
        },
        "accessible_date_scope": "Tarihsiz sayfa = sitenin bugünü. ?date= sayfaları robots.txt ile kapalıysa denenmez.",
        "requested": {"cities": len(slugs), "meals": meals, "dates": [d or "site_today" for d in dates], "pages": len(tasks)},
        "unknown_city_slugs": unknown,
        "cities_discovered": len(sitemap_slugs),
        "cities_with_success": len({m["city_slug"] for m in success}),
        "cities_without_success": sorted(set(slugs) - {m["city_slug"] for m in success}),
        "dates_with_success": sorted({m["date"] for m in success}),
        "meals_success": len(success),
        "meals_empty": sum(1 for m in menus if m["status"] == "empty"),
        "meals_failed": len(failed),
        "failed_by_reason": _count(failed, "reason"),
        "per_city": per_city,
        "validation": {"counts": by_type, "findings": findings},
        "http": {"requests": fetcher.requests_made, "cache_hits": fetcher.cache_hits, "rate_limit_hits": fetcher.rate_limit_hits},
        "parameters": {k: (str(v) if isinstance(v, Path) else v) for k, v in vars(args).items()},
    }


def _count(rows: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row[key]] = counts.get(row[key], 0) + 1
    return counts


def print_summary(out: Path, report: dict[str, Any]) -> None:
    print(f"Başarılı öğün: {report['meals_success']}, boş: {report['meals_empty']}, başarısız: {report['meals_failed']}")
    print(f"Başarılı il: {report['cities_with_success']}/{report['requested']['cities']}; tarihler: {', '.join(report['dates_with_success']) or '-'}")
    if report["failed_by_reason"]:
        print(f"Başarısızlık nedenleri: {report['failed_by_reason']}")
    print(f"Doğrulama bulguları: {report['validation']['counts']}")
    print(f"Eksiksiz: {'evet' if report['complete'] else 'hayır'}")
    for name in ("kyk_menuleri.json", "export_report.json", "failed_records.json"):
        print(f"  {(out / name).resolve()}")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
