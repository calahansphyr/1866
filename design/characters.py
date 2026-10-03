"""Parametric toy-figure characters for the 1866 mockups, emitted as inline SVG.

Every figure shares one skeleton in a 120x200 box (feet at y~190), one light
direction (upper left), one outline color and weight. Portraits reuse the same
drawing with a cropped viewBox, so a character looks identical everywhere.
"""

INK = "#3A2A20"
SW = 2.2  # outline weight


def _hex(c):
    c = c.lstrip("#")
    return [int(c[i:i + 2], 16) for i in (0, 2, 4)]


def mix(c, other, t):
    a, b = _hex(c), _hex(other)
    return "#" + "".join(f"{round(a[i] + (b[i] - a[i]) * t):02X}" for i in range(3))


def light(c, t=0.22):
    return mix(c, "#FFFFFF", t)


def dark(c, t=0.18):
    return mix(c, "#1A0E08", t)


class Fig:
    _n = 0

    def __init__(self, key):
        Fig._n += 1
        self.p = f"{key}{Fig._n}"
        self.defs = []
        self.grads = {}

    def g(self, color):
        """Soft top-left to bottom-right shading for a fill color."""
        if color not in self.grads:
            gid = f"{self.p}g{len(self.grads)}"
            self.grads[color] = gid
            self.defs.append(
                f'<linearGradient id="{gid}" x1="0.15" y1="0" x2="0.85" y2="1">'
                f'<stop offset="0" stop-color="{light(color, 0.16)}"/>'
                f'<stop offset="1" stop-color="{dark(color, 0.14)}"/></linearGradient>')
        return f"url(#{self.grads[color]})"

    def pattern(self, name, body, w, h):
        pid = f"{self.p}{name}"
        self.defs.append(f'<pattern id="{pid}" width="{w}" height="{h}" patternUnits="userSpaceOnUse">{body}</pattern>')
        return f"url(#{pid})"


def o(fill, sw=SW):
    return f'fill="{fill}" stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round"'


# ---------------------------------------------------------------- parts

def legs(f, c):
    pants, boots = c["pants"], c["boots"]
    s = (f'<rect x="43" y="146" width="15" height="36" rx="6" {o(f.g(pants))}/>'
         f'<rect x="62" y="146" width="15" height="36" rx="6" {o(f.g(pants))}/>')
    for x in (37, 61):
        s += (f'<path d="M{x+3},178 h16 q4,0 4,5 v3 q0,4 -4,4 h-19 q-4,0 -4,-4 q0,-8 7,-8 z" {o(f.g(boots))}/>'
              f'<path d="M{x+2},183 h15" stroke="{light(boots, 0.3)}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>')
    return s


def skirt(f, c):
    col = c["dress"]
    s = ""
    for x in (44, 62):
        s += f'<ellipse cx="{x+7}" cy="187" rx="10" ry="5" {o(f.g(c["boots"]))}/>'
    s += f'<path d="M38,134 L82,134 Q92,166 97,184 Q60,193 23,184 Q28,166 38,134 Z" {o(f.g(col))}/>'
    s += f'<path d="M48,142 Q46,166 44,186 M60,142 V189 M72,142 Q74,166 76,186" stroke="{dark(col, 0.22)}" stroke-width="1.5" fill="none" opacity=".55"/>'
    if c.get("apron"):
        s += f'<path d="M46,138 L74,138 L78,182 Q60,186 42,182 Z" {o(f.g(c["apron"]))}/>'
    return s


def coat_tails(f, c):
    col = c["coat"]
    return (f'<path d="M35,140 L32,176 Q42,180 52,176 L58,146 Z" {o(f.g(col))}/>'
            f'<path d="M85,140 L88,176 Q78,180 68,176 L62,146 Z" {o(f.g(col))}/>')


def arm(f, c, side):
    skin, sleeve = c["skin"], c.get("coat") or c.get("sleeve") or c["shirt"]
    if side == "L":
        rot, x, hx, hy = 'rotate(10 30 102)', 22.5, 22, 147
    else:
        rot, x, hx, hy = 'rotate(-10 90 102)', 82.5, 98, 147
    s = ""
    if c.get("rolled"):
        s += f'<rect x="{x}" y="100" width="15" height="44" rx="7.5" transform="{rot}" {o(f.g(skin))}/>'
        s += f'<rect x="{x}" y="100" width="15" height="25" rx="7.5" transform="{rot}" {o(f.g(sleeve))}/>'
        s += f'<rect x="{x-0.5}" y="119" width="16" height="6" rx="3" transform="{rot}" {o(light(sleeve, 0.12))}/>'
    else:
        s += f'<rect x="{x}" y="100" width="15" height="44" rx="7.5" transform="{rot}" {o(f.g(sleeve))}/>'
        if c.get("garter"):
            s += f'<rect x="{x}" y="112" width="15" height="4" transform="{rot}" fill="{c["garter"]}" opacity=".9"/>'
        cuff = c.get("cuff")
        if cuff:
            s += f'<rect x="{x-0.5}" y="136" width="16" height="7" rx="3" transform="{rot}" {o(cuff)}/>'
    s += f'<circle cx="{hx}" cy="{hy}" r="7" {o(f.g(skin))}/>'
    return s


def torso(f, c):
    shirt = c["shirt"]
    s = f'<path d="M36,110 C36,99 44,95 52,95 L68,95 C76,95 84,99 84,110 L86,150 C86,156 82,158 76,158 L44,158 C38,158 34,156 34,150 Z" {o(f.g(shirt))}/>'
    if c.get("vest"):
        v = c["vest"]
        s += (f'<path d="M37,108 C38,99 45,96 52,96 L60,124 L60,152 L35,152 L36,116 Z" {o(f.g(v))}/>'
              f'<path d="M83,108 C82,99 75,96 68,96 L60,124 L60,152 L85,152 L84,116 Z" {o(f.g(v))}/>')
        for y in (132, 141):
            s += f'<circle cx="57" cy="{y}" r="1.6" fill="{dark(v, 0.4)}"/>'
    if c.get("coat"):
        col = c["coat"]
        s += (f'<path d="M36,110 C36,99 44,95 52,95 L57,124 L55,158 L44,158 C38,158 34,156 34,150 Z" {o(f.g(col))}/>'
              f'<path d="M84,110 C84,99 76,95 68,95 L63,124 L65,158 L76,158 C82,158 86,156 86,150 Z" {o(f.g(col))}/>'
              f'<path d="M52,95 L57,116 L49,104 Z" fill="{dark(col, 0.25)}"/>'
              f'<path d="M68,95 L63,116 L71,104 Z" fill="{dark(col, 0.25)}"/>')
    if c.get("suspenders"):
        sp = c["suspenders"]
        s += (f'<path d="M47,97 L49,146" stroke="{INK}" stroke-width="7.4" stroke-linecap="round"/>'
              f'<path d="M73,97 L71,146" stroke="{INK}" stroke-width="7.4" stroke-linecap="round"/>'
              f'<path d="M47,97 L49,146" stroke="{sp}" stroke-width="5" stroke-linecap="round"/>'
              f'<path d="M73,97 L71,146" stroke="{sp}" stroke-width="5" stroke-linecap="round"/>')
    if c.get("apron_top"):
        a = c["apron_top"]
        stripes = f.pattern("ap", f'<rect width="6" height="6" fill="{a}"/><rect width="2" height="6" fill="{dark(a, 0.12)}"/>', 6, 6)
        s += (f'<path d="M44,112 L76,112 L80,172 L40,172 Z" fill="{stripes}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
              f'<path d="M44,112 L50,97 M76,112 L70,97" stroke="{INK}" stroke-width="2.4"/>'
              f'<rect x="51" y="122" width="18" height="12" rx="2" fill="{dark(a, 0.08)}" stroke="{INK}" stroke-width="1.4"/>')
    if c.get("belt", True) and not c.get("dress") and not c.get("apron_top") and not c.get("coat"):
        s += (f'<rect x="34.5" y="143" width="51" height="7" {o("#4A3222")}/>'
              f'<rect x="56" y="142" width="8" height="9" rx="1.5" fill="none" stroke="#C9A14A" stroke-width="2"/>')
    if c.get("chain"):
        s += '<path d="M50,130 Q58,138 68,128" fill="none" stroke="#D8B04A" stroke-width="1.6"/><circle cx="68" cy="128" r="2" fill="#D8B04A"/>'
    if c.get("buttons", True) and not c.get("coat") and not c.get("vest") and not c.get("apron_top"):
        for y in (110, 121, 132):
            s += f'<circle cx="60" cy="{y}" r="1.7" fill="{dark(shirt, 0.35)}"/>'
    # collar
    col = c.get("collar", light(shirt, 0.35))
    s += (f'<path d="M51,94 L60,104 L53,108 Z" {o(col, 1.6)}/>'
          f'<path d="M69,94 L60,104 L67,108 Z" {o(col, 1.6)}/>')
    if c.get("tie"):
        s += f'<path d="M57,103 L63,103 L61,108 L63,118 L60,121 L57,118 L59,108 Z" {o(c["tie"], 1.4)}/>'
    if c.get("bow"):
        s += f'<path d="M52,100 L60,104 L52,108 Z M68,100 L60,104 L68,108 Z" {o(c["bow"], 1.4)}/>'
    return s


def overlay(f, c):
    s = ""
    if c.get("shawl"):
        sh = c["shawl"]
        s += (f'<path d="M31,108 C36,94 84,94 89,108 L74,132 L60,122 L46,132 Z" {o(f.g(sh))}/>'
              f'<path d="M46,132 l-2,5 M50,128 l-1,5 M74,132 l2,5 M70,128 l1,5" stroke="{dark(sh, 0.2)}" stroke-width="1.6" stroke-linecap="round"/>'
              f'<circle cx="60" cy="106" r="3.2" fill="#D8B04A" stroke="{INK}" stroke-width="1.2"/>')
    return s


def ears(f, c):
    sk = c["skin"]
    return (f'<ellipse cx="27.5" cy="64" rx="6" ry="8" {o(f.g(sk))}/>'
            f'<ellipse cx="92.5" cy="64" rx="6" ry="8" {o(f.g(sk))}/>'
            f'<path d="M26,61 q2,3 0,6 M94,61 q-2,3 0,6" stroke="{dark(sk, 0.25)}" stroke-width="1.4" fill="none"/>')


def hair_back(f, c):
    h, st = c.get("hair"), c.get("hairstyle")
    if st == "bun":
        return (f'<circle cx="60" cy="25" r="11" {o(f.g(h))}/>'
                f'<path d="M53,21 q7,-5 14,0" stroke="{dark(h, 0.2)}" stroke-width="1.4" fill="none"/>')
    if st == "long":
        return f'<path d="M26,60 C22,92 30,104 42,104 L78,104 C90,104 98,92 94,60 Z" {o(f.g(h))}/>'
    return ""


def head(f, c):
    sk = c["skin"]
    s = f'<rect x="53" y="84" width="14" height="14" fill="{dark(sk, 0.14)}" stroke="{INK}" stroke-width="{SW}"/>'
    s += ears(f, c)
    s += f'<ellipse cx="60" cy="60" rx="33" ry="31" {o(f.g(sk))}/>'
    # soft cheek-side shade + forehead light
    s += f'<path d="M86,52 C92,72 82,88 64,91 C80,84 88,70 86,52 Z" fill="{dark(sk, 0.18)}" opacity=".35"/>'
    return s


def hair_front(f, c):
    h, st = c.get("hair"), c.get("hairstyle")
    d = dark(h, 0.25) if h else INK
    if st == "short":
        return (f'<path d="M27,60 C25,34 42,26 60,26 C80,26 96,36 93,60 C90,50 83,44 72,42 C66,49 54,50 45,46 C37,49 31,53 27,60 Z" {o(f.g(h))}/>'
                f'<path d="M45,46 C52,44 60,40 64,32 M72,42 C74,38 76,34 76,30" stroke="{d}" stroke-width="1.5" fill="none" opacity=".6"/>')
    if st == "bun":
        return (f'<path d="M28,62 C25,38 42,29 60,29 C78,29 95,38 92,62 C88,48 76,41 60,42 C44,41 32,48 28,62 Z" {o(f.g(h))}/>'
                f'<path d="M60,30 V42 M50,32 C44,36 38,44 36,52 M70,32 C76,36 82,44 84,52" stroke="{d}" stroke-width="1.4" fill="none" opacity=".55"/>')
    if st == "balding":
        return (f'<path d="M27,68 C25,54 30,45 39,42 C35,51 35,60 37,68 Z" {o(f.g(h))}/>'
                f'<path d="M93,68 C95,54 90,45 81,42 C85,51 85,60 83,68 Z" {o(f.g(h))}/>'
                f'<path d="M50,32 q8,-4 18,0 M53,36 q6,-3 12,0" stroke="{h}" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
                f'<ellipse cx="50" cy="38" rx="9" ry="4" fill="#FFFFFF" opacity=".28"/>')
    if st == "slick":
        return (f'<path d="M27,62 C25,34 44,25 62,26 C81,27 95,38 93,62 C90,47 80,39 64,39 C50,39 36,45 27,62 Z" {o(f.g(h))}/>'
                f'<path d="M36,46 C46,36 60,32 78,34 M42,44 C52,38 64,36 84,40" stroke="{light(h, 0.25)}" stroke-width="1.4" fill="none" opacity=".7"/>')
    if st == "long":
        return (f'<path d="M27,64 C24,36 42,27 60,27 C78,27 96,36 93,64 C88,50 74,40 60,40 C46,40 32,50 27,64 Z" {o(f.g(h))}/>'
                f'<path d="M60,28 V40" stroke="{d}" stroke-width="1.4" opacity=".6"/>')
    if st == "parted":
        return (f'<path d="M27,60 C25,33 42,26 58,26 C80,26 96,36 93,60 C90,48 82,42 70,40 L50,40 C40,42 31,50 27,60 Z" {o(f.g(h))}/>'
                f'<path d="M50,27 L50,40" stroke="{d}" stroke-width="1.5" opacity=".6"/>')
    return ""


def face(f, c):
    sk = c["skin"]
    hair = c.get("hair") or "#3A2A20"
    brow = dark(hair, 0.35) if c.get("hairstyle") != "bun" else dark(hair, 0.45)
    s = ""
    # eyes
    for x in (47, 73):
        if c.get("eyes") == "closed":
            s += f'<path d="M{x-4},67 q4,4 8,0" stroke="{INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
        else:
            s += (f'<ellipse cx="{x}" cy="66" rx="3.8" ry="4.8" fill="#2A1E16"/>'
                  f'<circle cx="{x+1.3}" cy="64.2" r="1.5" fill="#FFFFFF"/>')
    # brows
    tilt = c.get("brow", 0)
    s += (f'<path d="M41,{57+tilt} Q47,{54-tilt} 53,{57}" stroke="{brow}" stroke-width="2.6" fill="none" stroke-linecap="round"/>'
          f'<path d="M67,57 Q73,{54-tilt} 79,{57+tilt}" stroke="{brow}" stroke-width="2.6" fill="none" stroke-linecap="round"/>')
    # nose and cheeks
    s += f'<ellipse cx="60" cy="74.5" rx="3.6" ry="2.6" fill="{dark(sk, 0.2)}"/>'
    s += (f'<ellipse cx="40" cy="78" rx="5.5" ry="3.2" fill="#E07A62" opacity=".32"/>'
          f'<ellipse cx="80" cy="78" rx="5.5" ry="3.2" fill="#E07A62" opacity=".32"/>')
    if c.get("wrinkles"):
        s += f'<path d="M36,66 l-3,-1 M36,69 l-3,1 M84,66 l3,-1 M84,69 l3,1" stroke="{dark(sk, 0.3)}" stroke-width="1.2" stroke-linecap="round"/>'
    # beard sits under the mouth
    if c.get("beard"):
        b = c["beard"]
        s += (f'<path d="M30,64 C30,92 46,100 60,100 C74,100 90,92 90,64 C87,78 76,86 60,86 C44,86 33,78 30,64 Z" {o(f.g(b))}/>')
    mouth = c.get("mouth", "smile")
    if mouth == "smile":
        s += f'<path d="M53,82 Q60,88 67,82" stroke="{INK}" stroke-width="2.3" fill="none" stroke-linecap="round"/>'
    elif mouth == "grin":
        s += f'<path d="M50,81 Q60,93 70,81 Z" fill="#7A2A22" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/><path d="M52,82 H68 V84 Q60,86 52,84 Z" fill="#FFFFFF"/>'
    elif mouth == "flat":
        s += f'<path d="M54,84 Q60,85.5 66,84" stroke="{INK}" stroke-width="2.3" fill="none" stroke-linecap="round"/>'
    elif mouth == "soft":
        s += f'<path d="M55,83 Q60,86 65,83" stroke="{INK}" stroke-width="2.1" fill="none" stroke-linecap="round"/>'
    if c.get("mustache"):
        m = c["mustache"]
        s += f'<path d="M46,80 C50,75 57,76 60,78.5 C63,76 70,75 74,80 C70,84 63,82.5 60,81 C57,82.5 50,84 46,80 Z" {o(f.g(m), 1.6)}/>'
    if c.get("glasses"):
        s += (f'<circle cx="47" cy="66" r="7.5" fill="#FFFFFF" fill-opacity=".18" stroke="#6A5440" stroke-width="1.9"/>'
              f'<circle cx="73" cy="66" r="7.5" fill="#FFFFFF" fill-opacity=".18" stroke="#6A5440" stroke-width="1.9"/>'
              f'<path d="M54.5,65 Q60,62 65.5,65" stroke="#6A5440" stroke-width="1.9" fill="none"/>')
    if c.get("pencil"):
        s += '<path d="M84,58 L99,47" stroke="#2A2420" stroke-width="4.6" stroke-linecap="round"/><path d="M84,58 L99,47" stroke="#E8C24A" stroke-width="3" stroke-linecap="round"/>'
    return s


def hat(f, c):
    h = c.get("hat")
    if not h:
        return ""
    kind, col = h
    if kind == "cap":
        tweed = f.pattern("tw", f'<rect width="4" height="4" fill="{col}"/><path d="M0,4 L4,0" stroke="{dark(col, 0.15)}" stroke-width="1"/>', 4, 4)
        return (f'<path d="M26,54 C25,30 43,21 62,21 C82,21 95,31 95,47 L106,52 C107,57 98,58 92,56 C72,50 46,50 28,57 Z" fill="{tweed}" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>'
                f'<path d="M92,56 C98,58 107,57 106,52" fill="{dark(col, 0.2)}" stroke="{INK}" stroke-width="{SW}"/>'
                f'<circle cx="60" cy="22" r="3" fill="{dark(col, 0.25)}" stroke="{INK}" stroke-width="1.4"/>')
    if kind == "bowler":
        return (f'<ellipse cx="60" cy="40" rx="37" ry="7" {o(f.g(col))}/>'
                f'<path d="M35,40 C35,12 85,12 85,40 Z" {o(f.g(col))}/>'
                f'<path d="M35.5,35 C50,38 70,38 84.5,35 L85,40 C70,43 50,43 35,40 Z" fill="{light(col, 0.18)}"/>'
                f'<ellipse cx="50" cy="22" rx="7" ry="3" fill="#FFFFFF" opacity=".18"/>')
    if kind == "boater":
        straw = f.pattern("st", f'<rect width="6" height="6" fill="{col}"/><path d="M0,3 H6" stroke="{dark(col, 0.12)}" stroke-width="1"/>', 6, 6)
        return (f'<ellipse cx="60" cy="40" rx="40" ry="7.5" fill="{straw}" stroke="{INK}" stroke-width="{SW}"/>'
                f'<rect x="39" y="20" width="42" height="20" rx="4" fill="{straw}" stroke="{INK}" stroke-width="{SW}"/>'
                f'<rect x="39" y="30" width="42" height="7" fill="#B5322A" stroke="{INK}" stroke-width="1.4"/>')
    if kind == "bonnet":
        return (f'<path d="M20,74 C15,30 38,15 60,15 C82,15 105,30 100,74 C94,56 80,44 60,44 C40,44 26,56 20,74 Z" {o(f.g(col))}/>'
                f'<path d="M26,62 C30,40 44,26 60,26 C76,26 90,40 94,62" stroke="{dark(col, 0.2)}" stroke-width="1.5" fill="none" opacity=".6"/>'
                f'<path d="M20,74 Q30,94 54,99" stroke="{INK}" stroke-width="5.2" fill="none" stroke-linecap="round"/>'
                f'<path d="M100,74 Q90,94 66,99" stroke="{INK}" stroke-width="5.2" fill="none" stroke-linecap="round"/>'
                f'<path d="M20,74 Q30,94 54,99" stroke="{light(col, 0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>'
                f'<path d="M100,74 Q90,94 66,99" stroke="{light(col, 0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>'
                f'<path d="M60,100 L49,94 L49,106 Z M60,100 L71,94 L71,106 Z" {o(light(col, 0.3), 1.5)}/><circle cx="60" cy="100" r="3" {o(col, 1.5)}/>')
    if kind == "eyeshade":
        return (f'<path d="M28,50 C40,42 80,42 92,50" stroke="{INK}" stroke-width="5.4" fill="none" stroke-linecap="round"/>'
                f'<path d="M28,50 C40,42 80,42 92,50" stroke="#2F5E3E" stroke-width="3" fill="none" stroke-linecap="round"/>'
                f'<path d="M30,50 C42,44 78,44 90,50 L98,60 C80,53 40,53 22,60 Z" fill="{col}" fill-opacity=".82" stroke="{INK}" stroke-width="{SW}" stroke-linejoin="round"/>')
    if kind == "straw":
        straw = f.pattern("sh", f'<rect width="5" height="5" fill="{col}"/><path d="M0,5 L5,0" stroke="{dark(col, 0.12)}" stroke-width="1"/>', 5, 5)
        return (f'<ellipse cx="60" cy="38" rx="44" ry="9" fill="{straw}" stroke="{INK}" stroke-width="{SW}"/>'
                f'<path d="M38,38 C38,14 82,14 82,38 Z" fill="{straw}" stroke="{INK}" stroke-width="{SW}"/>'
                f'<path d="M38.5,33 C52,36 68,36 81.5,33 L82,38 C68,41 52,41 38,38 Z" fill="#8A5A33"/>')
    return ""


def prop(f, c):
    p = c.get("prop")
    if p == "paper":
        return ('<g transform="rotate(-10 104 138)"><rect x="90" y="122" width="30" height="34" rx="1.5" fill="#F6EEDB" stroke="#3A2A20" stroke-width="1.8"/>'
                '<path d="M94,129 H116 M94,135 H114 M94,140 H116 M94,145 H110" stroke="#5A4A3A" stroke-width="1.4"/></g>'
                f'<circle cx="98" cy="147" r="7" {o(f.g(c["skin"]))}/>')
    if p == "case":
        return (f'<rect x="4" y="146" width="34" height="26" rx="4" {o(f.g("#7A4A2A"))}/>'
                '<path d="M15,146 v-5 h12 v5" fill="none" stroke="#3A2A20" stroke-width="2.4"/>'
                '<path d="M4,158 H38" stroke="#C9A14A" stroke-width="2"/>'
                f'<circle cx="22" cy="146" r="7" {o(f.g(c["skin"]))}/>')
    if p == "ledger":
        return (f'<g transform="rotate(8 22 150)"><rect x="8" y="132" width="26" height="32" rx="2" {o(f.g("#7A2A1E"))}/>'
                '<path d="M12,136 V160" stroke="#D8B04A" stroke-width="1.6"/></g>'
                f'<circle cx="22" cy="147" r="7" {o(f.g(c["skin"]))}/>')
    return ""


def back_view(f, c):
    """The same figure seen from behind: no face or props, hair covers the head."""
    s = ""
    if c.get("dress"):
        s += skirt(f, {**c, "apron": None})
        if c.get("apron"):
            s += f'<path d="M50,134 L60,142 L70,134" stroke="{c["apron"]}" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    else:
        s += legs(f, c)
    if c.get("coat") and c.get("tails"):
        s += coat_tails(f, c)
    top = c.get("coat") or c.get("vest") or c["shirt"]
    s += f'<path d="M36,110 C36,99 44,95 52,95 L68,95 C76,95 84,99 84,110 L86,150 C86,156 82,158 76,158 L44,158 C38,158 34,156 34,150 Z" {o(f.g(top))}/>'
    if c.get("coat"):
        s += f'<path d="M60,118 V158" stroke="{dark(top, 0.25)}" stroke-width="1.6"/>'
    if c.get("suspenders"):
        sp = c["suspenders"]
        for d in ("M47,97 L60,124 L73,97", "M60,124 V150"):
            s += f'<path d="{d}" stroke="{INK}" stroke-width="7.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            s += f'<path d="{d}" stroke="{sp}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    if c.get("apron_top"):
        s += f'<path d="M36,140 H84" stroke="{c["apron_top"]}" stroke-width="4" stroke-linecap="round"/><path d="M58,140 l-5,10 M62,140 l5,10" stroke="{c["apron_top"]}" stroke-width="3" stroke-linecap="round"/>'
    if c.get("shawl"):
        sh = c["shawl"]
        s += f'<path d="M31,108 C36,94 84,94 89,108 L60,140 Z" {o(f.g(sh))}/>'
    s += arm(f, c, "L") + arm(f, c, "R")
    sk = c["skin"]
    s += f'<rect x="53" y="84" width="14" height="14" fill="{dark(sk, 0.14)}" stroke="{INK}" stroke-width="{SW}"/>'
    s += ears(f, c)
    s += f'<ellipse cx="60" cy="60" rx="33" ry="31" {o(f.g(sk))}/>'
    h, st = c.get("hair"), c.get("hairstyle")
    if h:
        d = dark(h, 0.25)
        if st == "balding":
            s += f'<path d="M27,68 C26,80 40,90 60,90 C80,90 94,80 93,68 C88,74 74,78 60,78 C46,78 32,74 27,68 Z" {o(f.g(h))}/>'
        elif st == "long":
            s += f'<path d="M27,60 C25,30 95,30 93,60 C96,92 88,104 60,104 C32,104 24,92 27,60 Z" {o(f.g(h))}/>'
        else:
            s += f'<path d="M27,62 C24,34 42,28 60,28 C78,28 96,34 93,62 C94,78 84,90 60,90 C36,90 26,78 27,62 Z" {o(f.g(h))}/>'
            s += f'<path d="M44,40 C46,60 50,74 54,86 M76,40 C74,60 70,74 66,86 M60,30 V88" stroke="{d}" stroke-width="1.4" fill="none" opacity=".5"/>'
        if st == "bun":
            s += f'<circle cx="60" cy="50" r="12" {o(f.g(h))}/><path d="M52,48 q8,-6 16,0" stroke="{d}" stroke-width="1.4" fill="none"/>'
    hh = c.get("hat")
    if hh and hh[0] == "bonnet":
        col = hh[1]
        s += (f'<path d="M24,74 C18,30 40,17 60,17 C80,17 102,30 96,74 C90,86 76,92 60,92 C44,92 30,86 24,74 Z" {o(f.g(col))}/>'
              f'<path d="M34,82 C48,90 72,90 86,82" stroke="{dark(col, 0.2)}" stroke-width="1.5" fill="none"/>')
    elif hh:
        s += hat(f, c)
    return s


def figure(key, c, w=120, h=200, view=None, label=None, seated=False):
    """Full figure. view="portrait" crops to head and shoulders; view="back" turns it around."""
    f = Fig(key)
    body = ""
    if view != "portrait":
        body += '<ellipse cx="60" cy="191" rx="38" ry="6" fill="#2A2420" opacity=".18"/>'
    if view == "back":
        body += back_view(f, c)
    else:
        body += hair_back(f, c)
        if c.get("dress"):
            body += skirt(f, c)
        elif not seated:
            body += legs(f, c)
        if c.get("coat") and c.get("tails"):
            body += coat_tails(f, c)
        body += torso(f, c)
        body += arm(f, c, "L") + arm(f, c, "R")
        body += overlay(f, c)
        body += head(f, c) + hair_front(f, c) + face(f, c) + hat(f, c)
        body += prop(f, c)
    vb = "0 0 120 200" if view != "portrait" else "12 8 96 96"
    aria = f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"'
    return (f'<svg width="{w}" height="{h}" viewBox="{vb}" xmlns="http://www.w3.org/2000/svg"{aria} style="display: block; overflow: visible;">'
            f'<defs>{"".join(f.defs)}</defs>{body}</svg>')


# ---------------------------------------------------------------- the cast

SKINS = ["#F6D5B8", "#EBC09A", "#D19C6E", "#A86E45", "#7A4A2A", "#4E2E1C"]

CAST = {
    "jonah": dict(skin="#A86E45", hair="#2A1E16", hairstyle="short", shirt="#7F9F6E", rolled=True,
                  suspenders="#7A4A2A", pants="#4F5D73", boots="#4A3222", mouth="smile"),
    "ruth": dict(skin="#A86E45", hair="#C9C2B6", hairstyle="bun", shirt="#6E5A82", dress="#6E5A82",
                 shawl="#B5532E", boots="#3A2A20", glasses=True, wrinkles=True, mouth="soft", buttons=False, belt=False),
    "pruitt": dict(skin="#EBC09A", hair="#8A6A4A", hairstyle="balding", shirt="#F2EBDD", apron_top="#E8DCC0",
                   pants="#5A4A3A", boots="#3A2A20", mustache="#8A6A4A", garter="#B5322A", pencil=True, mouth="grin",
                   bow="#2A2420", prop="ledger"),
    "brandt": dict(skin="#F2C9A2", hair="#B58A4A", hairstyle="short", shirt="#E8DCC0", coat="#6B7A5E",
                   pants="#5A4A3A", boots="#3A2A20", beard="#C49A58", mustache="#B58A4A", hat=("cap", "#8A7A62"),
                   mouth="flat", brow=1.5, prop="paper"),
    "cole": dict(skin="#D19C6E", hair="#2A2420", hairstyle="slick", shirt="#F6F2EA", vest="#7A2E2E", coat="#2E2E36", tails=True,
                 pants="#3A3A44", boots="#1E1A18", hat=("bowler", "#2E2A28"), chain=True, tie="#2A2420", mouth="flat", cuff="#F6F2EA"),
    "ames": dict(skin="#7A4A2A", hair="#2A1E16", hairstyle="parted", shirt="#3E6C9A", dress="#3E6C9A", apron="#EFE6D2",
                 boots="#3A2A20", hat=("bonnet", "#E8DCC0"), mouth="smile", buttons=False, belt=False),
    "clerk": dict(skin="#F6D5B8", hair="#6B4226", hairstyle="parted", shirt="#F6F2EA", vest="#4A5468", pants="#3A3A44",
                  boots="#1E1A18", hat=("eyeshade", "#4E9A68"), garter="#2F5E9E", bow="#2F5E9E", mouth="soft"),
    "drummer": dict(skin="#EBC09A", hair="#A8461F", hairstyle="parted", shirt="#F6F2EA", coat="#B88A3A", pants="#B88A3A",
                    boots="#5A3A22", hat=("boater", "#E6C77A"), mustache="#A8461F", mouth="grin", bow="#B5322A", prop="case", brow=-1.5),
}

ROLES = {
    "jonah": ("Jonah Hollis", "you, the head of the family", "a future for the family"),
    "ruth": ("Grandma Ruth", "the family elder", "you to ask the right question"),
    "pruitt": ("Mr. Pruitt", "keeps the general store", "your business on his book"),
    "brandt": ("Herr Brandt", "neighbor, reads the German papers", "your back forty"),
    "cole": ("Mr. Cole", "runs the bank", "safe loans, with your land behind them"),
    "ames": ("Widow Ames", "neighbor across the creek", "help, and help back"),
    "clerk": ("Mr. Finch", "the telegraph clerk", "nothing, but he hears everything"),
    "drummer": ("Mr. Valentine", "a traveling salesman", "a quick sale"),
}


def jonah_with_skin(skin):
    c = dict(CAST["jonah"])
    c["skin"] = skin
    return c
