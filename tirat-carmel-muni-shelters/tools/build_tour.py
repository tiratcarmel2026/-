"""Build the virtual tour over the printed city map: tour/index.html (+ tour/map.jpg, not committed: the map is licensed).

    python3 -I tools/build_tour.py "מפת טירת כרמל 2026.pdf" [--artifact OUT_DIR]

Takes the finished city map (with the protected spaces), renders it to tour/map.jpg, and puts every shelter and
protected space at its position on the map: the house-number positions from tools/citymap_*.json, or, for the rest,
the lat/lng from data/shelters.js converted with the same affine + local-correction fit that build_data.py uses.
--artifact also writes a self-contained page fragment (data inlined) + map.jpg for publishing as a claude.ai artifact.
"""
import json, pathlib, re, sys
import numpy as np
import pymupdf as fitz
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
DPI = 200
CITY_HALL = (837, 966)          # "עיריית טירת כרמל" on the map: where every tour starts


def load(name):
    p = ROOT / "tools" / name
    return {int(k): v for k, v in json.loads(p.read_text()).items()} if p.exists() else {}


def main():
    src = sys.argv[1]
    data = json.loads(re.search(r"window.SHELTERS = (\[.*\]);", (ROOT / "data/shelters.js").read_text(), re.S).group(1))
    by = {s["id"]: s for s in data}
    pos = {**load("citymap_refpoints.json"), **load("citymap_shelters.json"), **load("citymap_positions.json")}

    # geo -> map fit for places without a map position (exact lat/lng from the municipal map)
    ref = [i for i in pos if by[i]["precision"] in ("municipal", "citymap", "verified")]
    G = np.array([[by[i]["lat"], by[i]["lng"], 1] for i in ref]); P = np.array([pos[i] for i in ref], float)
    A = np.linalg.lstsq(G, P, rcond=None)[0]; Rz = P - G @ A

    def g2m(lat, lng):
        q = np.array([lat, lng, 1]) @ A
        w = 1 / (np.hypot(*(P - q).T) ** 2 + 400)
        return q + (w[:, None] * Rz).sum(0) / w.sum()

    doc = fitz.open(src); page = doc[0]
    # neighbourhood labels (the map's big blue names); two-line names are merged
    hoods = []
    for b in page.get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                if s["font"].startswith("FbTypograph-Bold") and s["size"] > 15 and s["color"] == 0x6BA9:
                    r = fitz.Rect(s["bbox"]); hoods.append([s["text"].strip(), (r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2])
    merged = []
    for h in sorted(hoods, key=lambda h: (round(h[1] / 10), h[2])):
        if merged and abs(merged[-1][1] - h[1]) < 6 and 0 < h[2] - merged[-1][2] < 20:
            merged[-1] = [merged[-1][0] + " " + h[0], merged[-1][1], (merged[-1][2] + h[2]) / 2]
        else:
            merged.append(h)
    fix = {"צבי-בן": "בן צבי"}
    hoods = [[fix.get(n, n), x, y] for n, x, y in merged]

    k = DPI / 72
    stops = []
    for s in data:
        xy = pos.get(s["id"]) or g2m(s["lat"], s["lng"]).tolist()
        hood = min(hoods, key=lambda h: (h[1] - xy[0]) ** 2 + (h[2] - xy[1]) ** 2)[0]
        stops.append({"id": s["id"], "type": s["type"], "address": s["address"], "note": s["note"],
                      "nav": s["navAddress"], "lat": s["lat"], "lng": s["lng"],
                      "x": round(xy[0] * k, 1), "y": round(xy[1] * k, 1), "hood": hood})

    out_dir = ROOT / "tour"; out_dir.mkdir(exist_ok=True)
    pix = page.get_pixmap(dpi=DPI)
    Image.frombytes("RGB", (pix.w, pix.h), pix.samples).save(out_dir / "map.jpg", quality=80, optimize=True, progressive=True)
    tour = {"w": pix.w, "h": pix.h, "start": [CITY_HALL[0] * k, CITY_HALL[1] * k], "stops": stops,
            "siteUrl": re.search(r"siteUrl:\s*'([^']+)'", (ROOT / "data/config.js").read_text()).group(1)}
    data_js = "window.TOUR = " + json.dumps(tour, ensure_ascii=False) + ";"
    frag = (ROOT / "tour/tour.html").read_text().replace("/*TOUR_DATA*/", data_js) \
        .replace("/*LEAFLET_CSS*/", (ROOT / "vendor/leaflet.css").read_text())

    (out_dir / "index.html").write_text(
        '<!DOCTYPE html>\n<html lang="he" dir="rtl"><head><meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        "</head><body>\n" + frag + "\n</body></html>\n")
    print(f"tour: {len(stops)} stops, map {pix.w}x{pix.h}px, hoods: {len(hoods)} -> {out_dir}")
    if "--artifact" in sys.argv:
        a = pathlib.Path(sys.argv[sys.argv.index("--artifact") + 1]); a.mkdir(parents=True, exist_ok=True)
        (a / "tour.html").write_text(frag)
        (a / "map.jpg").write_bytes((out_dir / "map.jpg").read_bytes())
        print("artifact files ->", a)


if __name__ == "__main__":
    main()
