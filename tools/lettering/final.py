import sys, os, json, io
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np, cv2
from PIL import Image
import gen
gen.XH = 160
PICKS = ['fatbrush-12','capsmarker-11','guide_script-12','dry-11','outline_script-12','condensed-14','nib-13',
         'chunky-13','brushpen-11','drip-11','capsfat-13','mono-13','inline-12','fatbrush_i-13','guide_nib-11',
         'outline_caps-14','brushpen-12','dry-13','condensed-12','capsmarker-13','fatbrush-14','drip-13',
         'guide_script-13','nib-11','mono-12']
LIGHT = ('outline', 'mono', 'guide', 'nib', 'brushpen', 'condensed-12')
dst = sys.argv[1]; os.makedirs(dst, exist_ok=True)
man, items = [], []
for k, key in enumerate(PICKS):
    style, seed = key.rsplit('-', 1)
    m, box, font = gen.make(gen.STYLES[style], int(seed))
    top = 74 if key.startswith(LIGHT) else 60
    g = (m.astype(np.float32) * top / 255).round().astype(np.uint8)
    name = f'tf-{k+1:02d}.webp'
    b = io.BytesIO(); Image.fromarray(g).save(b, 'WEBP', quality=75, method=6)
    open(os.path.join(dst, name), 'wb').write(b.getvalue())
    man.append([name, m.shape[1], m.shape[0]] + [int(v) for v in box])
    items.append((m, f'{k+1:02d} {key}'))
    print(name, key, m.shape, len(b.getvalue()) // 1024, 'KB', flush=True)
json.dump(man, open(os.path.join(dst, 'manifest.json'), 'w'))
gen.sheet(items, os.path.join(dst, '..', 'finals.jpg'), cols=3)
