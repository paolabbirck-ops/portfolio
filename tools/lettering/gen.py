"""Gera candidatos de letreiramento de "the future" em vários estilos (como o vídeo de referência)."""
import sys, os, json, math
sys.path.insert(0, os.path.dirname(__file__))
import numpy as np, cv2
from engine import *
from skel import load_font

OUT = os.path.join(os.path.dirname(__file__), 'cand')
os.makedirs(OUT, exist_ok=True)
XH = 150  # altura-x em px na renderização


def units_h(font, ch):
    g, _ = load_font(font)
    ys = np.concatenate([s[:, 1] for s in g[ch][1]])
    return ys.max() - ys.min()


def base_strokes(font, text, rng, slant, wob, rot=3, bounce=.05, sx=1.0, space=None):
    st, upm = word_strokes(font, text, space=space)
    ref = units_h(font, 'E' if text.isupper() else 'u')
    st = hand(st, rng, ref, slant=slant, wobble=wob, rot=rot, bounce=bounce)
    pad = np.array([XH * 1.0, XH * 1.0])
    st, W, H, base, xline = layout2(st, XH, ref, pad, sx=sx)
    return st, W, H, base, xline


def make(style, seed):
    rng = np.random.default_rng(seed)
    S = style
    font = S['font'][rng.integers(0, len(S['font']))]
    text = S.get('text', 'the future')
    slant = rng.uniform(*S.get('slant', (0, 8)))
    st, W, H, base, xline = base_strokes(font, text, rng, slant, S.get('wob', .025), rot=S.get('rot', 3),
                                         bounce=S.get('bounce', .05), sx=S.get('sx', 1.0), space=S.get('space'))
    r = XH * S.get('r', .1) * rng.uniform(.9, 1.1)
    tool = S['tool']
    if tool == 'brush':
        fn = lambda img, p, t, rr: tool_brush(img, p, t, r, rr, contrast=S.get('contrast', .75), angle_thick=90 - slant)
    elif tool == 'round':
        fn = lambda img, p, t, rr: tool_round(img, p, t, r, rr, tap=S.get('tap'), var=S.get('var', .08))
    elif tool == 'nib':
        fn = lambda img, p, t, rr: tool_nib(img, p, t, r * 2, r * .08, S.get('nib', 38) + rng.uniform(-6, 6), rr)
    elif tool == 'dry':
        fn = lambda img, p, t, rr: tool_drybrush(img, p, t, r, rr, bristles=S.get('bristles', 26))
    m = render(st, W, H, fn, rng, step=1.4, cusp=S.get('cusp', 115), smooth=3)
    word_mask = m
    if S.get('drips'):
        drips(m, st, rng, r, n=S['drips'])
    if S.get('inline'):
        thin = render(st, W, H, lambda img, p, t, rr: tool_round(img, p, t, max(1.2, r * .16), rr, tap=(.2, .2, .1)), rng, step=1.4)
        m = cv2.subtract(m, cv2.dilate(thin, np.ones((2, 2), np.uint8)))
    if S.get('outline'):
        m = trace_outline(m, rng, lw=S.get('lw', 2.4), wob=S.get('owob', 2.0), double=S.get('double', False))
    # pautas e rabiscos de aquecimento: estendem a tela para os lados
    ys, xs = np.where(word_mask > 100)
    wb = [xs.min(), ys.min(), xs.max(), ys.max()]
    if S.get('guides'):
        ext = int((wb[2] - wb[0]) * .45)
        big = np.zeros((H + XH, W + 2 * ext), np.uint8)
        big[XH:XH + H, ext:ext + W] = m
        m = big
        wb = [wb[0] + ext, wb[1] + XH, wb[2] + ext, wb[3] + XH]
        b, x = base + XH, xline + XH
        lines = [b, x] if S['guides'] == 2 else [b, x, x - (b - x) * 1.1]
        guides(m, rng, [l + rng.uniform(-3, 3) for l in lines], 0, m.shape[1], lw=S.get('glw', 1.4))
        if S.get('marks'):
            practice_marks(m, rng, x - (b - x) * 1.1 - 2, m.shape[1] * .35, m.shape[1] * .8, XH * .9, slant=slant + 4)
    m = ink_finish(m, rng, xh=XH, **S.get('finish', {}))
    # recorte: guarda a caixa da palavra (para encaixar no banner) relativa à imagem
    ys2, xs2 = np.where(m > 8)
    x0, y0, x1, y1 = xs2.min(), ys2.min(), xs2.max() + 1, ys2.max() + 1
    m = m[y0:y1, x0:x1]
    box = [wb[0] - x0, wb[1] - y0, wb[2] - x0, wb[3] - y0]
    return m, box, font


STYLES = {
    'fatbrush': dict(font=['HersheyScript1'], tool='brush', r=.26, contrast=.82, slant=(8, 16), wob=.03,
                     finish=dict(rough=1.3, holes=.5, speck=.7)),
    'fatbrush_i': dict(font=['EMSNixishItalic'], tool='brush', r=.24, contrast=.7, slant=(4, 12), wob=.03,
                       finish=dict(rough=1.3, holes=.5, speck=.7)),
    'brushpen': dict(font=['HersheyScript1', 'EMSNixishItalic'], tool='brush', r=.13, contrast=.88, slant=(4, 14),
                     finish=dict(rough=1.0, holes=.3, speck=.4)),
    'nib': dict(font=['EMSNixishItalic', 'HersheyScript1'], tool='nib', r=.15, slant=(0, 8), nib=36,
                finish=dict(rough=.8, holes=.2, speck=.3)),
    'capsmarker': dict(font=['EMSReadability', 'EMSNixish', 'EMSTech'], text='THE FUTURE', tool='round', r=.11, slant=(-3, 8),
                       rot=4, bounce=.06, finish=dict(rough=1.2, holes=.6, speck=.6)),
    'capsfat': dict(font=['EMSReadability', 'EMSNixish'], text='THE FUTURE', tool='brush', r=.2, contrast=.5, slant=(0, 10),
                    rot=5, bounce=.08, finish=dict(rough=1.4, holes=.7, speck=.8)),
    'outline_script': dict(font=['HersheyScript1'], tool='brush', r=.27, contrast=.8, slant=(8, 16),
                           outline=True, lw=2.2, owob=2.5, finish=dict(rough=.5, holes=0, speck=0)),
    'outline_caps': dict(font=['EMSReadability', 'EMSNixish'], text='THE FUTURE', tool='round', r=.19, slant=(-2, 6), rot=5,
                         outline=True, lw=2.0, owob=3, finish=dict(rough=.5, holes=0, speck=0)),
    'guide_script': dict(font=['HersheyScript1'], tool='brush', r=.12, contrast=.9, slant=(10, 20),
                         guides=3, marks=True, finish=dict(rough=1.1, holes=.4, speck=.5)),
    'guide_nib': dict(font=['HersheyScript1', 'EMSNixishItalic'], tool='nib', r=.13, slant=(4, 12), guides=2,
                      finish=dict(rough=.9, holes=.3, speck=.4)),
    'condensed': dict(font=['EMSNixishItalic', 'HersheyScript1'], tool='brush', r=.11, contrast=.9, sx=.62,
                      slant=(4, 12), finish=dict(rough=1.0, holes=.4, speck=.4)),
    'dry': dict(font=['HersheyScript1', 'EMSNixishItalic'], tool='dry', r=.22, slant=(4, 14), bristles=28,
                finish=dict(rough=.9, holes=.2, speck=.6)),
    'chunky': dict(font=['EMSReadability', 'EMSNixish'], tool='round', r=.19, slant=(-2, 4), rot=4, bounce=.07,
                   finish=dict(rough=1.6, holes=.5, speck=.8)),
    'mono': dict(font=['EMSReadability', 'EMSNixish', 'EMSElfin'], tool='round', r=.07, slant=(-2, 6), rot=3,
                 finish=dict(rough=.9, holes=.2, speck=.3)),
    'drip': dict(font=['HersheyScript1', 'EMSNixish'], tool='brush', r=.2, contrast=.6, slant=(2, 10), drips=6,
                 finish=dict(rough=1.3, holes=.5, speck=.7)),
    'inline': dict(font=['HersheyScript1'], tool='brush', r=.26, contrast=.75, slant=(8, 14), inline=True,
                   finish=dict(rough=1.0, holes=.3, speck=.5)),
}


def sheet(items, path, cols=3, tw=900, th=300):
    rows = (len(items) + cols - 1) // cols
    S = np.full((rows * th, cols * tw), 30, np.uint8)
    for k, (m, label) in enumerate(items):
        t = np.zeros((th - 4, tw - 4), np.uint8)
        s = min((tw - 30) / m.shape[1], (th - 40) / m.shape[0])
        mm = cv2.resize(m, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
        y = (t.shape[0] - mm.shape[0]) // 2 + 8; x = (t.shape[1] - mm.shape[1]) // 2
        t[y:y + mm.shape[0], x:x + mm.shape[1]] = mm
        cv2.putText(t, label, (8, 20), cv2.FONT_HERSHEY_SIMPLEX, .55, 120, 1)
        r, c = divmod(k, cols)
        S[r * th + 2:r * th + th - 2, c * tw + 2:c * tw + tw - 2] = t
    cv2.imwrite(path, S)


if __name__ == '__main__':
    names = sys.argv[1].split(',') if len(sys.argv) > 1 else list(STYLES)
    seeds = [int(x) for x in sys.argv[2].split(',')] if len(sys.argv) > 2 else [1, 2]
    items, meta = [], {}
    for n in names:
        for sd in seeds:
            m, box, font = make(STYLES[n], sd)
            key = f'{n}-{sd}'
            cv2.imwrite(os.path.join(OUT, key + '.png'), m)
            meta[key] = dict(box=[int(v) for v in box], font=font, size=list(m.shape[::-1]))
            items.append((m, f'{key} {font}'))
            print(key, font, m.shape, flush=True)
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
    sheet(items, os.path.join(os.path.dirname(__file__), sys.argv[3] if len(sys.argv) > 3 else 'cands.jpg'))
