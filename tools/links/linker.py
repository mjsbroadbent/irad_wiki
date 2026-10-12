import re, json, sys, unicodedata
VOLS=['Irad_Wiki_Vol1_Core.md','Irad_Wiki_Vol2_C_Class.md','Irad_Wiki_Vol3_Start_Stub.md']
import os
HERE=os.path.dirname(os.path.abspath(__file__))
D=(sys.argv[2] if len(sys.argv)>2 else '.').rstrip('/')+'/'
def fold(s): return unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower().strip()
HEAD=[re.compile(r'^### (?:\d+\.\d+\. )?(.+?)\s*$'),re.compile(r'^### (?:\d+\.\d+\. )?(.+?)\s*$'),re.compile(r'^#### \d+\. (.+?)\s*$')]
def is_head(vi,line):
    if vi<2: return bool(re.match(r'^### \d+\.\d+\. ',line) or line.strip()=='### Irad')
    return bool(re.match(r'^#### \d+\. ',line))
titles=[]
for vi,v in enumerate(VOLS):
    for line in open(D+v).read().split('\n'):
        if is_head(vi,line): titles.append(HEAD[vi].match(line).group(1))
tfold={fold(t):t for t in titles}
mode=sys.argv[1]   # 'int' or 'wp'; optional second argument: folder holding the three volumes (default .)
SKIP_INT={'Irad'}
if mode=='int':
    surf={t:t for t in titles if len(t)>=4 and t not in SKIP_INT and '(' not in t}
else:
    surf=json.load(open(os.path.join(HERE,'wp_map.json')))
keys=sorted(surf,key=len,reverse=True)
WORD=r"[\w'’\-]"
pats={k:re.compile(r'(?<![\w\-])'+re.escape(k)+r'(?![\w\-]|’\w|\'\w)') for k in keys}
PROT=re.compile(r'\[\[[^\]]*\]\]|`[^`]*`|<[^>]+>|https?://\S+|\*\*[^*]+\*\*|\{\{[^}]*\}\}')
LINK=re.compile(r'\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]')
total=0; per=0
def process(lines,cur_title):
    global total
    linked=set()
    for l in lines:
        for m in LINK.finditer(l):
            t=m.group(1).strip()
            linked.add(('wp',t[3:].strip()) if t.lower().startswith('wp:') else ('int',fold(t)))
    out=[]; in_refs=False; in_code=False
    for l in lines:
        s=l.strip()
        if s.startswith('```'): in_code=not in_code; out.append(l); continue
        if in_code or s.startswith('#') or s.startswith('*Quality') or s.startswith('<') or not s: 
            if re.match(r'^##\s+(References|See also|Notes|External links)',s): in_refs=True
            elif s.startswith('## '): in_refs=False
            out.append(l); continue
        if in_refs: out.append(l); continue
        table=s.startswith('|')
        # claimed spans
        prot=[(m.start(),m.end()) for m in PROT.finditer(l)]
        for m in re.finditer(r'(?<![*\w])\*(?!\*)([^*]+?)\*(?![*\w])',l):
            inner=m.group(1).strip()
            if inner not in surf: prot.append((m.start(),m.end()))
        claims=[]
        def free(a,b): return all(b<=x or a>=y for x,y in prot+[(c[0],c[1]) for c in claims])
        for k in keys:
            for m in pats[k].finditer(l):
                a,b=m.start(),m.end()
                if free(a,b): claims.append((a,b,k))
        claims.sort()
        new=l; off=0
        for a,b,k in claims:
            if mode=='int':
                key=('int',fold(surf[k]))
                if surf[k]==cur_title: continue
            else:
                key=('wp',surf[k])
                if table: continue
            if key in linked: continue
            # proper-noun continuation guard
            after=l[b:b+40]; before=l[max(0,a-40):a]
            if re.match(r'^ (?:[A-Z]\w+)',after) and not re.match(r'^ (?:And|Or|In|On|At|Of|The|To|By|As|For|With)\b',after): continue
            if re.search(r'(?:^|[^.!?:;] )[A-Z][\w\-]+ $',before) and not re.search(r'(?:The|In|On|At|Of|By|To|From|And|For|With|See) $',before): continue
            if re.search(r'-$',before): continue
            if mode=='int' and re.match(r"^(?:,? (?:and|or) [A-Z][\w\-]+)? (?:valley|valleys|basin|basins|plain|plains|river|rivers|system|systems|region|delta|headwaters|floodplain|watershed|gorge|canyon)\b",after): continue
            if mode=='int' and surf[k]=='Talas' and re.search(r'\b(?:the|upper|lower|middle) $',before,re.I): continue
            if mode=='int' and surf[k]=='Talas' and re.search(r'\b(?:Chu|Naryn) (?:and|or) $',before): continue
            txt=l[a:b]
            if mode=='int':
                rep=f'[[{surf[k]}]]' if txt==surf[k] else f'[[{surf[k]}|{txt}]]'
            else:
                rep=f'[[wp:{surf[k]}]]' if txt==surf[k] else f'[[wp:{surf[k]}|{txt}]]'
            if table and '|' in rep: continue
            new=new[:a+off]+rep+new[b+off:]; off+=len(rep)-(b-a)
            linked.add(key); total+=1
        out.append(new)
    return out
for vi,v in enumerate(VOLS):
    L=open(D+v).read().split('\n'); res=[]; buf=[]; cur=None
    for line in L:
        if is_head(vi,line) or re.match(r'^##? \d+\.',line) or re.match(r'^### \d\.Category',line):
            if buf: res+=process(buf,cur) if cur else buf
            buf=[]; res.append(line)
            cur=HEAD[vi].match(line).group(1) if is_head(vi,line) else None
            continue
        buf.append(line)
    if buf: res+=process(buf,cur) if cur else buf
    open(D+v,'w').write('\n'.join(res))
print(mode,'links added',total)
