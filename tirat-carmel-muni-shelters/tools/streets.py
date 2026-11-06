"""Fetch full street geometry (all OSM ways) for every street in source.tsv -> tools/streets.json"""
import json, time, urllib.parse, urllib.request, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
UA = "TiratCarmelShelters/1.0 (municipal shelter map)"
names = {l.split("\t")[3] for l in (ROOT/"tools/source.tsv").read_text().splitlines()}
ALIAS = {"גיורא": ["גיורא יוספטל"], "הרמב\"ם": ["רמב\"ם", "הרמב\"ם"], "יצחק בן צבי": ["בן צבי", "יצחק בן צבי"],
         "ששת הימים": ["מלחמת ששת הימים", "ששת הימים"], "הרב משה מרדכי": ["משה מרדכי", "הרב משה מרדכי"], "השריון": ["השריון", "שריון"]}
out = {}
for n in sorted(names):
    lines = []
    for alias in ALIAS.get(n, [n]):
        url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({"street": alias, "city": "טירת כרמל", "countrycodes": "il",
              "format": "jsonv2", "limit": 40, "polygon_geojson": 1, "dedupe": 0, "accept-language": "he"})
        r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30)); time.sleep(1.1)
        for x in r:
            g = x.get("geojson", {})
            if x.get("category") != "highway": continue
            if g.get("type") == "LineString": lines.append(g["coordinates"])
            elif g.get("type") == "MultiLineString": lines += g["coordinates"]
        if lines: break
    out[n] = lines
    print(n, len(lines), "ways")
(ROOT/"tools/streets.json").write_text(json.dumps(out, ensure_ascii=False))
