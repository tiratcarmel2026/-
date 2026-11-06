"""Bundle the site into one self-contained HTML page (for sharing a preview, e.g. as a claude.ai artifact).
Usage: python3 -I tools/build_artifact.py OUT.html"""
import base64, pathlib, re, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
html = (ROOT/"index.html").read_text()
css = (ROOT/"vendor/leaflet.css").read_text() + "\n" + (ROOT/"css/app.css").read_text()
js = "".join((ROOT/p).read_text() + "\n" for p in ["data/shelters.js", "data/streets.js", "js/app.js"])
logo = "data:image/png;base64," + base64.b64encode((ROOT/"assets/logo.png").read_bytes()).decode()
html = re.sub(r"<!--INLINE-CSS-START-->.*?<!--INLINE-CSS-END-->", lambda m: "<style>\n" + css + "\n</style>", html, flags=re.S)
html = re.sub(r"<!--INLINE-JS-START-->.*?<!--INLINE-JS-END-->", lambda m:
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>\n<script>\n' + js.replace("</script", "<\\/script") + "\n</script>", html, flags=re.S)
html = html.replace('src="assets/logo.png"', f'src="{logo}"')
html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n', "", html)
# artifact pages get their own skeleton: keep only what is inside <head>/<body>
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
head = re.sub(r'<meta (charset|name="viewport")[^>]*>\n', "", head)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
pathlib.Path(sys.argv[1]).write_text(head.strip() + "\n" + body.strip() + "\n")
print("wrote", sys.argv[1])
