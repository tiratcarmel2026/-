"""Build data/shelters.js from tools/source.tsv + tools/streets.json (OSM street geometry) + landmark overrides.
No network needed. Re-run after editing source.tsv:  python3 -I tools/build_data.py
precision: landmark = pinned to a known building/POI (accurate)
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
# user-confirmed fixes exported from the site's edit mode (?edit=1) go here and win over everything
FIXES = json.loads((ROOT/"tools/fixes.json").read_text()) if (ROOT/"tools/fixes.json").exists() else {}

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
        lat, lng = FIXES[str(n)]; prec = "landmark"; src = "סומן ידנית"
    elif (base, num) in LANDMARKS:
        lat, lng, src = LANDMARKS[(base, num)]; prec = "landmark"
    elif streets.get(osm_street):
        lat, lng = street_mid(streets[osm_street]); prec = "street"
    out.append({"id": n, "type": kind, "address": f"{street} {num}", "navAddress": f"{base} {num}, טירת כרמל",
                "note": note, "lat": round(lat, 6) if lat else None, "lng": round(lng, 6) if lng else None,
                "precision": prec, "anchor": src})
    print(f"{n:2} {prec:8} {street} {num}")
(ROOT/"data/shelters.js").write_text(
    "// נוצר אוטומטית ע\"י tools/build_data.py — אין לערוך ידנית. מקור הרשימה: אגף ביטחון וחירום, עיריית טירת כרמל\n"
    "// מיקומים: © OpenStreetMap contributors (ODbL)\n"
    "window.SHELTERS = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
(ROOT/"data/streets.js").write_text(
    "// גאומטריית רחובות מ-OpenStreetMap (ODbL) — שכבת גיבוי למפה כשאין אינטרנט/אריחי מפה\n"
    "window.STREETS = " + json.dumps({k: [[[round(p[1], 5), round(p[0], 5)] for p in l] for l in v] for k, v in streets.items()}, ensure_ascii=False) + ";\n")
