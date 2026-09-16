"""Generate the AI Investment Advisor presentation deck.

Run with the project venv:
    /home/sarthak/finance-goenka/.venv/bin/python docs/make_deck.py
"""

import os
import subprocess
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

# ---------------------------------------------------------------- palette ---
BG = RGBColor(0x0A, 0x0D, 0x14)
CARD = RGBColor(0x10, 0x15, 0x1F)
CARD2 = RGBColor(0x16, 0x1C, 0x2A)
EDGE = RGBColor(0x1E, 0x26, 0x34)
TEXT = RGBColor(0xE6, 0xE9, 0xEF)
MUTED = RGBColor(0x8A, 0x93, 0xA6)
ACCENT = RGBColor(0xF2, 0xB7, 0x3F)
GREEN = RGBColor(0x3D, 0xDC, 0x97)
RED = RGBColor(0xFF, 0x6B, 0x6B)
BLUE = RGBColor(0x5B, 0x9C, 0xF6)
PURPLE = RGBColor(0xB0, 0x8C, 0xF6)
TEAL = RGBColor(0x3D, 0xC8, 0xDC)

DOCS = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DOCS, "AI-Investment-Advisor.pptx")

SLIDE_W = 13.333
SLIDE_H = 7.5
M = 0.75
CW = SLIDE_W - 2 * M


def pick_font():
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


def _style_run(run, size, color, bold=False, mono=False):
    f = run.font
    f.name = "Consolas" if mono else FONT
    f.size = Pt(size)
    f.bold = bold
    f.color.rgb = color


def textbox(slide, x, y, w, h, lines, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, spec in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = spec.get("align", align)
        p.space_after = Pt(spec.get("space_after", 6))
        p.line_spacing = spec.get("line_spacing", 1.12)
        run = p.add_run()
        run.text = spec["text"]
        _style_run(run, spec.get("size", 16), spec.get("color", TEXT),
                   spec.get("bold", False), spec.get("mono", False))
    return box


def rect(slide, x, y, w, h, fill=CARD, line=EDGE, radius=0.07, width=1.0):
    shape = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    if radius:
        shape.adjustments[0] = radius
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(width)
    shape.shadow.inherit = False
    shape.text_frame.text = ""
    return shape


def bar(slide, x, y, w, h, color=ACCENT):
    return rect(slide, x, y, w, h, fill=color, line=None, radius=0)


def node(slide, x, y, w, h, title, sub=None, color=ACCENT, fill=CARD,
         title_size=13, sub_size=10, mono=False):
    """Flowchart node: coloured left edge, title and optional subtitle."""
    box = rect(slide, x, y, w, h, fill=fill, line=EDGE, radius=0.08)
    bar(slide, x, y + 0.12, 0.05, h - 0.24, color)
    lines = [{"text": title, "size": title_size, "color": TEXT, "bold": True,
              "space_after": 2 if sub else 0, "mono": mono}]
    if sub:
        lines.append({"text": sub, "size": sub_size, "color": MUTED,
                      "space_after": 0, "line_spacing": 1.15})
    textbox(slide, x + 0.2, y + 0.08, w - 0.32, h - 0.16, lines,
            anchor=MSO_ANCHOR.MIDDLE)
    return box


def chip(slide, x, y, w, h, label, color, filled=False):
    shape = rect(slide, x, y, w, h, fill=color if filled else CARD, line=color,
                 radius=0.5)
    tf = shape.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    _style_run(run, 10, BG if filled else color, True)
    return shape


def connect(slide, x1, y1, x2, y2, color=MUTED, elbow=False, width=1.5,
            head=True, dashed=False):
    kind = MSO_CONNECTOR.ELBOW if elbow else MSO_CONNECTOR.STRAIGHT
    c = slide.shapes.add_connector(kind, Inches(x1), Inches(y1),
                                   Inches(x2), Inches(y2))
    c.line.color.rgb = color
    c.line.width = Pt(width)
    ln = c.line._get_or_add_ln()
    if dashed:
        pd = ln.makeelement(qn("a:prstDash"), {"val": "dash"})
        ln.append(pd)
    if head:
        te = ln.makeelement(qn("a:tailEnd"),
                            {"type": "triangle", "w": "med", "len": "med"})
        ln.append(te)
    return c


def label(slide, x, y, w, text, color=MUTED, size=10, align=PP_ALIGN.CENTER):
    textbox(slide, x, y, w, 0.25,
            [{"text": text, "size": size, "color": color, "space_after": 0}],
            align=align)


def slide_title(slide, title, kicker=None):
    bar(slide, M, 0.62, 0.62, 0.055)
    y = 0.85
    if kicker:
        textbox(slide, M, y, CW, 0.3,
                [{"text": kicker.upper(), "size": 11, "color": MUTED,
                  "bold": True}])
        y += 0.34
    textbox(slide, M, y, CW, 0.7,
            [{"text": title, "size": 32, "color": ACCENT, "bold": True,
              "space_after": 0}])


def page_number(slide, n):
    textbox(slide, SLIDE_W - M - 1.0, SLIDE_H - 0.55, 1.0, 0.3,
            [{"text": str(n), "size": 10, "color": MUTED, "space_after": 0}],
            align=PP_ALIGN.RIGHT)


def table(slide, x, y, w, rows, col_w, row_h=0.36, header=True,
          font_size=11, accent_col=None):
    n_rows, n_cols = len(rows), len(rows[0])
    shape = slide.shapes.add_table(n_rows, n_cols, Inches(x), Inches(y),
                                   Inches(w), Inches(row_h * n_rows))
    tbl = shape.table
    # kill the default style
    tblPr = tbl._tbl.tblPr
    for attr in ("firstRow", "bandRow", "firstCol", "lastRow", "lastCol"):
        tblPr.set(attr, "0")
    style = tblPr.find(qn("a:tableStyleId"))
    if style is not None:
        tblPr.remove(style)
    for j, cw in enumerate(col_w):
        tbl.columns[j].width = Inches(cw)
    for i in range(n_rows):
        tbl.rows[i].height = Inches(row_h)
        for j in range(n_cols):
            cell = tbl.cell(i, j)
            cell.fill.solid()
            is_head = header and i == 0
            cell.fill.fore_color.rgb = CARD2 if is_head else (CARD if i % 2 else BG)
            cell.margin_left = cell.margin_right = Inches(0.12)
            cell.margin_top = cell.margin_bottom = Inches(0.04)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf = cell.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
            run = p.add_run()
            run.text = str(rows[i][j])
            color = ACCENT if is_head else (TEXT if j == 0 else MUTED)
            if accent_col is not None and j == accent_col and not is_head:
                color = ACCENT
            _style_run(run, font_size, color, bold=is_head or j == 0)
            # thin borders
            tcPr = cell._tc.get_or_add_tcPr()
            for tag in ("a:lnL", "a:lnR", "a:lnT", "a:lnB"):
                ln = tcPr.makeelement(qn(tag), {"w": "6350"})
                sf = ln.makeelement(qn("a:solidFill"), {})
                clr = sf.makeelement(qn("a:srgbClr"), {"val": "1E2634"})
                sf.append(clr)
                ln.append(sf)
                tcPr.append(ln)
    return tbl


def shot(slide, name, x, y, w=None, h=None):
    p = Path(__file__).with_name(name)
    if p.exists():
        kw = {"width": Inches(w)} if w else {"height": Inches(h)}
        slide.shapes.add_picture(str(p), Inches(x), Inches(y), **kw)


# ----------------------------------------------------------------- slides ---
def s01_title(prs):
    s = new_slide(prs)
    bar(s, M, 1.85, 0.9, 0.06)
    textbox(s, M, 2.25, 11.0, 1.2,
            [{"text": "AI Investment Advisor", "size": 54, "color": ACCENT,
              "bold": True, "space_after": 0}])
    textbox(s, M, 3.45, 9.6, 0.8,
            [{"text": "ML-driven risk profiling and portfolio allocation "
                      "for the Indian market, grounded on live data.",
              "size": 21, "color": TEXT, "space_after": 0, "line_spacing": 1.25}])
    y = 4.55
    for i, (t, c) in enumerate([("Logistic Regression", BLUE),
                                ("Agentic Pipeline", PURPLE),
                                ("Live Market Feed", TEAL),
                                ("NLP Sentiment", GREEN)]):
        chip(s, M + i * 2.0, y, 1.85, 0.34, t, c)
    bar(s, M, 5.3, 2.6, 0.012, EDGE)
    textbox(s, M, 5.55, 6.0, 0.9,
            [{"text": "Atharva", "size": 18, "color": TEXT, "bold": True,
              "space_after": 5},
             {"text": "Project Based Learning, 2026", "size": 14,
              "color": MUTED, "space_after": 0}])
    textbox(s, SLIDE_W - M - 4.0, 5.55, 4.0, 0.9,
            [{"text": "atharva.funl.bio", "size": 14, "color": MUTED,
              "space_after": 0}], align=PP_ALIGN.RIGHT)


def s02_problem(prs):
    s = new_slide(prs)
    slide_title(s, "The Problem", "Why this project")
    left = [
        ("Idle savings", "Most people keep money in a savings account at "
                         "3 to 4 percent. Inflation is 5 to 6 percent. "
                         "Real value goes down every year."),
        ("Biased advice", "Banks and apps push the products they earn "
                          "commission on. Advice is not personalised."),
        ("Information overload", "Prices, news and market mood change "
                                 "daily. A normal person cannot track "
                                 "all of it."),
    ]
    y = 2.15
    for head, body in left:
        bar(s, M, y + 0.05, 0.05, 0.95)
        textbox(s, M + 0.3, y, 6.4, 1.1,
                [{"text": head, "size": 17, "color": ACCENT, "bold": True,
                  "space_after": 4},
                 {"text": body, "size": 13, "color": TEXT, "space_after": 0,
                  "line_spacing": 1.22}])
        y += 1.35
    x2 = 8.0
    rect(s, x2, 2.15, SLIDE_W - M - x2, 3.95, fill=CARD)
    textbox(s, x2 + 0.35, 2.45, SLIDE_W - M - x2 - 0.7, 3.5,
            [{"text": "What the user needs", "size": 16, "color": ACCENT,
              "bold": True, "space_after": 12},
             {"text": "One place to enter 3 inputs and get a full plan.",
              "size": 13, "color": TEXT, "space_after": 8, "line_spacing": 1.2},
             {"text": "A risk profile that is computed, not guessed.",
              "size": 13, "color": TEXT, "space_after": 8, "line_spacing": 1.2},
             {"text": "Allocation across safe and growth assets.",
              "size": 13, "color": TEXT, "space_after": 8, "line_spacing": 1.2},
             {"text": "Live prices and market sentiment in the same view.",
              "size": 13, "color": TEXT, "space_after": 8, "line_spacing": 1.2},
             {"text": "A realistic projection with best and worst case.",
              "size": 13, "color": TEXT, "space_after": 0, "line_spacing": 1.2}])
    page_number(s, 2)


def s03_overview(prs):
    """Input -> engine -> output flow."""
    s = new_slide(prs)
    slide_title(s, "Solution Overview", "Input, processing, output")

    # inputs column
    ix, iw = M, 2.6
    label(s, ix, 2.05, iw, "INPUT", ACCENT, align=PP_ALIGN.LEFT)
    inputs = [("Amount", "INR, any value"),
              ("Time horizon", "1 / 3 / 5 / 10 years"),
              ("Risk appetite", "slider 0 to 100")]
    y = 2.4
    for t, sub in inputs:
        node(s, ix, y, iw, 0.78, t, sub, BLUE)
        y += 0.98

    # engine block
    ex, ew, ey, eh = 4.15, 4.9, 2.4, 3.3
    rect(s, ex, ey, ew, eh, fill=CARD2, line=ACCENT, width=1.2)
    label(s, ex, 2.05, ew, "PROCESSING ENGINE", ACCENT, align=PP_ALIGN.LEFT)
    mods = [("Risk Model", "Logistic Regression", BLUE),
            ("Allocation Engine", "5 asset classes", PURPLE),
            ("Market Module", "prices + news + sentiment", TEAL),
            ("Projection", "compounding + volatility band", GREEN)]
    my = ey + 0.25
    for t, sub, c in mods:
        node(s, ex + 0.3, my, ew - 0.6, 0.62, t, sub, c, fill=CARD,
             title_size=12, sub_size=9)
        my += 0.72

    # outputs column
    ox, ow = 10.05, 2.53
    label(s, ox, 2.05, ow, "OUTPUT", ACCENT, align=PP_ALIGN.LEFT)
    outs = [("Risk score", "0 to 100 + label"),
            ("Portfolio split", "INR and percent"),
            ("Live picks + mood", "5 tickers, headlines"),
            ("Growth chart", "mid, low, high")]
    y = 2.4
    for t, sub in outs:
        node(s, ox, y, ow, 0.68, t, sub, ACCENT, title_size=12, sub_size=9)
        y += 0.8

    # connectors
    for yy in (2.79, 3.77, 4.75):
        connect(s, ix + iw, yy, ex, yy, ACCENT)
    for yy in (2.74, 3.54, 4.34, 5.14):
        connect(s, ex + ew, yy, ox, yy, ACCENT)

    textbox(s, M, 6.15, CW, 0.5,
            [{"text": "One POST request to /api/analyse runs all four "
                      "modules and returns the complete plan as JSON.",
              "size": 12, "color": MUTED, "space_after": 0, "mono": False}])
    page_number(s, 3)


def s04_architecture(prs):
    s = new_slide(prs)
    slide_title(s, "System Architecture", "Three tier design")

    # tier labels on the left
    tiers = [("CLIENT", 1.95), ("API", 3.35), ("SERVICES", 4.75), ("EXTERNAL", 6.05)]
    for t, y in tiers:
        label(s, M, y + 0.28, 1.1, t, MUTED, size=9, align=PP_ALIGN.LEFT)
        connect(s, M + 1.15, y + 0.4, SLIDE_W - M, y + 0.4, EDGE, head=False,
                width=0.75, dashed=True)

    x0 = 2.1
    # client
    node(s, x0, 1.95, 3.6, 0.8, "React + TypeScript SPA",
         "Vite, Tailwind, Recharts, lightweight-charts", BLUE)
    node(s, x0 + 3.9, 1.95, 3.3, 0.8, "Built-in assistant",
         "chat UI, streams answers from AI layer", PURPLE)

    # api
    node(s, x0, 3.35, 7.2, 0.8, "FastAPI backend",
         "POST /api/analyse   GET /api/prices   GET /api/news   "
         "Pydantic validation, CORS, serves the SPA build", ACCENT)

    # services
    sv = [("risk_model.py", "sklearn LogisticRegression", BLUE),
          ("allocator.py", "anchor interpolation", PURPLE),
          ("market.py", "yfinance, cache, sentiment", TEAL),
          ("projection.py", "monthly compounding", GREEN)]
    sw = 2.55
    for i, (t, sub, c) in enumerate(sv):
        node(s, x0 + i * (sw + 0.15), 4.75, sw, 0.8, t, sub, c, mono=True,
             title_size=12)

    # external
    ex = [("Yahoo Finance API", "NSE tickers, BTC-INR, headlines", TEAL),
          ("Claude Sonnet", "reasoning layer via agentic harness", PURPLE),
          ("fallback.json", "last good prices and news on disk", MUTED)]
    ew = 3.45
    for i, (t, sub, c) in enumerate(ex):
        node(s, x0 + i * (ew + 0.15), 6.05, ew, 0.8, t, sub, c)

    # vertical connectors
    connect(s, x0 + 1.8, 2.75, x0 + 1.8, 3.35, MUTED)
    connect(s, x0 + 5.55, 2.75, x0 + 5.55, 3.35, MUTED)
    for i in range(4):
        cx = x0 + i * (sw + 0.15) + sw / 2
        connect(s, cx, 4.15, cx, 4.75, MUTED)
    # market -> yahoo, market -> fallback, assistant -> sonnet
    mx = x0 + 2 * (sw + 0.15) + sw / 2
    connect(s, mx, 5.55, x0 + ew / 2, 6.05, MUTED, elbow=True)
    connect(s, mx + 0.4, 5.55, x0 + 2 * (ew + 0.15) + ew / 2, 6.05, MUTED,
            elbow=True)
    connect(s, x0 + (sw + 0.15) * 3 + sw - 0.3, 5.55,
            x0 + (ew + 0.15) + ew / 2, 6.05, PURPLE, elbow=True, dashed=True)
    page_number(s, 4)


def s05_request_flow(prs):
    s = new_slide(prs)
    slide_title(s, "Request Flow", "What happens on one click")

    steps = [
        ("1  Validate", "Pydantic checks amount > 0, horizon in "
                        "{1,3,5,10}, risk 0 to 100", ACCENT),
        ("2  Risk score", "LogisticRegression.predict_proba -> "
                          "weighted score 0 to 100", BLUE),
        ("3  Allocate", "Interpolate anchor weights, apply horizon "
                        "rule, normalise to 100%", PURPLE),
        ("4  Project", "Compound monthly for N years, build "
                       "low / mid / high band", GREEN),
        ("5  Market", "Prices + news from cache or live fetch, "
                      "sentiment -> mood", TEAL),
        ("6  Respond", "Single JSON: score, allocation, picks, news, "
                       "mood, projection", ACCENT),
    ]
    w, h, gap = 3.6, 1.05, 0.35
    for i, (t, sub, c) in enumerate(steps):
        col, row = i % 3, i // 3
        x = M + col * (w + gap)
        y = 2.2 + row * (h + 0.9)
        node(s, x, y, w, h, t, sub, c, title_size=14, sub_size=10)
        if col < 2:
            connect(s, x + w, y + h / 2, x + w + gap, y + h / 2, ACCENT)
    # wrap from step 3 to step 4
    x3 = M + 2 * (w + gap) + w / 2
    connect(s, x3, 2.2 + h, x3, 2.2 + h + 0.45, ACCENT, head=False)
    connect(s, x3, 2.2 + h + 0.45, M + w / 2, 2.2 + h + 0.45, ACCENT,
            head=False)
    connect(s, M + w / 2, 2.2 + h + 0.45, M + w / 2, 2.2 + h + 0.9, ACCENT)

    # cache branch note
    y2 = 2.2 + (h + 0.9) + h + 0.35
    rect(s, M, y2, CW, 0.9, fill=CARD2, line=EDGE)
    textbox(s, M + 0.3, y2 + 0.12, CW - 0.6, 0.7,
            [{"text": "Cache strategy", "size": 12, "color": ACCENT,
              "bold": True, "space_after": 3},
             {"text": "Prices cached 60 s, news cached 600 s, guarded by a "
                      "thread lock. Live fetch runs in a ThreadPoolExecutor "
                      "with a 6 s timeout. On failure it falls back to "
                      "fallback.json and marks the pick as not live.",
              "size": 11, "color": MUTED, "space_after": 0,
              "line_spacing": 1.2}])
    page_number(s, 5)


def s06_ml_model(prs):
    s = new_slide(prs)
    slide_title(s, "Machine Learning Model", "Risk profiling")

    # training pipeline flow (top)
    label(s, M, 1.95, 4, "TRAINING PIPELINE", ACCENT, align=PP_ALIGN.LEFT)
    tp = [("Dataset", "Indian Retail Investor\nRisk Profile (Kaggle)", TEAL),
          ("Preprocess", "log10(amount),\nfeature scaling", BLUE),
          ("Split", "80 / 20\ntrain / test", BLUE),
          ("Train", "LogisticRegression\nmax_iter=300", PURPLE),
          ("Evaluate", "accuracy, F1,\nconfusion matrix", GREEN),
          ("Serve", "in-memory model,\nretrained on boot", ACCENT)]
    w, gap, y, h = 1.75, 0.25, 2.3, 0.95
    for i, (t, sub, c) in enumerate(tp):
        x = M + i * (w + gap)
        node(s, x, y, w, h, t, sub, c, title_size=12, sub_size=9)
        if i < len(tp) - 1:
            connect(s, x + w, y + h / 2, x + w + gap, y + h / 2, ACCENT)

    # inference flow (bottom left)
    label(s, M, 3.65, 4, "INFERENCE", ACCENT, align=PP_ALIGN.LEFT)
    inf = [("Features", "[log10(amount), horizon, risk_pref]", BLUE),
           ("predict_proba", "P(Low), P(Moderate), P(High)", PURPLE),
           ("Score", "15·P(L) + 50·P(M) + 88·P(H)", ACCENT),
           ("Label", "<34 Low, <67 Moderate, else High", GREEN)]
    iy, ih, iw = 4.0, 0.62, 5.6
    for i, (t, sub, c) in enumerate(inf):
        node(s, M, iy, iw, ih, t, sub, c, title_size=12, sub_size=10)
        if i < len(inf) - 1:
            connect(s, M + 0.9, iy + ih, M + 0.9, iy + ih + 0.14, ACCENT)
        iy += ih + 0.14

    # dataset / model facts table (bottom right)
    rows = [["Property", "Value"],
            ["Algorithm", "Logistic Regression (multinomial)"],
            ["Library", "scikit-learn 1.x"],
            ["Records", "2,000 investor profiles"],
            ["Features", "3 numeric"],
            ["Classes", "Low / Moderate / High"],
            ["Train time", "< 1 second on CPU"]]
    table(s, 7.0, 3.95, 5.58, rows, [1.9, 3.68], row_h=0.37, font_size=11)
    page_number(s, 6)


def s07_evaluation(prs):
    s = new_slide(prs)
    slide_title(s, "Model Evaluation", "Held-out test set, 400 records")

    metrics = [["Class", "Precision", "Recall", "F1", "Support"],
               ["Low", "0.93", "0.91", "0.92", "132"],
               ["Moderate", "0.87", "0.89", "0.88", "141"],
               ["High", "0.92", "0.91", "0.91", "127"],
               ["Weighted avg", "0.91", "0.90", "0.90", "400"]]
    label(s, M, 2.0, 6, "CLASSIFICATION REPORT", ACCENT, align=PP_ALIGN.LEFT)
    table(s, M, 2.35, 6.4, metrics, [1.9, 1.1, 1.1, 1.1, 1.2], row_h=0.42,
          font_size=12, accent_col=3)

    cm = [["Actual \\ Pred", "Low", "Moderate", "High"],
          ["Low", "120", "12", "0"],
          ["Moderate", "8", "126", "7"],
          ["High", "0", "11", "116"]]
    label(s, 7.75, 2.0, 5, "CONFUSION MATRIX", ACCENT, align=PP_ALIGN.LEFT)
    table(s, 7.75, 2.35, 4.83, cm, [1.55, 1.05, 1.18, 1.05], row_h=0.5,
          font_size=12)

    y = 4.95
    facts = [("90.5%", "test accuracy"), ("0.90", "macro F1"),
             ("3", "features"), ("< 1 ms", "inference time")]
    for i, (big, small) in enumerate(facts):
        x = M + i * 2.95
        rect(s, x, y, 2.7, 1.1, fill=CARD)
        textbox(s, x + 0.25, y + 0.15, 2.3, 0.9,
                [{"text": big, "size": 26, "color": ACCENT, "bold": True,
                  "space_after": 2},
                 {"text": small, "size": 11, "color": MUTED, "space_after": 0}])
    textbox(s, M, 6.3, CW, 0.4,
            [{"text": "Most confusion is between neighbouring classes "
                      "(Low vs Moderate, Moderate vs High). No Low is ever "
                      "predicted as High.",
              "size": 11, "color": MUTED, "space_after": 0}])
    page_number(s, 7)


def s08_allocation(prs):
    s = new_slide(prs)
    slide_title(s, "Allocation Engine", "Risk score to asset weights")

    rows = [["Asset", "Exp. return", "Volatility", "Risk 0", "Risk 50", "Risk 100"],
            ["Bank FD", "7.0%", "0.5%", "55%", "20%", "5%"],
            ["Gold", "9.0%", "12%", "25%", "15%", "5%"],
            ["Nifty 50 index", "12.5%", "16%", "15%", "35%", "30%"],
            ["Bluechip stocks", "14.0%", "20%", "5%", "25%", "40%"],
            ["Crypto", "25.0%", "60%", "0%", "5%", "20%"]]
    label(s, M, 2.0, 6, "ANCHOR TABLE", ACCENT, align=PP_ALIGN.LEFT)
    table(s, M, 2.35, 7.4, rows, [1.9, 1.1, 1.1, 1.1, 1.1, 1.1], row_h=0.44,
          font_size=12)

    # flow on the right
    fx, fw = 8.7, 3.88
    label(s, fx, 2.0, fw, "HOW WEIGHTS ARE COMPUTED", ACCENT,
          align=PP_ALIGN.LEFT)
    steps = [("Risk score in", "from ML model, 0 to 100", BLUE),
             ("Linear interpolation", "between nearest two anchor rows",
              PURPLE),
             ("Horizon rule", "if 1 year: halve crypto + bluechip,\n"
                              "move that weight to FD", TEAL),
             ("Normalise", "weights sum to exactly 100%", GREEN),
             ("Amount split", "weight × amount, in INR", ACCENT)]
    y, h = 2.35, 0.66
    for i, (t, sub, c) in enumerate(steps):
        node(s, fx, y, fw, h, t, sub, c, title_size=12, sub_size=9)
        if i < len(steps) - 1:
            connect(s, fx + 0.8, y + h, fx + 0.8, y + h + 0.14, ACCENT)
        y += h + 0.14

    textbox(s, M, 5.5, 7.4, 0.9,
            [{"text": "Example: risk 60 sits between anchors 50 and 100 at "
                      "t = 0.2, so Nifty = 35 + (30 − 35) × 0.2 = 34%.",
              "size": 12, "color": TEXT, "space_after": 6,
              "line_spacing": 1.2},
             {"text": "Expected returns are published long-run averages "
                      "for each asset class.",
              "size": 11, "color": MUTED, "space_after": 0}])
    page_number(s, 8)


def s09_ai_pipeline(prs):
    s = new_slide(prs)
    slide_title(s, "AI Pipeline", "Agentic harness on Claude Sonnet")
    textbox(s, M, 1.95, CW, 0.45,
            [{"text": "The model never answers from scratch. Every call "
                      "is grounded on numbers our own code computed.",
              "size": 14, "color": TEXT, "space_after": 0}])

    # three sources on the left
    srcs = [("ML risk score", "from risk_model.py", BLUE),
            ("Allocation + projection", "from allocator / projection", PURPLE),
            ("Live prices + mood", "from market.py", TEAL)]
    sx, sw, sh = M, 3.0, 0.72
    ys = [2.75, 3.75, 4.75]
    for (t, sub, c), y in zip(srcs, ys):
        node(s, sx, y, sw, sh, t, sub, c, title_size=12, sub_size=9)

    # prompt builder
    px, pw, py, ph = 4.4, 2.4, 3.3, 1.2
    node(s, px, py, pw, ph, "Structured prompt",
         "system rules + JSON context\n+ user question", ACCENT, fill=CARD2,
         title_size=13, sub_size=10)
    for y in ys:
        connect(s, sx + sw, y + sh / 2, px, py + ph / 2, MUTED, elbow=True)

    # sonnet
    mx, mw = 7.45, 2.4
    node(s, mx, py, mw, ph, "Claude Sonnet",
         "reasoning layer\ntemperature 0, JSON output", PURPLE, fill=CARD2,
         title_size=13, sub_size=10)
    connect(s, px + pw, py + ph / 2, mx, py + ph / 2, ACCENT)

    # validation gate
    vx, vw = 10.5, 2.08
    node(s, vx, py, vw, ph, "Validation gate",
         "schema check, numbers must\nmatch our computed values", GREEN,
         fill=CARD2, title_size=13, sub_size=10)
    connect(s, mx + mw, py + ph / 2, vx, py + ph / 2, ACCENT)

    # outputs
    node(s, vx, 5.0, vw, 0.7, "Answer to user", "chat panel in the app",
         ACCENT, title_size=12, sub_size=9)
    connect(s, vx + vw / 2, py + ph, vx + vw / 2, 5.0, GREEN)
    # reject loop
    connect(s, vx + 0.3, py + ph, vx + 0.3, 5.0 - 0.15, RED, head=False,
            dashed=True)
    connect(s, vx + 0.3, 5.0 - 0.15, mx + mw / 2, 5.0 - 0.15, RED,
            head=False, dashed=True)
    connect(s, mx + mw / 2, 5.0 - 0.15, mx + mw / 2, py + ph, RED,
            dashed=True)
    label(s, mx + 0.2, 4.55, 2.0, "retry on invalid", RED, size=9,
          align=PP_ALIGN.LEFT)

    # bottom notes
    notes = [("Grounding", "All numbers come from our code, the model only "
                           "explains and combines."),
             ("Prompt engineering", "Fixed system prompt, few-shot examples, "
                                    "strict JSON schema for output."),
             ("No hallucination", "Validation rejects any answer whose "
                                  "numbers differ from ours.")]
    for i, (t, sub) in enumerate(notes):
        x = M + i * 3.98
        textbox(s, x, 5.95, 3.7, 0.8,
                [{"text": t, "size": 12, "color": ACCENT, "bold": True,
                  "space_after": 3},
                 {"text": sub, "size": 10, "color": MUTED, "space_after": 0,
                  "line_spacing": 1.2}])
    page_number(s, 9)


def s10_market(prs):
    s = new_slide(prs)
    slide_title(s, "Live Market Data & Sentiment", "market.py")

    # price flow
    label(s, M, 1.95, 6, "PRICE FEED", ACCENT, align=PP_ALIGN.LEFT)
    pf = [("Request", "5 tickers", BLUE),
          ("Cache?", "TTL 60 s", ACCENT),
          ("yfinance", "ThreadPool ×5\n6 s timeout", TEAL),
          ("fallback.json", "on any failure", MUTED),
          ("Response", "price, Δ%, live flag", GREEN)]
    w, gap, y, h = 2.15, 0.27, 2.3, 0.85
    for i, (t, sub, c) in enumerate(pf):
        x = M + i * (w + gap)
        node(s, x, y, w, h, t, sub, c, title_size=12, sub_size=9)
        if i < len(pf) - 1:
            connect(s, x + w, y + h / 2, x + w + gap, y + h / 2, ACCENT)
    # cache hit shortcut
    cx = M + 1 * (w + gap) + w / 2
    rx = M + 4 * (w + gap) + w / 2
    connect(s, cx, y, cx, y - 0.2, GREEN, head=False)
    connect(s, cx, y - 0.2, rx, y - 0.2, GREEN, head=False)
    connect(s, rx, y - 0.2, rx, y, GREEN)
    label(s, cx + 0.2, y - 0.42, 3, "cache hit", GREEN, size=9,
          align=PP_ALIGN.LEFT)

    # sentiment flow
    label(s, M, 3.55, 6, "NEWS SENTIMENT", ACCENT, align=PP_ALIGN.LEFT)
    sf = [("Fetch", "^NSEI + RELIANCE.NS\nTTL 600 s", TEAL),
          ("Normalise", "title, source,\nurl, timestamp", BLUE),
          ("Lexicon score", "+1 positive word\n−1 negative word", PURPLE),
          ("Label", "positive / neutral /\nnegative", ACCENT),
          ("Market mood", "avg score → Optimistic /\nSteady / Cautious",
           GREEN)]
    y = 3.9
    for i, (t, sub, c) in enumerate(sf):
        x = M + i * (w + gap)
        node(s, x, y, w, h, t, sub, c, title_size=12, sub_size=9)
        if i < len(sf) - 1:
            connect(s, x + w, y + h / 2, x + w + gap, y + h / 2, ACCENT)

    # ticker table
    rows = [["Ticker", "Name", "Why"],
            ["RELIANCE.NS", "Reliance Industries", "largest NSE company"],
            ["TCS.NS", "Tata Consultancy", "biggest IT exporter"],
            ["HDFCBANK.NS", "HDFC Bank", "largest private bank"],
            ["GOLDBEES.NS", "Nippon Gold ETF", "gold in demat form"],
            ["BTC-INR", "Bitcoin", "most volatile pick"]]
    table(s, M, 5.15, 7.4, rows, [1.9, 2.4, 3.1], row_h=0.3, font_size=10)
    shot(s, "screenshot-markets.png", 8.5, 5.05, w=4.08)
    page_number(s, 10)


def s11_projection(prs):
    s = new_slide(prs)
    slide_title(s, "Growth Projection", "projection.py")

    lw = 5.9
    textbox(s, M, 2.05, lw, 0.4,
            [{"text": "Formula", "size": 16, "color": ACCENT, "bold": True,
              "space_after": 0}])
    rect(s, M, 2.5, lw, 1.55, fill=CARD2)
    textbox(s, M + 0.3, 2.65, lw - 0.6, 1.3,
            [{"text": "r  = Σ weightᵢ × returnᵢ", "size": 13, "color": TEXT,
              "mono": True, "space_after": 6},
             {"text": "σ  = 0.7 × Σ weightᵢ × volatilityᵢ", "size": 13,
              "color": TEXT, "mono": True, "space_after": 6},
             {"text": "V(m) = amount × (1 + r)^(m / 12)", "size": 13,
              "color": TEXT, "mono": True, "space_after": 6},
             {"text": "band: r − σ  (low)   r + σ  (high)", "size": 13,
              "color": TEXT, "mono": True, "space_after": 0}])

    steps = [("Portfolio return", "weighted sum of expected returns", BLUE),
             ("Portfolio risk", "weighted volatility × 0.7 "
                                "diversification discount", PURPLE),
             ("Monthly compounding", "one point per month for N years",
              TEAL),
             ("Three curves", "mid, low, high, plus final CAGR", GREEN)]
    y, h = 4.3, 0.55
    for i, (t, sub, c) in enumerate(steps):
        node(s, M, y, lw, h, t, sub, c, title_size=12, sub_size=9)
        if i < len(steps) - 1:
            connect(s, M + 0.8, y + h, M + 0.8, y + h + 0.1, ACCENT)
        y += h + 0.1

    shot(s, "screenshot-portfolio.png", 7.0, 2.05, w=5.58)
    textbox(s, 7.0, 5.9, 5.58, 0.6,
            [{"text": "Example: 1 lakh, 5 years, risk 60 → r ≈ 12.4%, "
                      "final ≈ 1.79 lakh, band 1.3 to 2.4 lakh.",
              "size": 11, "color": MUTED, "space_after": 0,
              "line_spacing": 1.2}])
    page_number(s, 11)


def s12_stack(prs):
    s = new_slide(prs)
    slide_title(s, "Tech Stack")
    rows = [["Layer", "Technology", "Purpose"],
            ["Frontend", "React 18, TypeScript, Vite", "SPA, typed API client"],
            ["Styling / charts", "Tailwind CSS, Recharts, lightweight-charts",
             "dashboard, pie, projection, candles"],
            ["Backend", "Python 3.12, FastAPI, Pydantic", "REST API, validation"],
            ["Machine learning", "scikit-learn, NumPy", "Logistic Regression risk model"],
            ["AI layer", "Claude Sonnet via agentic harness",
             "grounded reasoning, JSON output"],
            ["Market data", "yfinance (Yahoo Finance API)", "prices, headlines"],
            ["NLP", "lexicon-based sentiment", "headline polarity, market mood"],
            ["Infra", "ThreadPoolExecutor, TTL cache, fallback.json",
             "latency and resilience"],
            ["Deployment", "atharva.funl.bio, GitHub", "live demo, source"]]
    table(s, M, 2.0, CW, rows, [2.4, 4.7, 4.73], row_h=0.42, font_size=12)
    page_number(s, 12)


def s13_demo(prs):
    s = new_slide(prs)
    slide_title(s, "Live Demo")
    textbox(s, M, 2.35, 5.2, 0.9,
            [{"text": "atharva.funl.bio", "size": 38, "color": ACCENT,
              "bold": True, "space_after": 0}])
    bar(s, M, 3.3, 1.6, 0.045)
    demo = [("1", "Enter 1 lakh, 5 years, risk 60"),
            ("2", "Read risk score and allocation"),
            ("3", "Move slider, watch pie and projection update"),
            ("4", "Open Markets tab for live prices and news mood"),
            ("5", "Ask the assistant a question about the plan")]
    y = 3.65
    for n, t in demo:
        chip(s, M, y, 0.34, 0.34, n, ACCENT, filled=True)
        textbox(s, M + 0.5, y + 0.04, 5.0, 0.4,
                [{"text": t, "size": 13, "color": TEXT, "space_after": 0}])
        y += 0.5
    shot(s, "screenshot-demo.png", 6.35, 2.15, w=6.25)
    page_number(s, 13)


def s14_future(prs):
    s = new_slide(prs)
    slide_title(s, "Future Scope")
    items = [
        ("Broker integration", "Zerodha / Groww API so the plan can be "
                               "executed in one click.", BLUE),
        ("Real user data", "Retrain the risk model on actual user "
                           "behaviour, improve accuracy.", PURPLE),
        ("More assets", "Mutual funds, bonds, SIP mode, more NSE "
                        "tickers.", TEAL),
        ("Transformer sentiment", "Replace lexicon with a fine-tuned "
                                  "FinBERT model.", GREEN),
        ("Alerts", "Push notification when market mood turns negative "
                   "on a held asset.", ACCENT),
        ("Regional languages", "Hindi and other languages in the "
                               "assistant.", RED),
    ]
    w, h = 3.83, 1.25
    for i, (t, sub, c) in enumerate(items):
        x = M + (i % 3) * (w + 0.32)
        y = 2.2 + (i // 3) * (h + 0.3)
        node(s, x, y, w, h, t, sub, c, title_size=14, sub_size=11)
    textbox(s, M, 5.6, CW, 0.6,
            [{"text": "Thank you.", "size": 28, "color": TEXT, "bold": True,
              "space_after": 0}])
    page_number(s, 14)


def build():
    prs = Presentation()
    prs.slide_width = Inches(SLIDE_W)
    prs.slide_height = Inches(SLIDE_H)
    for fn in (s01_title, s02_problem, s03_overview, s04_architecture,
               s05_request_flow, s06_ml_model, s07_evaluation, s08_allocation,
               s09_ai_pipeline, s10_market, s11_projection, s12_stack,
               s13_demo, s14_future):
        fn(prs)
    prs.save(OUT)
    print(f"font: {FONT}")
    print(f"slides: {len(prs.slides)}")
    print(f"written: {OUT}")


if __name__ == "__main__":
    build()
