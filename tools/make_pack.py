"""Build the practice-data pack from materials/manifest.json.

Writes materials/README.md, materials/data/D13_emdat/HOW-TO-DOWNLOAD.md and
materials/pack.json (file lists and sizes for the page), and creates two zips in
dist/ that are uploaded as GitHub release assets (kept out of the repository):
  ai-research-practice-data.zip  – README + raw data
  ai-research-practice-pack.zip  – README + papers + raw data
Run from the repository root:  python3 tools/make_pack.py
"""
import json, os, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAT = os.path.join(ROOT, 'materials')
DIST = os.path.join(ROOT, 'dist')
m = json.load(open(os.path.join(MAT, 'manifest.json'), encoding='utf-8'))

emdat = os.path.join(MAT, 'data', 'D13_emdat')
os.makedirs(emdat, exist_ok=True)
open(os.path.join(emdat, 'HOW-TO-DOWNLOAD.md'), 'w', encoding='utf-8').write(
    "# EM-DAT – download it yourself\n\n"
    "EM-DAT (CRED/UCLouvain) lists more than 27,000 disasters worldwide since 1900. "
    "Its terms require registration and do not allow redistribution, so the data is not part of this pack.\n\n"
    "1. Go to https://public.emdat.be and create a free account (academic use).\n"
    "2. Accept the terms of use.\n"
    "3. Use *Access Data*, filter (e.g. disaster type: heat wave, flood, drought) and download the Excel file.\n"
    "4. Do not share the file further.\n")

def rel(p): return os.path.relpath(p, MAT).replace(os.sep, '/')
def files_in(d): return sorted(rel(os.path.join(MAT, d, f)) for f in os.listdir(os.path.join(MAT, d)) if not f.startswith('.'))
size = lambda r: os.path.getsize(os.path.join(MAT, r))

for p in m['papers']: p['size'] = size(p['file'])
for d in m['data']: d['files'] = [{'f': f, 'size': size(f)} for f in files_in(d['dir'])]

L = [f"# Practice data – {m['topic']}", '',
     f"Open papers and raw datasets for testing AI use cases in the workshop *Generative AI in Your Research*. Snapshot downloaded on {m['snapshot']}; the providers keep updating most series, so values may differ from today’s files.", '',
     'All files may be redistributed under the licence named for each item. Cite the sources as given. Items marked **non-commercial** (CC BY-NC) may only be used for non-commercial purposes such as research and teaching.', '',
     '## Papers', '']
grp = None
for p in m['papers']:
    if p['group'] != grp: L += ([''] if grp else []) + [f'### {p["group"]}', '']; grp = p['group']
    L.append(f"- **{p['id']}** {p['cite']} https://doi.org/{p['doi']} – *{p['licence']}*" + (f" – {p['version']}" if p.get('version') else '') + f"  \n  File: `{p['file']}`. {p['about']}")
L += ['', '## Raw data', '']
for d in m['data']:
    L.append(f"- **{d['id']} {d['title']}** – {d['provider']}. {d['span']}. Format: {d['format']}. *{d['licence']}*. Source: {d['source']}. Cite: {d['cite']}  \n  {d['notes']}  \n  Files: " + ', '.join(f"`{x['f']}`" for x in d['files']))
L += ['', '## Not included', ''] + [f'- **{a}** – {b}' for a, b in m['excluded']]
L += ['', '## Ideas for pairing papers and data', '', '| Paper | Data | Test idea |', '|---|---|---|'] + [f'| {a} | {b} | {c} |' for a, b, c in m['pairs']]
L += ['', '---', 'Compiled for the workshop by Prof. Dr. Manuel Kern · delivered by Hitachi Solutions. The pack contains third-party material; all rights remain with the authors and providers.', '']
open(os.path.join(MAT, 'README.md'), 'w', encoding='utf-8').write('\n'.join(L))

os.makedirs(DIST, exist_ok=True)
def make_zip(name, parts):
    path = os.path.join(DIST, name)
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.write(os.path.join(MAT, 'README.md'), 'practice-data/README.md')
        for part in parts:
            for base, _, fs in os.walk(os.path.join(MAT, part)):
                for f in sorted(fs):
                    if f.startswith('.'): continue
                    full = os.path.join(base, f)
                    z.write(full, 'practice-data/' + rel(full))
    return os.path.getsize(path)

m['zips'] = {'data': make_zip('ai-research-practice-data.zip', ['data']),
             'all': make_zip('ai-research-practice-pack.zip', ['papers', 'data'])}
json.dump(m, open(os.path.join(MAT, 'pack.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('README, pack.json written; zips:', {k: f'{v/1e6:.1f} MB' for k, v in m['zips'].items()})
