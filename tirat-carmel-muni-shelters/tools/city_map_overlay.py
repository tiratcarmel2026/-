"""Add the city's protected spaces (מיגוניות) to the printed Tirat Carmel city map (Mapot Va'od, 2024 edition),
in the map's own style: a maroon shield next to each address and a matching row in the legend.

The map itself is the publisher's property; this script only adds markers on top of it and changes nothing else.
Run it on the file the publisher supplies (for print: the clean, licensed file):

    python3 -I tools/city_map_overlay.py IN.pdf OUT.pdf [--check DIR] [--remove-sample-mark] [--unlocked]

--remove-sample-mark removes the publisher's "דוגמא" (sample) watermark: for the licensed owner of the map only.
--unlocked saves without the source file's permission restrictions (for the owner; opens/edits anywhere).

--check DIR also writes a close-up PNG of every marker, for a visual review before printing.

Positions are tied to this map edition's page geometry (1360.6 x 1927.6 pt). Most are anchored to the house-number
label printed on the map; the rest to a point read off the map (see ANCHORS). Verified visually on 2026-11-15.
"""
import pathlib, sys
import pymupdf as fitz

SHELTER_MAROON = (0.45499351620674133, 0.19699397683143616, 0.21399252116680145)   # the map's own "public shelter" colour
LEGEND_FONT_NAME = "FbSpoiler-Regular"                                          # the legend's typeface (embedded in the map)

# id (as in data/shelters.js) -> address, anchor.  ("num", label, (x, y)) = the house-number label nearest (x, y);
# ("pt", (x, y)) = a point read off the map.  check=True: placed with less certainty, confirm before printing.
ANCHORS = {
    34: ("ביאליק 36", ("num", "36", (802, 508))),
    36: ("האלה 17", ("pt", (923, 1277)), True),                  # municipal map: האלה 18; official list: האלה 17
    37: ("הגל 2", ("num", "2", (563, 1361))),
    38: ("העצמאות 4", ("num", "4", (859, 960))),
    39: ("הרב קוק 12", ("num", "12", (808, 732))),
    40: ("הרב וינרוב 17", ("num", "17", (744, 898))),
    41: ("הרב משה מרדכי 7", ("num", "7", (683, 883))),          # next to the municipal stadium
    42: ("השריון 14", ("num", "14", (665, 939))),
    44: ("ויצמן 19", ("pt", (635.5, 1219.9))),                   # Yigal Alon school sports yard
    45: ("ויצמן 28", ("num", "28", (695, 1342))),
    46: ("ז'בוטינסקי מול 39", ("pt", (657, 1121))),             # skatepark plaza
    47: ("ירושלים 6", ("num", "6", (715, 1420))),
    48: ("כ\"ג יורדי הסירה 2", ("num", "2", (801.6, 1186))),
    49: ("מוצקין 6", ("num", "6", (633.7, 535.6))),
    50: ("מוצקין 13", ("num", "13", (785.1, 418.5)), True),
    51: ("נתן אלבז 22", ("num", "22", (799, 1443))),
    52: ("נתן אלבז 23", ("num", "23", (811.7, 1522.9)), True),
    53: ("נתן אלבז 36", ("num", "36", (767.7, 1541))),           # Natan Elbaz–Gordon junction
    54: ("הצנחנים 2", ("num", "2", (853, 1152))),
    55: ("רמב\"ם 4", ("num", "4", (940, 749))),                   # by the Rabbi Chai Taieb synagogue
    56: ("רמב\"ם 8", ("num", "8", (928, 663))),
    57: ("ש\"י עגנון 2", ("num", "2", (721, 1506))),
    58: ("ש\"י עגנון 11", ("num", "11", (699, 1478))),
    59: ("ש\"י עגנון 12", ("pt", (772, 1440.6))),                # Moreshet compound, by the existing shelter
    60: ("ש\"י עגנון 14", ("pt", (744.3, 1414.6))),              # Moreshet compound
    61: ("ששת הימים 3", ("num", "3", (820, 1087))),
}
NOT_PLACED = {35: "גיורא 5", 43: "ויצמן 13"}   # address not identifiable on the map; add once the location is confirmed


def shield(page, cx, cy, s=1.0):
    """The protected-space symbol: a maroon shield with a white check, about the size of the map's shelter icon."""
    w, h = 6.2 * s, 7.0 * s
    x0, y0 = cx - w / 2, cy - h / 2
    sh = page.new_shape()
    p = fitz.Point
    sh.draw_polyline([p(x0, y0 + 0.9 * s), p(cx, y0), p(x0 + w, y0 + 0.9 * s), p(x0 + w, y0 + h * 0.48)])
    sh.draw_bezier(p(x0 + w, y0 + h * 0.48), p(x0 + w, y0 + h * 0.80), p(cx + 1.2 * s, y0 + h * 0.93), p(cx, y0 + h))
    sh.draw_bezier(p(cx, y0 + h), p(cx - 1.2 * s, y0 + h * 0.93), p(x0, y0 + h * 0.80), p(x0, y0 + h * 0.48))
    sh.draw_line(p(x0, y0 + h * 0.48), p(x0, y0 + 0.9 * s))
    sh.finish(color=(1, 1, 1), fill=SHELTER_MAROON, width=0.45 * s, closePath=True, lineJoin=1)
    sh.draw_polyline([p(cx - 1.55 * s, cy + 0.1 * s), p(cx - 0.35 * s, cy + 1.3 * s), p(cx + 1.75 * s, cy - 1.15 * s)])
    sh.finish(color=(1, 1, 1), width=0.75 * s, lineCap=1, lineJoin=1, closePath=False)
    sh.commit()


def obstacles(page):
    rects = []
    for b in page.get_text("rawdict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                if s["chars"] and s["size"] < 20:      # ignore the huge watermark letters
                    rects.append(fitz.Rect(s["bbox"]))
    for d in page.get_drawings():
        r = d["rect"]
        if d.get("fill") and 6 < r.width * r.height < 90:   # map icons
            rects.append(r)
    return rects


def best_spot(anchor_rect, obst, placed):
    """Put the symbol right beside the anchor, where it covers the least existing text/icons."""
    c = (anchor_rect.tl + anchor_rect.br) / 2
    best = None
    for dist in (6.5, 8.5, 10.5):
        for ang in range(0, 360, 30):
            import math
            q = c + fitz.Point(math.cos(math.radians(ang)), math.sin(math.radians(ang))) * (dist + max(anchor_rect.width, anchor_rect.height) / 2 - 2)
            box = fitz.Rect(q.x - 3.4, q.y - 3.8, q.x + 3.4, q.y + 3.8)
            cost = sum((box & r).get_area() for r in obst if box.intersects(r)) + 50 * sum(box.intersects(r) for r in placed) + dist * 0.4
            if best is None or cost < best[0]:
                best = (cost, q, box)
    return best


def number_rect(page, label, near):
    best = None
    for b in page.get_text("rawdict")["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                txt = "".join(ch["c"] for ch in s["chars"]).split()
                if label in txt and s["size"] < 7.6:
                    r = fitz.Rect(s["bbox"])
                    if len(txt) > 1:   # several numbers in one label ("38 36"): take this number's own characters
                        chars = [ch for ch in s["chars"] if ch["c"].strip()]
                        i = "".join(ch["c"] for ch in s["chars"]).find(label)
                        r = fitz.Rect(s["chars"][i]["bbox"]) | fitz.Rect(s["chars"][i + len(label) - 1]["bbox"])
                    d = abs((r.tl + r.br) / 2 - fitz.Point(near))
                    if best is None or d < best[0]:
                        best = (d, r)
    if best is None or best[0] > 18:
        raise SystemExit(f"house number {label} not found near {near}: is this the same map edition?")
    return best[1]


def legend_font(doc, page):
    """The legend's own Type0 font (FbSpoiler-Regular): resource name, unicode->CID map and CID widths."""
    import re
    for xref, ext, typ, name, ref, enc, *_ in page.get_fonts(full=True):
        if typ != "Type0" or not name.endswith(LEGEND_FONT_NAME):
            continue
        tu = doc.xref_stream(int(doc.xref_get_key(xref, "ToUnicode")[1].split()[0])).decode("latin1")
        cmap = {}
        for blk in re.findall(r"beginbfchar(.*?)endbfchar", tu, re.S):
            for a, b in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
                cmap[chr(int(b, 16))] = int(a, 16)
        for blk in re.findall(r"beginbfrange(.*?)endbfrange", tu, re.S):
            for a, b, c in re.findall(r"<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>", blk):
                for k in range(int(a, 16), int(b, 16) + 1):
                    cmap[chr(int(c, 16) + k - int(a, 16))] = k
        desc = int(doc.xref_get_key(xref, "DescendantFonts")[1].strip("[] ").split()[0])
        if doc.xref_object(desc).lstrip().startswith("["):          # indirect array [ n 0 R ]
            desc = int(doc.xref_object(desc).strip("[] \n").split()[0])
        w = doc.xref_get_key(desc, "W")[1]
        widths, toks, i = {}, re.findall(r"\[|\]|[\d.]+", w)[1:-1], 0
        while i < len(toks):
            first = int(toks[i])
            if toks[i + 1] == "[":
                j = i + 2
                while toks[j] != "]":
                    widths[first + j - i - 2] = float(toks[j]); j += 1
                i = j + 1
            else:
                for c in range(first, int(toks[i + 1]) + 1):
                    widths[c] = float(toks[i + 2])
                i += 3
        if all(ch in cmap for ch in "מיגונית."):
            return ref, cmap, widths
    raise SystemExit("legend font not found in this file")


def legend_row(doc, page):
    """A slim white box under 'שירותי חירום', drawn like the legend boxes, with the new row in the legend's own font."""
    x0, x1, y0, y1, r = 43.88, 151.71, 624.7, 639.9, 4.61
    sh = page.new_shape(); p = fitz.Point
    sh.draw_line(p(x0, y0 + r), p(x0, y1 - r)); sh.draw_bezier(p(x0, y1 - r), p(x0, y1 - r / 2), p(x0 + r / 2, y1), p(x0 + r, y1))
    sh.draw_line(p(x0 + r, y1), p(x1 - r, y1)); sh.draw_bezier(p(x1 - r, y1), p(x1 - r / 2, y1), p(x1, y1 - r / 2), p(x1, y1 - r))
    sh.draw_line(p(x1, y1 - r), p(x1, y0 + r)); sh.draw_bezier(p(x1, y0 + r), p(x1, y0 + r / 2), p(x1 - r / 2, y0), p(x1 - r, y0))
    sh.draw_line(p(x1 - r, y0), p(x0 + r, y0)); sh.draw_bezier(p(x0 + r, y0), p(x0 + r / 2, y0), p(x0, y0 + r / 2), p(x0, y0 + r))
    sh.finish(fill=(1, 1, 1), color=None, closePath=True); sh.commit()
    shield(page, 58.8, 632.3, 1.15)

    ref, cmap, widths = legend_font(doc, page)
    size, right, left = 10.17, 148.9, 67.0
    wlen = lambda txt: sum(widths.get(cmap[c], 1000) for c in txt) * size / 1000
    word = "מיגונית"
    dots = "." * int((right - wlen(word) - left) / wlen("."))
    visual = dots + word[::-1]                      # Hebrew drawn in visual order, right-aligned like the other rows
    x = right - wlen(visual)
    baseline = 635.4
    hexs = "".join(f"{cmap[c]:04X}" for c in visual)
    H = page.mediabox.height
    stream = f"q 0 g BT /{ref} {size} Tf 1 0 0 1 {x:.2f} {H - baseline:.2f} Tm <{hexs}> Tj ET Q".encode()
    page.wrap_contents()
    nx = doc.get_new_xref(); doc.update_object(nx, "<<>>"); doc.update_stream(nx, stream)
    cont = doc.xref_get_key(page.xref, "Contents")
    refs = cont[1].strip("[]") if cont[0] == "array" else cont[1]
    doc.xref_set_key(page.xref, "Contents", f"[{refs} {nx} 0 R]")


def remove_sample_mark(doc, page):
    """Blank the 5 form objects that draw only the large "דוגמא" watermark (FbReforma-Medium, size ~103)."""
    import re
    removed = 0
    for xref, ext, typ, name, ref, enc, form in page.get_fonts(full=True):
        if "FbReforma" not in name or not form:
            continue
        st = doc.xref_stream(form).decode("latin1")
        if len(re.findall(r"\bTj\b", st)) == 1 and "<010C011A010E0111010F>" in st:   # the single word "דוגמא"
            doc.update_stream(form, b"")
            removed += 1
    if removed != 5:
        raise SystemExit(f"expected 5 watermark objects, found {removed}: is this the same map edition?")
    return removed


def main():
    src, dst = sys.argv[1], sys.argv[2]
    check = sys.argv[sys.argv.index("--check") + 1] if "--check" in sys.argv else None
    doc = fitz.open(src); page = doc[0]
    if abs(page.rect.width - 1360.63) > 1 or abs(page.rect.height - 1927.56) > 1:
        raise SystemExit("unexpected page size: this script is calibrated for the 2024 Tirat Carmel city map")
    if "--remove-sample-mark" in sys.argv:
        print("sample watermark removed:", remove_sample_mark(doc, page), "objects")
    obst = obstacles(page); placed = []; spots = {}
    for sid, spec in ANCHORS.items():
        addr, anchor = spec[0], spec[1]
        rect = number_rect(page, anchor[1], anchor[2]) if anchor[0] == "num" else fitz.Rect(*anchor[1], *anchor[1])
        cost, q, box = best_spot(rect, obst, placed)
        placed.append(box); spots[sid] = (addr, q, rect)
    for sid, (addr, q, _) in spots.items():
        shield(page, q.x, q.y)
    legend_row(doc, page)
    if doc.metadata.get("encryption") and "--unlocked" not in sys.argv:
        # keep the publisher's restrictions exactly as in the source file (same permission flags, 128-bit RC4)
        import secrets
        doc.save(dst, garbage=0, deflate=True, encryption=fitz.PDF_ENCRYPT_RC4_128,
                 permissions=doc.permissions, owner_pw=secrets.token_hex(16), user_pw="")
    else:
        doc.save(dst, garbage=0, deflate=True)
    print(f"{len(spots)} protected spaces added -> {dst}")
    print("check before printing:", ", ".join(ANCHORS[i][0] for i in ANCHORS if len(ANCHORS[i]) > 2))
    print("not placed (location unclear on the map):", ", ".join(NOT_PLACED.values()))
    if check:
        out = fitz.open(dst)[0]; pathlib.Path(check).mkdir(parents=True, exist_ok=True)
        for sid, (addr, q, _) in spots.items():
            out.get_pixmap(dpi=300, clip=fitz.Rect(q.x - 30, q.y - 22, q.x + 30, q.y + 22)).save(f"{check}/{sid:02d}.png")
        out.get_pixmap(dpi=250, clip=fitz.Rect(20, 560, 170, 680)).save(f"{check}/legend.png")


if __name__ == "__main__":
    main()
