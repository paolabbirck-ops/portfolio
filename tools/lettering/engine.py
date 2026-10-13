"""Letreiramento procedural de "the future": esqueleto + ferramenta + textura de tinta escaneada.

Saída: máscara 0..255 (tinta) recortada, pronta para virar WebP cinza com alfa.
"""
import math, re, os
import numpy as np, cv2

from skel import load_font


# ---------- esqueleto ----------

def word_strokes(font, text='the future', space=None, track=0.0):
    glyphs, upm = load_font(font)
    x, out = 0.0, []
    for ci, ch in enumerate(text):
        adv, strokes = glyphs.get(ch, (upm * .3, []))
        if ch == ' ' and space is not None:
            adv = space * upm
        for s in strokes:
            p = s.astype(float).copy()
            p[:, 0] += x
            p[:, 1] = -p[:, 1]
            out.append((ci, p))
        x += adv + track * upm
    return out, upm


def split_cusps(p, ang=115):
    """Quebra a polilinha em curvas suaves nos bicos agudos (mantém o bico)."""
    if len(p) < 3:
        return [p]
    parts, start = [], 0
    for i in range(1, len(p) - 1):
        a, b = p[i] - p[i - 1], p[i + 1] - p[i]
        na, nb = np.linalg.norm(a), np.linalg.norm(b)
        if na < 1e-6 or nb < 1e-6:
            continue
        turn = math.degrees(math.acos(np.clip(np.dot(a, b) / (na * nb), -1, 1)))
        if turn > ang:
            parts.append(p[start:i + 1])
            start = i
    parts.append(p[start:])
    return [q for q in parts if len(q) >= 2]


def chaikin(p, it=3):
    for _ in range(it):
        if len(p) < 3:
            return p
        q = [p[0]]
        for i in range(len(p) - 1):
            a, b = p[i], p[i + 1]
            q += [a * .75 + b * .25, a * .25 + b * .75]
        q.append(p[-1])
        p = np.array(q)
    return p


def resample(p, step):
    seg = np.linalg.norm(np.diff(p, axis=0), axis=1)
    L = np.concatenate([[0], np.cumsum(seg)])
    if L[-1] < 1e-6:
        return p[:1], np.zeros(1)
    n = max(2, int(L[-1] / step) + 1)
    t = np.linspace(0, L[-1], n)
    x = np.interp(t, L, p[:, 0]); y = np.interp(t, L, p[:, 1])
    return np.stack([x, y], 1), t / L[-1]


class Noise1D:
    def __init__(self, rng, octaves=3):
        self.c = [(rng.uniform(.5, 1.5) * 2 ** o, rng.uniform(0, 6.28), .5 ** o) for o in range(octaves)]

    def __call__(self, x):
        return sum(a * np.sin(f * x + ph) for f, ph, a in self.c) / sum(a for _, _, a in self.c)


def hand(strokes, rng, xh, slant=0.0, wobble=.02, jitter=.04, rot=3.0, bounce=.06, scale_j=.06):
    """Imperfeições de mão: inclinação, tremor, letras saltando/girando."""
    out = []
    per = {}
    nx, ny = Noise1D(rng), Noise1D(rng)
    for ci, p in strokes:
        if ci not in per:
            per[ci] = (rng.normal(0, jitter * xh * .3), rng.normal(0, bounce * xh), math.radians(rng.normal(0, rot)),
                       1 + rng.normal(0, scale_j))
        dx, dy, r, k = per[ci]
        c = p.mean(0)
        q = (p - c) * k
        R = np.array([[math.cos(r), -math.sin(r)], [math.sin(r), math.cos(r)]])
        q = q @ R.T + c + [dx, dy]
        q[:, 0] += -q[:, 1] * math.tan(math.radians(slant))
        q[:, 0] += wobble * xh * nx(q[:, 1] / xh * 3.1 + q[:, 0] / xh)
        q[:, 1] += wobble * xh * ny(q[:, 0] / xh * 2.3)
        out.append((ci, q))
    return out


# ---------- ferramentas ----------

def _dirs(p):
    d = np.gradient(p, axis=0)
    n = np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
    return d / n


def taper(t, a=.12, b=.18, lo=.25):
    s = np.clip(t / a, 0, 1); e = np.clip((1 - t) / b, 0, 1)
    f = np.minimum(s, e)
    return lo + (1 - lo) * (f * f * (3 - 2 * f))


def tool_brush(img, p, t, r0, rng, contrast=.75, angle_thick=78, tap=(.12, .2, .2), grain=None):
    """Pincel/caneta-pincel: grosso na descida, fino na subida, ponta afinando."""
    d = _dirs(p)
    # descida (y para baixo) no ângulo da inclinação = grosso
    ang = math.radians(angle_thick)
    v = np.array([math.cos(ang), math.sin(ang)])
    down = np.clip(d @ v, -1, 1)
    w = (1 - contrast) + contrast * np.clip(down, 0, 1) ** .8
    w = np.maximum(w, 1 - contrast * .95)
    r = r0 * w * taper(t, *tap) * (1 + .08 * np.sin(t * rng.uniform(8, 20) + rng.uniform(0, 6)))
    # suaviza a largura
    r = np.convolve(np.pad(r, 4, mode='edge'), np.ones(9) / 9, mode='valid')
    for (x, y), rr in zip(p, r):
        cv2.circle(img, (int(x * 4), int(y * 4)), max(1, int(rr * 4)), 255, -1, cv2.LINE_AA, 2)


def tool_round(img, p, t, r0, rng, tap=None, var=.06):
    r = np.full(len(t), r0) * (1 + var * np.sin(t * rng.uniform(5, 12) + rng.uniform(0, 6)))
    if tap:
        r = r * taper(t, *tap)
    for (x, y), rr in zip(p, r):
        cv2.circle(img, (int(x * 4), int(y * 4)), max(1, int(rr * 4)), 255, -1, cv2.LINE_AA, 2)


def tool_nib(img, p, t, width, thick, angle, rng):
    """Pena chanfrada: varre um segmento inclinado ao longo do traço."""
    a = math.radians(angle)
    u = np.array([math.cos(a), -math.sin(a)]) * width / 2
    for i in range(len(p) - 1):
        a0, a1 = p[i], p[i + 1]
        poly = np.array([a0 - u, a0 + u, a1 + u, a1 - u]) * 4
        cv2.fillConvexPoly(img, poly.astype(np.int32), 255, cv2.LINE_AA, 2)
    if thick > 0:
        for (x, y) in p[::2]:
            cv2.circle(img, (int(x * 4), int(y * 4)), max(1, int(thick * 4)), 255, -1, cv2.LINE_AA, 2)


def tool_drybrush(img, p, t, r0, rng, bristles=22, contrast=.6):
    """Pincel seco: cerdas que falham, deixando riscos."""
    d = _dirs(p)
    nrm = np.stack([-d[:, 1], d[:, 0]], 1)
    down = np.clip(d @ np.array([.2, .98]), 0, 1)
    wid = r0 * ((1 - contrast) + contrast * down ** .8) * taper(t, .08, .25, .35)
    offs = np.sort(rng.uniform(-1, 1, bristles))
    for o in offs:
        n1 = Noise1D(rng, 4)
        ink = 0.55 + 0.45 * n1(t * rng.uniform(6, 18)) - np.clip((t - rng.uniform(.55, .95)) * 4, 0, 1) * rng.uniform(.4, 1.2)
        rad = max(.6, r0 * rng.uniform(.10, .2))
        for k in range(len(p)):
            if ink[k] < .25:
                continue
            q = p[k] + nrm[k] * o * wid[k]
            cv2.circle(img, (int(q[0] * 4), int(q[1] * 4)), max(1, int(rad * 4)), 255, -1, cv2.LINE_AA, 2)


# ---------- textura ----------

def fbm(shape, rng, scale=40, oct=4):
    h, w = shape
    acc = np.zeros(shape, np.float32); amp, tot = 1.0, 0.0
    for o in range(oct):
        s = max(2, int(scale / 2 ** o))
        g = rng.random((h // s + 2, w // s + 2)).astype(np.float32)
        acc += amp * cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)[:h, :w]
        tot += amp; amp *= .5
    return acc / tot


def ink_finish(mask, rng, rough=1.0, speck=.5, holes=.4, xh=100):
    """Borda irregular + falhas de impressão + pontinhos, como tinta escaneada/fotocópia."""
    m = mask.astype(np.float32) / 255
    # borda irregular
    n = fbm(m.shape, rng, scale=max(3, xh * .06), oct=3)
    b = cv2.GaussianBlur(m, (0, 0), max(.6, xh * .012 * rough))
    m = ((b + (n - .5) * .55 * rough) > .5).astype(np.float32)
    # falhas dentro da tinta (fotocópia)
    if holes > 0:
        g = fbm(m.shape, rng, scale=max(2, xh * .025), oct=2)
        h2 = rng.random(m.shape).astype(np.float32)
        m *= ~((g > 1 - .18 * holes) & (h2 > .35))
        m *= (rng.random(m.shape) > .035 * holes)
    # respingos perto da tinta
    if speck > 0:
        near = cv2.dilate((m > 0).astype(np.uint8), np.ones((int(xh * .12) | 1,) * 2, np.uint8)) > 0
        sp = (rng.random(m.shape) > 1 - .0009 * speck) & near
        sp = cv2.dilate(sp.astype(np.uint8), np.ones((2, 2), np.uint8))
        m = np.maximum(m, sp.astype(np.float32))
    m = cv2.GaussianBlur(m, (0, 0), .7)
    return (np.clip(m, 0, 1) * 255).astype(np.uint8)


# ---------- montagem ----------

def layout(strokes, xh_px, upm, xh_units, pad):
    s = xh_px / xh_units
    pts = np.vstack([p for _, p in strokes])
    mn = pts.min(0)
    out = [(ci, (p - mn) * s + pad) for ci, p in strokes]
    mx = (pts.max(0) - mn) * s + 2 * pad
    return out, int(mx[0]) + 1, int(mx[1]) + 1


def render(strokes, W, H, fn, rng, step=1.5, cusp=115, smooth=3):
    img = np.zeros((H, W), np.uint8)
    for ci, p in strokes:
        for part in split_cusps(p, cusp):
            q = chaikin(part, smooth)
            q, t = resample(q, step)
            fn(img, q, t, rng)
    return img


def crop(m, pad=6):
    ys, xs = np.where(m > 8)
    if not len(xs):
        return m
    return m[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]


# ---------- estilos extras ----------

def trace_outline(mask, rng, lw=2.2, wob=1.5, double=False):
    """Contorno desenhado à mão em volta de uma forma cheia."""
    cs, _ = cv2.findContours((mask > 127).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(mask)
    passes = 2 if double else 1
    for k in range(passes):
        for c in cs:
            if len(c) < 25:
                continue
            p = c[:, 0, :].astype(float)
            # suaviza e treme
            kk = 7
            p = np.stack([np.convolve(np.pad(p[:, i], kk, mode='wrap'), np.ones(2 * kk + 1) / (2 * kk + 1), 'valid') for i in range(2)], 1)
            n1, n2 = Noise1D(rng, 3), Noise1D(rng, 3)
            s = np.linspace(0, len(p) / 40, len(p))
            p[:, 0] += wob * n1(s) + k * rng.uniform(-2, 2)
            p[:, 1] += wob * n2(s) + k * rng.uniform(-2, 2)
            # pequena abertura (o traço não fecha perfeito)
            gap = int(len(p) * rng.uniform(0, .04))
            st = rng.integers(0, len(p))
            p = np.roll(p, -st, 0)[:len(p) - gap]
            q, t = resample(p, 1.2)
            tool_round(out, q, t, lw * (1 if k == 0 else .7), rng, tap=(.03, .05, .4), var=.15)
    return out


def guides(img, rng, ys, x0, x1, lw=1.3):
    """Pautas de caderno de caligrafia, levemente tortas."""
    for y in ys:
        n = Noise1D(rng, 2)
        xs = np.arange(x0, x1, 3.0)
        yy = y + 1.2 * n(xs / 300) + (xs - x0) * rng.uniform(-.004, .004)
        p = np.stack([xs, yy], 1)
        tool_round(img, p, np.linspace(0, 1, len(p)), lw * rng.uniform(.8, 1.2), rng, var=.25)


def practice_marks(img, rng, y, x0, x1, xh, slant=12):
    """Rabiscos de aquecimento (/ / / u u) acima da pauta, como no vídeo."""
    x = x0 + rng.uniform(0, xh)
    while x < x1:
        kind = rng.choice(['/', 'u', 'l'])
        h = xh * rng.uniform(.35, .6)
        sh = math.tan(math.radians(slant)) * h
        if kind == '/':
            p = np.array([[x, y], [x + sh, y - h]])
        elif kind == 'l':
            p = np.array([[x + sh, y - h * 1.6], [x, y]])
        else:
            tt = np.linspace(0, math.pi, 12)
            p = np.stack([x + (1 - np.cos(tt)) * h * .25 + sh * (1 - np.sin(tt)) * .2, y - h + np.sin(tt) * h], 1)
        q, t = resample(p, 1.5)
        tool_brush(img, q, t, xh * .05, rng, contrast=.5)
        x += xh * rng.uniform(.25, .5)


def drips(img, strokes_px, rng, r0, n=4, maxlen=1.2):
    """Escorridos de tinta saindo da base de algumas letras."""
    pts = np.vstack([p for _, p in strokes_px])
    base = np.percentile(pts[:, 1], 88)
    cand = pts[pts[:, 1] > base]
    if not len(cand):
        return
    for _ in range(n):
        x, y = cand[rng.integers(0, len(cand))]
        L = r0 * rng.uniform(1.5, 6) * maxlen
        ys = np.linspace(y, y + L, 40)
        xs = x + np.cumsum(rng.normal(0, .15, 40))
        rr = r0 * .55 * (1 - np.linspace(0, .5, 40))
        for xx, yv, r in zip(xs, ys, rr):
            cv2.circle(img, (int(xx * 4), int(yv * 4)), max(1, int(r * 4)), 255, -1, cv2.LINE_AA, 2)
        cv2.circle(img, (int(xs[-1] * 4), int(ys[-1] * 4)), int(r0 * .75 * 4), 255, -1, cv2.LINE_AA, 2)


def layout2(strokes, xh_px, xh_units, pad, sx=1.0):
    s = xh_px / xh_units
    pts = np.vstack([p for _, p in strokes])
    mn = pts.min(0)
    out = []
    for ci, p in strokes:
        q = (p - mn) * s
        q[:, 0] *= sx
        out.append((ci, q + pad))
    allq = np.vstack([q for _, q in out])
    W = int(allq[:, 0].max() + pad[0]) + 1
    H = int(allq[:, 1].max() + pad[1]) + 1
    base = (0 - mn[1]) * s + pad[1]
    return out, W, H, base, base - xh_px
