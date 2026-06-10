#!/usr/bin/env python3
"""Generate IndiaMART product photos for TaxSathi AI.

Creates three 1000x1000 branded images (one per catalog product) in
marketing/indiamart-photos/. Brand palette is taken from the app logo:
dark navy background with a blue->violet accent.

Run:  python marketing/make_indiamart_photos.py
"""

import os

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(__file__), "indiamart-photos")
LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "logo.jpeg")

SIZE = 1000
FONTS = "C:/Windows/Fonts"

# Brand palette
BG_TOP = (8, 12, 32)        # deep navy
BG_BOTTOM = (26, 22, 74)    # indigo
ACCENT = (139, 122, 245)    # violet (matches og-image)
ACCENT2 = (74, 144, 240)    # blue (matches logo)
WHITE = (245, 247, 255)
MUTED = (168, 176, 214)
CARD = (20, 26, 58)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


F_BLACK = "segoeuib.ttf"   # bold
F_SEMI = "seguisb.ttf"     # semibold
F_REG = "segoeui.ttf"      # regular


PRODUCTS = [
    {
        "file": "1-gst-billing-software.png",
        "title": "AI GST Billing Software",
        "subtitle": "in Gujarati",
        "features": [
            "WhatsApp order → GST invoice in seconds",
            "Auto GSTR-1 & GSTR-3B deadline reminders",
            "Built for Gujarat traders & shops",
        ],
    },
    {
        "file": "2-ai-tax-assistant.png",
        "title": "24/7 AI Tax Assistant",
        "subtitle": "for GST & ITR Queries",
        "features": [
            "Ask any GST / ITR question, get instant answers",
            "Gujarati  •  Hindi  •  English",
            "No training needed — works in your browser",
        ],
    },
    {
        "file": "3-gst-compliance-ca.png",
        "title": "GST Compliance &",
        "subtitle": "Deadline Reminder for CA Firms",
        "features": [
            "A personal AI assistant for every client",
            "Drafts GSTR-1 / 3B workings, tracks deadlines",
            "Frees your staff during filing season",
        ],
    },
]


def gradient_bg():
    base = Image.new("RGB", (SIZE, SIZE), BG_TOP)
    top = Image.new("RGB", (1, SIZE))
    for y in range(SIZE):
        t = y / (SIZE - 1)
        top.putpixel((0, y), tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)))
    base = top.resize((SIZE, SIZE))
    return base


def rounded(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def make(product):
    img = gradient_bg()
    d = ImageDraw.Draw(img)
    M = 70  # margin

    # --- soft accent glow blobs (drawn on an overlay, then alpha-composited) ---
    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([SIZE - 260, -160, SIZE + 160, 260], fill=ACCENT + (40,))
    gd.ellipse([-160, SIZE - 260, 260, SIZE + 160], fill=ACCENT2 + (40,))
    img = Image.alpha_composite(img.convert("RGBA"), glow).convert("RGB")
    d = ImageDraw.Draw(img)

    # --- logo mark (top-left), scaled from the app logo ---
    try:
        logo = Image.open(LOGO_PATH).convert("RGB")
        lh = 150
        logo = logo.resize((lh, lh))
        # round the logo corners with a mask
        mask = Image.new("L", (lh, lh), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, lh, lh], radius=28, fill=255)
        img.paste(logo, (M, M), mask)
        d = ImageDraw.Draw(img)
        brand_x = M + lh + 28
    except Exception:
        brand_x = M

    d.text((brand_x, M + 30), "TaxSathi AI", font=font(F_BLACK, 54), fill=WHITE)
    d.text((brand_x, M + 95), "taxsathi.online", font=font(F_SEMI, 30), fill=ACCENT)

    # --- accent rule under header ---
    y = M + 150 + 50
    d.rounded_rectangle([M, y, M + 90, y + 8], radius=4, fill=ACCENT)

    # --- product title ---
    y += 45
    title_font = font(F_BLACK, 74)
    for line in wrap(d, product["title"], title_font, SIZE - 2 * M):
        d.text((M, y), line, font=title_font, fill=WHITE)
        y += 84
    sub_font = font(F_SEMI, 46)
    for line in wrap(d, product["subtitle"], sub_font, SIZE - 2 * M):
        d.text((M, y), line, font=sub_font, fill=ACCENT)
        y += 56

    # --- feature bullets ---
    y += 40
    feat_font = font(F_REG, 34)
    for feat in product["features"]:
        # check chip
        cy = y + 6
        d.ellipse([M, cy, M + 38, cy + 38], fill=ACCENT)
        d.line([(M + 10, cy + 20), (M + 18, cy + 28), (M + 30, cy + 11)], fill=BG_TOP, width=4)
        for i, line in enumerate(wrap(d, feat, feat_font, SIZE - 2 * M - 60)):
            d.text((M + 60, y + i * 42), line, font=feat_font, fill=WHITE if i == 0 else MUTED)
        y += 42 * max(1, len(wrap(d, feat, feat_font, SIZE - 2 * M - 60))) + 26

    # --- bottom price band ---
    band_h = 110
    by = SIZE - band_h - M + 20
    rounded(d, [M, by, SIZE - M, by + band_h], 24, fill=CARD)
    d.text((M + 34, by + 22), "Free plan — no card needed", font=font(F_SEMI, 32), fill=WHITE)
    d.text((M + 34, by + 60), "Paid plans from ₹1,499 / month", font=font(F_REG, 28), fill=MUTED)
    # CTA pill
    cta = "Try now"
    cw = d.textlength(cta, font=font(F_SEMI, 30)) + 56
    rounded(d, [SIZE - M - cw - 34, by + 30, SIZE - M - 34, by + band_h - 30], 26, fill=ACCENT)
    d.text((SIZE - M - cw - 34 + 28, by + 36), cta, font=font(F_SEMI, 30), fill=BG_TOP)

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, product["file"])
    img.save(path, "PNG", quality=95)
    return path


def main():
    for p in PRODUCTS:
        print("wrote", make(p))


if __name__ == "__main__":
    main()
