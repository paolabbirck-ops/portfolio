"""Esqueletos de "the future" a partir de fontes SVG de linha única (EMS/Hershey, OFL)."""
import re, os
import numpy as np

FD = os.path.join(os.path.dirname(__file__), 'fonts')


def _num(s):
    return [float(x) for x in re.findall(r'-?\d+(?:\.\d+)?(?:e-?\d+)?', s)]


def parse_path(d):
    """Só M/L (e minúsculas) — as fontes de linha única usam polilinhas."""
    strokes, cur, pos = [], None, np.zeros(2)
    for cmd, args in re.findall(r'([MLml])([^MLml]*)', d):
        v = _num(args)
        pts = [np.array(v[i:i + 2]) for i in range(0, len(v) - 1, 2)]
        for k, p in enumerate(pts):
            if cmd in 'ml':
                p = pos + p if cmd == 'm' else p
                if k == 0:
                    if cur is not None and len(cur) > 1:
                        strokes.append(np.array(cur))
                    cur = [p]
                else:
                    cur.append(p)
            else:
                p = pos + p if cmd == 'l' else p
                if cur is None:
                    cur = [pos.copy()]
                cur.append(p)
            pos = p
    if cur is not None and len(cur) > 1:
        strokes.append(np.array(cur))
    return strokes


def load_font(name):
    src = open(os.path.join(FD, name + '.svg')).read()
    m = re.search(r'units-per-em="([\d.]+)"', src)
    upm = float(m.group(1)) if m else 1000.0
    dflt = re.search(r'<font [^>]*horiz-adv-x="([\d.]+)"', src)
    glyphs = {}
    for g in re.finditer(r'<glyph([^>]*)/?>', src):
        a = g.group(1)
        u = re.search(r'unicode="([^"]*)"', a)
        if not u:
            continue
        ch = u.group(1).replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        adv = re.search(r'horiz-adv-x="([-\d.]+)"', a)
        d = re.search(r' d="([^"]*)"', a)
        glyphs[ch] = (float(adv.group(1)) if adv else float(dflt.group(1)) if dflt else upm / 2,
                      parse_path(d.group(1)) if d else [])
    return glyphs, upm


def word(name, text='the future', track=0.0, space=None):
    """Lista de traços (y para baixo, em unidades da fonte) e a largura total."""
    glyphs, upm = load_font(name)
    x, out = 0.0, []
    for ch in text:
        adv, strokes = glyphs.get(ch, (upm * .3, []))
        if ch == ' ' and space is not None:
            adv = space * upm
        for s in strokes:
            p = s.copy()
            p[:, 0] += x
            p[:, 1] = -p[:, 1]
            out.append(p)
        x += adv + track * upm
    return out, upm
