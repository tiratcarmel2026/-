"""Printable A4 signs with a QR code for every shelter -> signs/index.html (+ signs/signs.pdf with --pdf).
The QR opens the site on that shelter (?s=<id>): navigation, the nearest alternative, and a one-tap "locked" report.
The URL comes from data/config.js (siteUrl). Decide the final address BEFORE printing: printed codes can't change.
Usage: python3 -I tools/build_signs.py [--pdf]"""
import io, json, pathlib, re, subprocess, sys, base64
import qrcode, qrcode.image.svg
ROOT = pathlib.Path(__file__).resolve().parent.parent
cfg = (ROOT/"data/config.js").read_text()
SITE = re.search(r"siteUrl:\s*'([^']+)'", cfg).group(1)
data = json.loads(re.search(r"window.SHELTERS = (\[.*\]);", (ROOT/"data/shelters.js").read_text(), re.S).group(1))
logo = "../assets/logo.png"
TITLE = {"shelter": "מקלט ציבורי", "protected": "מיגונית"}

def qr_svg(url):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, image_factory=qrcode.image.svg.SvgPathImage)
    q.add_data(url); q.make(fit=True)
    buf = io.BytesIO(); q.make_image().save(buf)
    svg = buf.getvalue().decode()
    return re.sub(r"<\?xml[^>]*>\s*", "", svg).replace("<svg ", '<svg class="qr" ', 1)

def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
pages = []
for s in data:
    url = f"{SITE}?s={s['id']}"
    title = TITLE[s["type"]]
    if "מחסה" == s["note"].strip(): title = "מחסה ציבורי"
    remote = "פתיחה מרחוק" in s["note"]
    pages.append(f"""<section class="sign sign--{s['type']}">
  <header><img src="{logo}" alt="עיריית טירת כרמל"><span>אגף ביטחון וחירום</span></header>
  <div class="kind">{title}</div>
  <div class="addr">{esc(s['address'])}</div>
  <div class="note">{esc(s['note'])}</div>
  <div class="mid">{qr_svg(url)}
    <ul><li><b>סרקו את הקוד</b> לניווט, למקלט הקרוב ולמידע</li>
        <li><b>המקום נעול או לא תקין?</b> סרקו ודווחו בלחיצה אחת</li>
        {'<li><b>נפתח מרחוק</b> בשעת חירום</li>' if remote else ''}</ul></div>
  <div class="call">מוקד עירוני <b>106</b></div>
  <footer><span class="url">{esc(url)}</span><span>מס׳ {s['id']}</span></footer>
</section>""")

FONT = lambda fam, f, w: f"@font-face{{font-family:'{fam}';src:url(fonts/{f}) format('woff2');font-weight:{w};font-display:block}}"
html = f"""<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>שלטי QR למקלטים — טירת כרמל</title>
<style>
{FONT('Assistant','assistant-hebrew-400-normal.woff2',400)}{FONT('Assistant','assistant-hebrew-700-normal.woff2',700)}{FONT('Assistant','assistant-hebrew-800-normal.woff2',800)}
{FONT('Assistant','assistant-latin-400-normal.woff2',400)}{FONT('Secular One','secular-one-hebrew-400-normal.woff2',400)}
@page {{ size: A4; margin: 0; }}
:root {{ --navy:#123E73; --shelter:#1E5A9E; --protected:#3F8A12; --sun:#F5A623; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #E9EEF4; font-family: Assistant, Arial, sans-serif; color: #12233A; }}
.help {{ max-width: 210mm; margin: 16px auto; padding: 12px 16px; background: #fff; border-radius: 12px; font-size: 15px; }}
.sign {{ width: 210mm; height: 297mm; margin: 0 auto 12px; background: #fff; display: grid; grid-template-rows: auto auto auto auto 1fr auto auto;
  padding: 14mm 16mm 10mm; border-top: 18mm solid var(--shelter); page-break-after: always; break-after: page; overflow: hidden; }}
.sign--protected {{ border-top-color: var(--protected); }}
header {{ display: flex; justify-content: space-between; align-items: center; }}
header img {{ height: 24mm; }}
header span {{ font-weight: 700; font-size: 16pt; color: var(--navy); }}
.kind {{ font-family: 'Secular One', Assistant, sans-serif; font-size: 64pt; line-height: 1.05; margin-top: 8mm; color: var(--shelter); }}
.sign--protected .kind {{ color: var(--protected); }}
.addr {{ font-family: 'Secular One', Assistant, sans-serif; font-size: 40pt; line-height: 1.1; margin-top: 2mm; }}
.note {{ font-size: 20pt; color: #44556B; margin-top: 3mm; min-height: 1em; }}
.mid {{ display: flex; align-items: center; gap: 10mm; margin-top: 8mm; }}
.qr {{ width: 92mm; height: 92mm; flex: 0 0 auto; }}
.qr path {{ fill: #000; }}
.mid ul {{ list-style: none; margin: 0; padding: 0; display: grid; gap: 6mm; font-size: 18pt; line-height: 1.3; }}
.mid li b {{ display: block; font-size: 20pt; }}
.call {{ align-self: end; background: var(--sun); border-radius: 6mm; padding: 4mm 8mm; font-size: 28pt; font-weight: 800; text-align: center; color: #2A1A00; }}
.call b {{ font-family: 'Secular One', Assistant, sans-serif; font-size: 40pt; font-weight: 400; }}
footer {{ display: flex; justify-content: space-between; margin-top: 4mm; font-size: 10pt; color: #6B7A8C; }}
footer .url {{ direction: ltr; }}
@media print {{ body {{ background: #fff; }} .help {{ display: none; }} .sign {{ margin: 0; }} }}
</style></head><body>
<div class="help"><b>שלטי QR ל-{len(data)} המקלטים והמיגוניות.</b> כל קוד פותח את האתר על המקום הספציפי. הדפסה: Ctrl+P, גודל A4, שוליים „ללא", עם גרפיקת רקע.
<br>הקודים מובילים אל <span dir="ltr">{esc(SITE)}</span>. אם כתובת האתר תשתנה, צריך להפיק ולהדפיס את השלטים מחדש.</div>
{''.join(pages)}
</body></html>"""
out = ROOT/"signs/index.html"; out.write_text(html); print("wrote", out, len(pages), "signs")

if "--pdf" in sys.argv:
    js = f"""const {{chromium}}=require('playwright');(async()=>{{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file://{out}');await p.evaluate(()=>document.fonts.ready);
await p.pdf({{path:'{ROOT/"signs/signs.pdf"}',format:'A4',printBackground:true,preferCSSPageSize:true}});await b.close();}})();"""
    subprocess.run(["node", "-e", js], check=True, env={**__import__("os").environ, "NODE_PATH": subprocess.check_output(["npm", "root", "-g"]).decode().strip()})
    print("wrote", ROOT/"signs/signs.pdf")
