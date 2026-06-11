#!/usr/bin/env python3
"""Generate Instagram post images for TaxSathi AI (@taxsathi.ai).

Creates 1080x1080 branded square posts in marketing/instagram-posts/.
Audience: SMB owners / traders (end users) — helpful GST tips, not CA
sales pitches. Same brand palette as make_indiamart_photos.py.

Run:  python marketing/make_instagram_posts.py
"""

import os

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "instagram-posts")
LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "logo.jpeg")

SIZE = 1080
FONTS = "C:/Windows/Fonts"

BG_TOP = (8, 12, 32)
BG_BOTTOM = (26, 22, 74)
ACCENT = (139, 122, 245)
ACCENT2 = (74, 144, 240)
GREEN = (52, 211, 153)
RED = (248, 113, 113)
WHITE = (245, 247, 255)
MUTED = (168, 176, 214)
CARD = (20, 26, 58)
CARD_LIGHT = (30, 38, 80)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


F_BLACK = "segoeuib.ttf"
F_SEMI = "seguisb.ttf"
F_REG = "segoeui.ttf"
F_INDIC = "Nirmala.ttf"        # Gujarati / Devanagari
F_INDIC_B = "NirmalaB.ttf"


def indic_font(size, bold=False):
    """Nirmala UI renders Gujarati/Hindi; fall back to Segoe if missing."""
    for name in ([F_INDIC_B, F_INDIC] if bold else [F_INDIC]):
        try:
            return font(name, size)
        except OSError:
            continue
    return font(F_SEMI if bold else F_REG, size)


def gradient_bg():
    top = Image.new("RGB", (1, SIZE))
    for y in range(SIZE):
        t = y / (SIZE - 1)
        top.putpixel((0, y), tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)))
    return top.resize((SIZE, SIZE))


def base_canvas():
    img = gradient_bg()
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([SIZE - 300, -180, SIZE + 180, 300], fill=ACCENT + (38,))
    gd.ellipse([-180, SIZE - 300, 300, SIZE + 180], fill=ACCENT2 + (38,))
    return Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")


def header(img, d, M=64):
    """Logo + handle row; returns y below header."""
    try:
        logo = Image.open(LOGO_PATH).convert("RGB")
        lh = 96
        logo = logo.resize((lh, lh))
        mask = Image.new("L", (lh, lh), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, lh, lh], radius=22, fill=255)
        img.paste(logo, (M, M), mask)
        bx = M + lh + 22
    except Exception:
        bx = M
    d.text((bx, M + 8), "TaxSathi AI", font=font(F_BLACK, 42), fill=WHITE)
    d.text((bx, M + 58), "@taxsathi.ai", font=font(F_SEMI, 26), fill=ACCENT)
    return M + 96 + 46


def footer(d, M=64, text="Free mein poochho  •  taxsathi.online"):
    band_h = 96
    by = SIZE - band_h - M + 16
    d.rounded_rectangle([M, by, SIZE - M, by + band_h], radius=22, fill=CARD)
    d.text((M + 34, by + 20), text, font=font(F_SEMI, 32), fill=WHITE)
    d.text((M + 34, by + 60), "24/7  •  ગુજરાતી · हिंदी · English", font=indic_font(24), fill=MUTED)


def wrap(d, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if d.textlength(test, font=fnt) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# ── POST 1: GST late fee table ────────────────────────────────────────────────
def post_late_fee():
    img = base_canvas()
    d = ImageDraw.Draw(img)
    M = 64
    y = header(img, d, M)

    y += 26
    d.text((M, y), "GST Return Late?", font=font(F_BLACK, 76), fill=WHITE)
    y += 92
    d.text((M, y), "Yeh charge lagega 👇", font=font(F_SEMI, 44), fill=ACCENT)
    y += 84

    rows = [
        ("GSTR-3B (normal)", "₹50 / day", "₹25 CGST + ₹25 SGST"),
        ("GSTR-3B (nil return)", "₹20 / day", "₹10 CGST + ₹10 SGST"),
        ("Interest on late tax", "18% p.a.", "tax amount par"),
    ]
    for title, big, sub in rows:
        rh = 128
        d.rounded_rectangle([M, y, SIZE - M, y + rh], radius=20, fill=CARD)
        d.text((M + 34, y + 24), title, font=font(F_SEMI, 34), fill=MUTED)
        d.text((M + 34, y + 66), big, font=font(F_BLACK, 44), fill=RED if "₹" in big else ACCENT)
        sw = d.textlength(sub, font=font(F_REG, 28))
        d.text((SIZE - M - 34 - sw, y + 52), sub, font=font(F_REG, 28), fill=MUTED)
        y += rh + 18

    y += 8
    tip = "Sabse common galti: GSTR-1 time par, lekin 3B bhool gaye — 3B ki late fee alag se lagti hai!"
    tip_font = font(F_REG, 30)
    for line in wrap(d, tip, tip_font, SIZE - 2 * M):
        d.text((M, y), line, font=tip_font, fill=WHITE)
        y += 40

    footer(d, M)
    return img, "1-gst-late-fee.png"


# ── POST 2: registration thresholds ──────────────────────────────────────────
def post_registration():
    img = base_canvas()
    d = ImageDraw.Draw(img)
    M = 64
    y = header(img, d, M)

    y += 26
    d.text((M, y), "GST Registration", font=font(F_BLACK, 76), fill=WHITE)
    y += 92
    d.text((M, y), "Zaroori hai ya nahi? 🤔", font=font(F_SEMI, 44), fill=ACCENT)
    y += 88

    rows = [
        ("Goods bechte ho (shop, trading)", "₹40 lakh+", "turnover / year", ACCENT),
        ("Services dete ho (freelance, agency)", "₹20 lakh+", "turnover / year", ACCENT2),
        ("Amazon / Flipkart par bechte ho", "Day 1 se", "koi threshold nahi", GREEN),
    ]
    for title, big, sub, color in rows:
        rh = 150
        d.rounded_rectangle([M, y, SIZE - M, y + rh], radius=20, fill=CARD)
        d.text((M + 34, y + 22), title, font=font(F_SEMI, 32), fill=WHITE)
        d.text((M + 34, y + 70), big, font=font(F_BLACK, 52), fill=color)
        sw = d.textlength(sub, font=font(F_REG, 28))
        d.text((SIZE - M - 34 - sw, y + 86), sub, font=font(F_REG, 28), fill=MUTED)
        y += rh + 18

    y += 8
    tip = "Late register karoge toh purani sales par bhi tax + penalty lag sakti hai. Doubt hai? Pehle check karo."
    tip_font = font(F_REG, 30)
    for line in wrap(d, tip, tip_font, SIZE - 2 * M):
        d.text((M, y), line, font=tip_font, fill=WHITE)
        y += 40

    footer(d, M)
    return img, "2-gst-registration.png"


# ── POST 3: product card (chat mockup) ───────────────────────────────────────
def post_product():
    img = base_canvas()
    d = ImageDraw.Draw(img)
    M = 64
    y = header(img, d, M)

    y += 26
    d.text((M, y), "Raat ke 9 baje", font=font(F_BLACK, 72), fill=WHITE)
    y += 86
    d.text((M, y), "GST ka sawaal?", font=font(F_BLACK, 72), fill=ACCENT)
    y += 110

    # chat card
    ch_top = y
    ch_bot = SIZE - 64 - 96 - 40
    d.rounded_rectangle([M, ch_top, SIZE - M, ch_bot], radius=26, fill=(13, 17, 42))

    pad = 36
    cy = ch_top + pad
    # user bubble (right, gujarati)
    q = "GST late fee કેટલી લાગશે?"
    qf = indic_font(32, bold=True)
    qw = d.textlength(q, font=qf) + 56
    d.rounded_rectangle([SIZE - M - pad - qw, cy, SIZE - M - pad, cy + 74], radius=20, fill=ACCENT)
    d.text((SIZE - M - pad - qw + 28, cy + 18), q, font=qf, fill=(15, 10, 40))
    cy += 74 + 26

    # AI bubble (left)
    lines = [
        ("₹50/day (₹25 + ₹25). Nil return:", WHITE),
        ("₹20/day. Plus 18% p.a. interest. 📌", WHITE),
        ("Aur kuch poochhna hai? :)", MUTED),
    ]
    af = font(F_SEMI, 32)
    bw = max(d.textlength(t, font=af) for t, _ in lines) + 56
    bh = len(lines) * 44 + 36
    d.rounded_rectangle([M + pad, cy, M + pad + bw, cy + bh], radius=20, fill=CARD_LIGHT)
    ty = cy + 20
    for t, c in lines:
        d.text((M + pad + 28, ty), t, font=af, fill=c)
        ty += 44
    cy += bh + 30

    # trust chips
    chips = ["24/7 available", "Free plan", "3 languages"]
    cx = M + pad
    for chip in chips:
        cw = d.textlength(chip, font=font(F_SEMI, 26)) + 44
        d.rounded_rectangle([cx, cy, cx + cw, cy + 54], radius=27, outline=ACCENT, width=2)
        d.text((cx + 22, cy + 12), chip, font=font(F_SEMI, 26), fill=ACCENT)
        cx += cw + 16

    footer(d, M, text="Abhi try karo — taxsathi.online")
    return img, "3-ask-anytime.png"


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for fn in (post_late_fee, post_registration, post_product):
        img, name = fn()
        path = os.path.join(OUT_DIR, name)
        img.save(path, "PNG")
        print("wrote", path)


if __name__ == "__main__":
    main()
