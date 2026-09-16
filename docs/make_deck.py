from pathlib import Path
"""Generate the AI Investment Advisor presentation deck.

Run with the project venv:
    /home/sarthak/finance-goenka/.venv/bin/python docs/make_deck.py
"""

import os
import subprocess

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.util import Emu, Inches, Pt

# ---------------------------------------------------------------- palette ---
BG = RGBColor(0x0A, 0x0D, 0x14)
CARD = RGBColor(0x10, 0x15, 0x1F)
EDGE = RGBColor(0x1E, 0x26, 0x34)
TEXT = RGBColor(0xE6, 0xE9, 0xEF)
MUTED = RGBColor(0x8A, 0x93, 0xA6)
ACCENT = RGBColor(0xF2, 0xB7, 0x3F)
GREEN = RGBColor(0x3D, 0xDC, 0x97)
RED = RGBColor(0xFF, 0x6B, 0x6B)

DOCS = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DOCS, "AI-Investment-Advisor.pptx")

SLIDE_W = 13.333
SLIDE_H = 7.5
M = 0.75           # side margin
CW = SLIDE_W - 2 * M   # content width


def pick_font():
    """Inter if the machine has it, otherwise Calibri."""
    try:
        families = subprocess.run(
            ["fc-list", ":", "family"], capture_output=True, text=True, timeout=10
        ).stdout.lower()
        if "inter" in [f.strip() for line in families.splitlines() for f in line.split(",")]:
            return "Inter"
    except Exception:
        pass
    return "Calibri"


FONT = pick_font()


# ---------------------------------------------------------------- helpers ---
def new_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = BG
    return slide


def textbox(slide, x, y, w, h, lines, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    """lines: list of dicts -> text, size, color, bold, space_after, line_spacing."""
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    for i, spec in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(spec.get("space_after", 6))
        p.line_spacing = spec.get("line_spacing", 1.12)
        run = p.add_run()
        run.text = spec["text"]
        f = run.font
        f.name = FONT
        f.size = Pt(spec.get("size", 16))
        f.bold = spec.get("bold", False)
        f.color.rgb = spec.get("color", TEXT)
    return box


def card(slide, x, y, w, h, fill=CARD, line=EDGE, radius=0.07):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    shape.adjustments[0] = radius
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1)
    shape.shadow.inherit = False
    shape.text_frame.text = ""
    return shape


def bar(slide, x, y, w, h, color=ACCENT):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def pill(slide, x, y, w, h, label, color):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    shape.adjustments[0] = 0.5
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD
    shape.line.color.rgb = color
    shape.line.width = Pt(1)
    shape.shadow.inherit = False
    tf = shape.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    run.font.name = FONT
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = color
    return shape


def arrow(slide, x, y, w, h):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.RIGHT_ARROW, Inches(x), Inches(y), Inches(w), Inches(h)
    )
    shape.adjustments[0] = 0.4
    shape.adjustments[1] = 0.55
    shape.fill.solid()
    shape.fill.fore_color.rgb = ACCENT
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def slide_title(slide, title, kicker=None):
    bar(slide, M, 0.62, 0.62, 0.055)
    y = 0.85
    if kicker:
        textbox(slide, M, y, CW, 0.3,
                [{"text": kicker, "size": 12, "color": MUTED, "bold": True}])
        y += 0.36
    textbox(slide, M, y, CW, 0.7,
            [{"text": title, "size": 34, "color": ACCENT, "bold": True,
              "space_after": 0}])


def page_number(slide, n):
    textbox(slide, SLIDE_W - M - 1.0, SLIDE_H - 0.62, 1.0, 0.3,
            [{"text": str(n), "size": 10, "color": MUTED, "space_after": 0}],
            align=PP_ALIGN.RIGHT)


def card_text(slide, x, y, w, heading, body, heading_size=17, body_size=13,
              heading_color=ACCENT, body_color=MUTED, pad=0.32):
    lines = [{"text": heading, "size": heading_size, "color": heading_color,
              "bold": True, "space_after": 8}]
    for b in body:
        lines.append({"text": b, "size": body_size, "color": body_color,
                      "space_after": 6, "line_spacing": 1.2})
    textbox(slide, x + pad, y + pad, w - 2 * pad, 2.0, lines)


# ----------------------------------------------------------------- slides ---
def slide_title_page(prs):
    s = new_slide(prs)
    bar(s, M, 1.85, 0.9, 0.06)
    textbox(s, M, 2.25, 11.0, 1.2,
            [{"text": "AI Investment Advisor", "size": 54, "color": ACCENT,
              "bold": True, "space_after": 0}])
    textbox(s, M, 3.45, 9.6, 0.8,
            [{"text": "Tell it how much money you have. "
                      "It tells you where to put it.",
              "size": 22, "color": TEXT, "space_after": 0, "line_spacing": 1.25}])
    bar(s, M, 4.75, 2.6, 0.012, EDGE)
    textbox(s, M, 5.05, 6.0, 0.9,
            [{"text": "Atharva", "size": 18, "color": TEXT, "bold": True,
              "space_after": 5},
             {"text": "Project Based Learning, 2026", "size": 14,
              "color": MUTED, "space_after": 0}])
    textbox(s, SLIDE_W - M - 4.0, 5.05, 4.0, 0.9,
            [{"text": "atharva.funl.bio", "size": 14, "color": MUTED,
              "space_after": 0}], align=PP_ALIGN.RIGHT)


def slide_problem(prs):
    s = new_slide(prs)
    slide_title(s, "The problem")
    points = [
        "Most people leave their savings in a bank account, where inflation "
        "eats the value year after year.",
        "Advice from banks and apps is generic, or it points you at the "
        "products they earn from.",
        "A normal person cannot read the market every day and act on it.",
    ]
    y = 2.45
    h = 1.28
    for i, p in enumerate(points):
        card(s, M, y, CW, h)
        bar(s, M, y + 0.22, 0.05, h - 0.44)
        textbox(s, M + 0.42, y + 0.2, CW - 0.9, h - 0.4,
                [{"text": p, "size": 16, "color": TEXT, "space_after": 0,
                  "line_spacing": 1.22}], anchor=MSO_ANCHOR.MIDDLE)
        y += h + 0.32
    page_number(s, 2)


def slide_what_we_built(prs):
    s = new_slide(prs)
    slide_title(s, "What we built")
    textbox(s, M, 1.72, 10.6, 0.5,
            [{"text": "A web app that takes three answers from you and returns "
                      "a plan for your money, backed by live market data.",
              "size": 17, "color": TEXT, "space_after": 0, "line_spacing": 1.2}])

    boxes = [
        ("Risk score", "A number from 0 to 100 that says how much risk "
                       "suits you."),
        ("Where to invest", "Your money split across five options, in rupees "
                            "and in percent."),
        ("Live market and news", "Five stock picks with today's price, and "
                                 "today's headlines."),
        ("Growth projection", "What the amount could become over the period "
                              "you chose."),
    ]
    w = 2.80
    gap = 0.31
    y = 3.05
    h = 2.35
    for i, (head, body) in enumerate(boxes):
        x = M + i * (w + gap)
        card(s, x, y, w, h)
        bar(s, x + 0.3, y + 0.40, 0.34, 0.045)
        textbox(s, x + 0.3, y + 0.70, w - 0.6, h - 1.0,
                [{"text": head, "size": 17, "color": ACCENT, "bold": True,
                  "space_after": 9},
                 {"text": body, "size": 13, "color": MUTED, "space_after": 0,
                  "line_spacing": 1.22}])
    page_number(s, 3)


def slide_how_it_works(prs):
    s = new_slide(prs)
    slide_title(s, "How it works")

    steps = [
        "You enter amount, time, and comfort with risk.",
        "The model scores your risk.",
        "Money is split across five options based on that score.",
        "Live prices and news are pulled in.",
        "Growth is projected with a best and worst case.",
    ]
    w = 2.14
    gap = 0.35
    y = 3.00
    h = 2.40
    for i, text in enumerate(steps):
        x = M + i * (w + gap)
        card(s, x, y, w, h)
        num = card(s, x + 0.26, y + 0.26, 0.36, 0.36, fill=ACCENT, line=None,
                   radius=0.5)
        tf = num.text_frame
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = str(i + 1)
        r.font.name = FONT
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = BG

        textbox(s, x + 0.26, y + 0.92, w - 0.52, h - 1.2,
                [{"text": text, "size": 13, "color": TEXT, "space_after": 0,
                  "line_spacing": 1.25}])
        if i < len(steps) - 1:
            arrow(s, x + w + 0.055, y + h / 2 - 0.11, gap - 0.11, 0.22)
    page_number(s, 4)


def slide_ai_part(prs):
    s = new_slide(prs)
    slide_title(s, "The AI part")

    w = 5.86
    y = 2.25
    h = 3.35
    # left card
    card(s, M, y, w, h)
    bar(s, M + 0.34, y + 0.38, 0.34, 0.045)
    textbox(s, M + 0.34, y + 0.66, w - 0.68, h - 1.0,
            [{"text": "Risk model", "size": 21, "color": ACCENT, "bold": True,
              "space_after": 12},
             {"text": "A logistic regression model, one of the simplest there "
                      "is.", "size": 14, "color": TEXT, "space_after": 9,
              "line_spacing": 1.2},
             {"text": "Trained on 2,000 investor profiles: amount, time "
                      "horizon, and stated risk preference.", "size": 14,
              "color": TEXT, "space_after": 9, "line_spacing": 1.2},
             {"text": "It returns one number, a risk score from 0 to 100.",
              "size": 14, "color": TEXT, "space_after": 0, "line_spacing": 1.2}])

    # right card
    x2 = M + w + 0.41
    card(s, x2, y, w, h)
    bar(s, x2 + 0.34, y + 0.38, 0.34, 0.045)
    textbox(s, x2 + 0.34, y + 0.66, w - 0.68, 1.6,
            [{"text": "News reading", "size": 21, "color": ACCENT, "bold": True,
              "space_after": 12},
             {"text": "Every headline we pull is scored as positive, neutral "
                      "or negative.", "size": 14, "color": TEXT,
              "space_after": 9, "line_spacing": 1.2},
             {"text": "Those scores are combined into one market mood for the "
                      "day.", "size": 14, "color": TEXT, "space_after": 0,
              "line_spacing": 1.2}])
    py = y + 2.52
    pill(s, x2 + 0.34, py, 1.30, 0.34, "Positive", GREEN)
    pill(s, x2 + 1.78, py, 1.22, 0.34, "Neutral", MUTED)
    pill(s, x2 + 3.14, py, 1.36, 0.34, "Negative", RED)

    textbox(s, M, y + h + 0.42, CW, 0.4,
            [{"text": "Both models are small and easy to explain. Neither one "
                      "predicts prices, and neither is a guarantee.",
              "size": 13, "color": MUTED, "space_after": 0}])
    page_number(s, 5)


def slide_demo(prs):
    s = new_slide(prs)
    slide_title(s, "Live demo")

    textbox(s, M, 2.45, 5.2, 0.9,
            [{"text": "atharva.funl.bio", "size": 40, "color": ACCENT,
              "bold": True, "space_after": 0}])
    bar(s, M, 3.42, 1.6, 0.045)
    textbox(s, M, 3.80, 4.9, 1.2,
            [{"text": "Example: 5 lakh, 5 years, moderate risk.", "size": 18,
              "color": TEXT, "space_after": 10, "line_spacing": 1.2},
             {"text": "The app is live now. Built with React and FastAPI, "
                      "code on GitHub.", "size": 13, "color": MUTED,
              "space_after": 0, "line_spacing": 1.2}])

    shot = Path(__file__).with_name("screenshot-demo.png")
    if shot.exists():
        s.shapes.add_picture(str(shot), Inches(6.35), Inches(2.25), width=Inches(6.25))
    else:
        ph = card(s, 6.35, 2.25, 6.25, 4.15, fill=CARD, line=MUTED)
        ph.line.width = Pt(1)
        textbox(s, 6.35, 4.15, 6.25, 0.4,
                [{"text": "App screenshot", "size": 15, "color": MUTED,
                  "space_after": 0}], align=PP_ALIGN.CENTER)
    page_number(s, 6)


def slide_data_sources(prs):
    s = new_slide(prs)
    slide_title(s, "Data sources")

    rows = [
        ("Prices and news",
         "Yahoo Finance, live. NSE tickers for Reliance, TCS and HDFC Bank, "
         "plus a Gold ETF and Bitcoin priced in rupees."),
        ("Expected returns",
         "Published long-run averages for each of the five asset classes."),
        ("Risk model training data",
         "2,000 investor profiles generated from investor profile rules."),
    ]
    y = 2.35
    h = 1.28
    for head, body in rows:
        card(s, M, y, CW, h)
        bar(s, M, y + 0.25, 0.05, h - 0.5)
        textbox(s, M + 0.42, y + 0.26, CW - 0.9, h - 0.5,
                [{"text": head, "size": 16, "color": ACCENT, "bold": True,
                  "space_after": 7},
                 {"text": body, "size": 14, "color": TEXT, "space_after": 0,
                  "line_spacing": 1.2}])
        y += h + 0.27
    page_number(s, 7)


def slide_what_next(prs):
    s = new_slide(prs)
    slide_title(s, "What next")

    items = [
        ("SIP mode", "Invest a fixed amount every month instead of once."),
        ("Broker connection",
         "Link a broker account so the app can place the order for you."),
        ("Hindi and regional languages",
         "The same advice in the language the user thinks in."),
        ("Alerts", "A message when the news turns negative on something you "
                   "hold."),
    ]
    w = 5.86
    h = 1.40
    y0 = 2.45
    for i, (head, body) in enumerate(items):
        x = M + (i % 2) * (w + 0.41)
        y = y0 + (i // 2) * (h + 0.34)
        card(s, x, y, w, h)
        bar(s, x + 0.32, y + 0.28, 0.30, 0.045)
        textbox(s, x + 0.32, y + 0.52, w - 0.64, h - 0.75,
                [{"text": head, "size": 15, "color": ACCENT, "bold": True,
                  "space_after": 6},
                 {"text": body, "size": 13, "color": MUTED, "space_after": 0,
                  "line_spacing": 1.2}])

    textbox(s, M, 6.10, CW, 0.6,
            [{"text": "Thank you.", "size": 28, "color": TEXT, "bold": True,
              "space_after": 0}])
    page_number(s, 8)


def build():
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)

    slide_title_page(prs)
    slide_problem(prs)
    slide_what_we_built(prs)
    slide_how_it_works(prs)
    slide_ai_part(prs)
    slide_demo(prs)
    slide_data_sources(prs)
    slide_what_next(prs)

    prs.save(OUT)
    print(f"font: {FONT}")
    print(f"slides: {len(prs.slides)}")
    print(f"written: {OUT}")


if __name__ == "__main__":
    build()
