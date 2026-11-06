"""Build data/shelters.js from tools/source.tsv + tools/streets.json (OSM street geometry) + landmark overrides.
No network needed. Re-run after editing source.tsv:  python3 -I tools/build_data.py
precision: verified = confirmed on site with the survey mode (tools/fixes.json)
           municipal= the municipality's own Google map (exact)
           landmark = pinned to a known building/POI (accurate)
           probable = inferred from a nearby map feature (approximate)
           street   = middle of the street on the map (approximate; navigation still uses the exact address)
           none     = street not in OpenStreetMap; not used for "nearest" until coordinates are added"""
import json, math, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
streets = json.loads((ROOT/"tools/streets.json").read_text())
streets["גיורא"] = streets.get("גיורא") or [[[34.96984, 32.75375]]]  # רח' גיורא יוספטל (OSM: "יוספטל")
# (street, number) -> (lat, lng, source)  — OpenStreetMap POIs
LANDMARKS = {
    ("הרצל", "39"): (32.764465, 34.970896, "קניון לב העיר"),
    ("ויצמן", "19"): (32.757453, 34.970295, "בי\"ס יגאל אלון"),
    ("הרב קוק", "6"): (32.764655, 34.973710, "בי\"ס זבולון המר"),
    ("הרב קוק", "12"): (32.765570, 34.972150, "חניית בי\"ס דגניה"),
    ("ששת הימים", "3"): (32.759388, 34.973042, "קופת חולים כללית"),
    ("נתן אלבז", "36"): (32.752782, 34.972281, "צומת נתן אלבז–גורדון"),
}
# per-shelter anchors (by id) where the street+number key is shared or the spot is inferred.
# "probable" = inferred from a nearby OSM feature; shown as approximate until verified in the field.
ID_ANCHORS = {
    44: (32.758299, 34.970500, "landmark", "מגרש הספורט של בי\"ס יגאל אלון"),
    11: (32.758775, 34.965801, "probable", "בית ספר ברח' נרקיסים, סמוך לרח' הכלניות"),
    22: ("near", "ז'בוטינסקי", 32.761772, 34.962811, "probable", "קטע הרחוב הסמוך למתנ\"ס (רח' אלמוג)"),
    46: ("near", "ז'בוטינסקי", 32.761772, 34.962811, "probable", "קטע הרחוב הסמוך למתנ\"ס (רח' אלמוג)"),
    36: ("near", "האלה", 32.752872, 34.973456, "probable", "קטע הרחוב הסמוך לבית העלמין"),
}
# The municipality's Google My Maps ("מקלטים ומיגוניות בטירת כרמל", mid=17pCpuBLG5NwHAdtu6qe6ZqtjE1N6KII),
# saved as tools/municipal_map.kml. Matched by hand: id -> (folder kind, placemark address, precision).
#   municipal = same address on the municipal map (exact)
#   probable  = nearby/neighbouring number or same compound on the municipal map (needs a field check)
import xml.etree.ElementTree as ET
KML_NS = {"k": "http://www.opengis.net/kml/2.2"}
def load_kml():
    pts = {}
    for f in ET.parse(ROOT/"tools/municipal_map.kml").getroot().iter("{http://www.opengis.net/kml/2.2}Folder"):
        fname = f.findtext("k:name", namespaces=KML_NS) or ""
        if fname.startswith("Directions"): continue
        kind = "מיגונית" if "מיגוניות" in fname else "מקלט"
        for pm in f.findall("k:Placemark", KML_NS):
            name = (pm.findtext("k:name", namespaces=KML_NS) or "").strip()
            addr = name.split("|")[-1].strip()
            lng, lat = map(float, pm.findtext(".//k:coordinates", namespaces=KML_NS).strip().split(",")[:2])
            pts.setdefault((kind, addr), (lat, lng))
    return pts
KML = load_kml()
M, P = "municipal", "probable"
MUNICIPAL = {
    1: ("מקלט", "ביאליק 4", M), 2: ("מקלט", "ביאליק 13", M), 3: ("מקלט", "ביאליק 29", M),
    5: ("מקלט", "בן צבי 10", M), 6: ("מקלט", "בן צבי 24", M), 7: ("מקלט", "בן צבי 38", M),
    8: ("מקלט", "גיורא 55", M), 9: ("מקלט", "האלה 14", M),
    12: ("מקלט", "הרב וינרוב 9", M), 13: ("מקלט", "הרב וינרוב 28", M), 14: ("מקלט", "הרב וינרוב 39", M),
    15: ("מקלט", "הרב זרביב 23", M), 16: ("מקלט", "הרב קוק 6", M), 18: ("מקלט", "הרצל 39", M),
    19: ("מקלט", "ויצמן 19", M), 20: ("מקלט", "ויצמן 71", M), 21: ("מקלט", "ז'בוטינסקי 7", M),
    22: ("מקלט", "ז'בוטינסקי 43", M), 23: ("מקלט", "ירושלים 3", M), 24: ("מקלט", "ירושלים 18", M),
    25: ("מקלט", "כרמל אליאס 18", M), 26: ("מקלט", "לוי אשכול 6", M), 27: ("מקלט", "רזיאל 8", M),
    28: ("מקלט", "רזיאל 28", M), 29: ("מקלט", "רזיאל 40", M), 30: ("מקלט", "רמב\"ם 15", M),
    31: ("מקלט", "רמב\"ם 22", M), 32: ("מקלט", "ש\"י עגנון 12", M),
    34: ("מיגונית", "ביאליק 36", M), 37: ("מקלט", "הגל 2", M), 38: ("מיגונית", "העצמאות 4", M),
    42: ("מקלט", "השריון 14", M), 45: ("מקלט", "ויצמן 28", M), 46: ("מיגונית", "ז'בוטינסקי 43", M),
    47: ("מיגונית", "ירושלים 6", M), 51: ("מיגונית", "נתן אלבז 22", M), 55: ("מיגונית", "רמב\"ם 4", M),
    59: ("מקלט", "ש\"י עגנון 12", M), 61: ("מיגונית", "ששת הימים 3", M),
    36: ("מיגונית", "האלה 18", P), 39: ("מיגונית", "הרב קוק 10", P), 48: ("מקלט", "כ״ג יורדי הסירה 4", P),
    49: ("מיגונית", "מוצקין 4", P), 60: ("מקלט", "ש\"י עגנון 12", P),
}
ANCHOR_TXT = {M: "מפת המקלטים של העירייה", P: "כתובת סמוכה במפת העירייה"}

# user-confirmed fixes exported from the site's edit mode (?edit=1) go here and win over everything
FIXES = json.loads((ROOT/"tools/fixes.json").read_text()) if (ROOT/"tools/fixes.json").exists() else {}

def near_on_street(lines, lat, lng):
    best, bd = None, 1e9
    for l in lines:
        for a, b in zip(l, l[1:] or l):
            dx, dy = b[0]-a[0], b[1]-a[1]; L = dx*dx+dy*dy
            t = 0 if L == 0 else max(0, min(1, ((lng-a[0])*dx+(lat-a[1])*dy)/L))
            q = (a[0]+t*dx, a[1]+t*dy); d = (q[0]-lng)**2+(q[1]-lat)**2
            if d < bd: best, bd = q, d
    return best[1], best[0]

def street_mid(lines):
    pts = [p for l in lines for p in l]
    if not pts: return None
    cx = sum(p[0] for p in pts)/len(pts); cy = sum(p[1] for p in pts)/len(pts)
    best, bd = None, 1e9
    for l in lines:
        for a, b in zip(l, l[1:] or l):
            dx, dy = b[0]-a[0], b[1]-a[1]; L = dx*dx+dy*dy
            t = 0 if L == 0 else max(0, min(1, ((cx-a[0])*dx+(cy-a[1])*dy)/L))
            q = (a[0]+t*dx, a[1]+t*dy); d = (q[0]-cx)**2+(q[1]-cy)**2
            if d < bd: best, bd = q, d
    return best[1], best[0]

out = []
for n, line in enumerate((ROOT/"tools/source.tsv").read_text().splitlines(), 1):
    kind, street, num, osm_street, note = line.split("\t")
    base = street.replace(" מול", "").split(" (")[0]
    lat = lng = None; prec = "none"; src = ""
    if str(n) in FIXES:
        lat, lng = FIXES[str(n)][:2]; prec = "verified"; src = "אומת בשטח"
    elif n in MUNICIPAL and MUNICIPAL[n][:2] in KML:
        k = MUNICIPAL[n]; lat, lng = KML[k[:2]]; prec = k[2]
        src = ANCHOR_TXT[prec] + ("" if prec == M else f" ({k[1]})")
    elif n in ID_ANCHORS:
        a = ID_ANCHORS[n]
        if a[0] == "near": lat, lng = near_on_street(streets[a[1]], a[2], a[3]); prec, src = a[4], a[5]
        else: lat, lng, prec, src = a
    elif (base, num) in LANDMARKS:
        lat, lng, src = LANDMARKS[(base, num)]; prec = "landmark"
    elif streets.get(osm_street):
        lat, lng = street_mid(streets[osm_street]); prec = "street"
    out.append({"id": n, "type": kind, "address": f"{street} {num}", "navAddress": f"{base} {num}, טירת כרמל",
                "note": note, "lat": round(lat, 6) if lat else None, "lng": round(lng, 6) if lng else None,
                "precision": prec, "anchor": src})
    print(f"{n:2} {prec:9} {street} {num}")
    if n in MUNICIPAL and MUNICIPAL[n][:2] not in KML: print("   !! not found in KML:", MUNICIPAL[n])
(ROOT/"data/shelters.js").write_text(
    "// נוצר אוטומטית ע\"י tools/build_data.py — אין לערוך ידנית. מקור הרשימה: אגף ביטחון וחירום, עיריית טירת כרמל\n"
    "// מיקומים: © OpenStreetMap contributors (ODbL)\n"
    "window.SHELTERS = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
(ROOT/"data/streets.js").write_text(
    "// גאומטריית רחובות מ-OpenStreetMap (ODbL) — שכבת גיבוי למפה כשאין אינטרנט/אריחי מפה\n"
    "window.STREETS = " + json.dumps({k: [[[round(p[1], 5), round(p[0], 5)] for p in l] for l in v] for k, v in streets.items()}, ensure_ascii=False) + ";\n")
