import json
import unittest

import exporter as ex

ROBOTS = """User-Agent: *
Allow: /
Disallow: /*?date=*
Disallow: /api/
"""

ITEM_DINNER = {
    "id": 25543,
    "date": "2026-10-18",
    "mealType": 1,
    "cityId": 34,
    "first": "Mercimek Çorbası / Yüksük Çorbası",
    "firstCalories": "140 / 180",
    "second": "Bahçıvan Kebabı / Tavuklu Kağıt Kebabı / Domates Soslu Karışık Kızartma",
    "secondCalories": "240 / 310 / 290",
    "third": "Bulgur Pilavı",
    "thirdCalories": "228",
    "fourth": "Haydari",
    "fourthCalories": "140",
    "totalCalories": 748,
}

ITEM_BREAKFAST = {
    "id": 25305,
    "date": "2026-10-18",
    "mealType": 0,
    "first": "Sucuklu Omlet",
    "firstCalories": "",
    "second": "Patates Kavurması",
    "secondCalories": "180",
    "third": "Dere Otlu Poğaça",
    "thirdCalories": "292",
    "fourth": "Beyaz Peynir",
    "fourthCalories": "120",
    "totalCalories": 592,
}


def page_html(item, ld=None):
    payload = json.dumps(["$", "$L14", None, {"item": item, "mealLabel": "Akşam"}], ensure_ascii=False)
    chunk = json.dumps(payload, ensure_ascii=False)[1:-1]
    ld_tag = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>' if ld else ""
    return f'<html>{ld_tag}<script>self.__next_f.push([1,"{chunk}"])</script></html>'


class RobotsTest(unittest.TestCase):
    def test_date_pages_disallowed(self):
        rules = ex.parse_robots(ROBOTS, ex.UA_TOKEN)
        self.assertTrue(rules.allowed("/ankara/kahvalti"))
        self.assertFalse(rules.allowed("/ankara/kahvalti?date=2026-10-01"))
        self.assertFalse(rules.allowed("/api/proxy/x"))

    def test_owner_permission_opens_only_date_pages(self):
        rules = ex.parse_robots(ROBOTS, ex.UA_TOKEN)
        dated = ex.Task("ankara", "kahvalti", "2026-10-01")
        self.assertFalse(ex.path_allowed(dated, rules, owner_permission=False))
        self.assertTrue(ex.path_allowed(dated, rules, owner_permission=True))
        closed = ex.parse_robots("User-Agent: *\nDisallow: /ankara/\n", ex.UA_TOKEN)
        self.assertFalse(ex.path_allowed(dated, closed, owner_permission=True))

    def test_specific_agent_group_wins(self):
        text = ROBOTS + "\nUser-Agent: kyk-menu-arastirma\nAllow: /\n"
        rules = ex.parse_robots(text, ex.UA_TOKEN)
        self.assertTrue(rules.allowed("/ankara/kahvalti?date=2026-10-01"))


class ParseTest(unittest.TestCase):
    def test_extract_item_from_rsc(self):
        item = ex.extract_item(ex.decode_rsc(page_html(ITEM_DINNER)))
        self.assertEqual(item["totalCalories"], 748)
        self.assertEqual(item["first"], "Mercimek Çorbası / Yüksük Çorbası")

    def test_alternatives_keep_their_own_calories(self):
        items, issues = ex.build_items(ITEM_DINNER)
        self.assertEqual(issues, [])
        self.assertEqual(items[1]["name"], "Bahçıvan Kebabı")
        self.assertEqual(items[1]["calories_kcal"], 240)
        self.assertEqual([a["calories_kcal"] for a in items[1]["alternatives"]], [310, 290])
        self.assertEqual(items[1]["choice"], "one_of")
        self.assertIsNone(items[0]["category"])

    def test_compact_separators(self):
        items, issues = ex.build_items(
            {"first": "Ezogelin Çorba/Terbiyeli Şehriye Çorba", "firstCalories": "114,227", "totalCalories": 0}
        )
        self.assertEqual(issues, [])
        self.assertEqual(items[0]["name"], "Ezogelin Çorba")
        self.assertEqual(items[0]["calories_kcal"], 114)
        self.assertEqual(items[0]["alternatives"], [{"name": "Terbiyeli Şehriye Çorba", "calories_kcal": 227}])

    def test_missing_calorie_is_null_not_zero(self):
        items, _ = ex.build_items(ITEM_BREAKFAST)
        self.assertIsNone(items[0]["calories_kcal"])

    def test_calorie_count_mismatch_is_reported(self):
        values, mismatch, _ = ex.parse_calories("150", 2)
        self.assertTrue(mismatch)
        self.assertEqual(values, [None, None])

    def test_source_zero_becomes_null_and_is_reported(self):
        items, issues = ex.build_items({**ITEM_BREAKFAST, "firstCalories": "0"})
        self.assertIsNone(items[0]["calories_kcal"])
        self.assertEqual(items[0]["source_text"]["calories"], "0")
        self.assertIn("source_zero_as_null", [kind for kind, _ in issues])

    def test_backend_down_page_is_classified(self):
        html = "<html>🔌 Sunucu bağlantısı kurulamadı Backend API şu an kapalı.</html>"
        result = {"html": html, "city_slug": "adiyaman", "date": "2026-10-18", "meal_type": "breakfast", "source_url": "u", "retrieved_at": "t"}
        record, _, failure = ex.to_record(result, "Adıyaman")
        self.assertIsNone(record)
        self.assertEqual(failure["reason"], "site_backend_unavailable")

    def test_no_item_returns_none(self):
        self.assertIsNone(ex.extract_item(ex.decode_rsc("<html></html>")))


class ValidateTest(unittest.TestCase):
    def record(self, item):
        items, _ = ex.build_items(item)
        return {"city": "X", "date": item["date"], "meal_type": "dinner", "total_calories_kcal": item["totalCalories"], "items": items}

    def test_total_equal_to_first_options_has_no_mismatch(self):
        findings = ex.validate_record(self.record(ITEM_DINNER), "2026-10-18", None)
        self.assertNotIn("total_mismatch", [f["type"] for f in findings])

    def test_total_without_unknown_item_is_flagged_not_fixed(self):
        record = self.record(ITEM_BREAKFAST)
        types = [f["type"] for f in ex.validate_record(record, "2026-10-18", None)]
        self.assertIn("missing_calories", types)
        self.assertIn("total_excludes_unknown_items", types)
        self.assertEqual(record["total_calories_kcal"], 592)

    def test_date_mismatch(self):
        types = [f["type"] for f in ex.validate_record(self.record(ITEM_DINNER), "2026-10-19", None)]
        self.assertIn("date_mismatch", types)

    def test_jsonld_with_first_option_name_matches(self):
        ld = {
            "@type": "ItemList",
            "itemListElement": [
                {"name": "Mercimek Çorbası", "description": "140 / 180 kcal"},
                {"name": "Bahçıvan Kebabı", "description": "240 / 310 / 290 kcal"},
                {"name": "Bulgur Pilavı", "description": "228 kcal"},
                {"name": "Haydari", "description": "140 kcal"},
            ],
        }
        types = [f["type"] for f in ex.validate_record(self.record(ITEM_DINNER), "2026-10-18", ld)]
        self.assertNotIn("jsonld_mismatch", types)

    def test_jsonld_cross_check(self):
        ld = {"@type": "ItemList", "itemListElement": [{"name": "Başka"}]}
        types = [f["type"] for f in ex.validate_record(self.record(ITEM_BREAKFAST), "2026-10-18", ld)]
        self.assertIn("jsonld_mismatch", types)


if __name__ == "__main__":
    unittest.main()
