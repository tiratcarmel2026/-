import json, re, math, pathlib, sys, time, urllib.request
V=pathlib.Path(sys.argv[1]); R=pathlib.Path(sys.argv[2])
d=json.loads(re.search(r"window.SHELTERS = (\[.*\]);",(R/'data/shelters.js').read_text(),re.S).group(1))
la=[s['lat'] for s in d]; lo=[s['lng'] for s in d]
S,N,Wb,E=min(la)-0.006,max(la)+0.006,min(lo)-0.009,max(lo)+0.009
print('bbox',S,N,Wb,E)
def t(lat,lng,z):
    n=2**z; x=(lng+180)/360*n; y=(1-math.log(math.tan(math.radians(lat))+1/math.cos(math.radians(lat)))/math.pi)/2*n; return int(x),int(y)
UA={'User-Agent':'TiratCarmelShelters/1.0 (municipal shelter info video; one-time download of ~300 tiles)'}
todo=[]
for z in (13,14,15,16,17):
    x0,y0=t(N,Wb,z); x1,y1=t(S,E,z)
    pad=1 if z<=15 else 0
    for x in range(x0-pad,x1+1+pad):
        for y in range(y0-pad,y1+1+pad): todo.append((z,x,y))
print('tiles',len(todo))
got=0
for z,x,y in todo:
    f=V/'tiles'/str(z)/str(x)/f'{y}.png'
    if f.exists(): continue
    f.parent.mkdir(parents=True,exist_ok=True)
    for i in range(3):
        try:
            f.write_bytes(urllib.request.urlopen(urllib.request.Request(f'https://tile.openstreetmap.org/{z}/{x}/{y}.png',headers=UA),timeout=30).read()); got+=1; break
        except Exception as e:
            print('retry',z,x,y,e); time.sleep(2*(i+1))
    time.sleep(0.05)
print('downloaded',got)
