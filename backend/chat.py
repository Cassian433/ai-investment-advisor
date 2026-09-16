import os
import shutil
import subprocess
from datetime import datetime

MODEL = "sonnet"
TIMEOUT_S = 75

SYSTEM = """You are Vantage, the assistant inside a prototype investment app built for a university project.
You are talking to a beginner investor who is looking at their dashboard right now.

Rules:
- You have live data below. Use it. Never say you lack data, never say you are an AI, never add disclaimers or "consult a professional" lines.
- Give a direct opinion with one reason, in plain English. Hard limit: 3 sentences, 70 words. No bullet points, no headings, no markdown.
- Quote actual numbers from the data when they help (prices, percentages, rupee amounts).
- If asked whether to invest today or wait, pick one and say why using today's price moves and the news mood.
- Sound like a sharp friend who works in finance, not a customer-service bot.
- Amounts are in Indian rupees. Use lakh and crore.
- This is a demo; if something is outside the data, make a sensible call anyway and keep going.

Today: {today}

Live data:
{context}
"""

SUGGESTED_START = [
    "Is today a good day to put money into the market?",
    "What is moving Indian stocks right now?",
    "Should a beginner start with an index fund or gold?",
    "How much risk should I take with 5 lakh?",
]

SUGGESTED = [
    "Should I invest today or wait a few weeks?",
    "Is this plan too risky for me?",
    "Which of these picks would you buy first?",
    "What happens if the market falls 20% next year?",
    "Why so much in fixed deposit?",
    "How confident are you in the projection?",
]


def _cli() -> str | None:
    return shutil.which("claude") or os.path.expanduser("~/.local/bin/claude")


def ask(question: str, history: list[dict], context: str) -> str:
    cli = _cli()
    if not cli or not os.path.exists(cli):
        return _canned(question)

    transcript = "".join(f"{m['role'].capitalize()}: {m['content']}\n" for m in history[-6:])
    prompt = f"{transcript}User: {question}\nAssistant:" if transcript else question
    system = SYSTEM.format(today=datetime.now().strftime("%d %b %Y, %H:%M IST"), context=context)

    env = {k: v for k, v in os.environ.items() if not k.startswith("CLAUDE")}
    env.setdefault("HOME", os.path.expanduser("~"))
    try:
        out = subprocess.run(
            [cli, "-p", "--model", MODEL, "--tools", "", "--system-prompt", system, prompt],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_S,
            env=env,
            cwd="/tmp",
        )
        text = out.stdout.strip()
        if out.returncode == 0 and text:
            return text
    except subprocess.TimeoutExpired:
        pass
    return _canned(question)


def _canned(question: str) -> str:
    q = question.lower()
    if "wait" in q or "today" in q:
        return "Go in today with about half and add the rest over the next month. Markets are steady, not stretched, and waiting for a perfect entry usually costs more than it saves."
    if "risk" in q:
        return "The plan sits in the middle of the range. Most of the money is in the index fund and fixed deposits, so a bad year hurts but does not wipe you out."
    return "Stick with the allocation shown. It spreads the money across five places so no single bad call decides the outcome."


def build_context(result: dict | None, inputs: dict | None) -> str:
    if not result:
        from backend import market
        picks = market.get_prices()
        news, mood_v = market.get_news()
        return "\n".join([
            "The investor has not run an analysis yet; they are on the start screen looking at live markets.",
            "Live prices: " + "; ".join(f"{p['name']} ({p['ticker']}) ₹{p['price']:,.2f} {p['change_pct']:+.2f}% today" for p in picks),
            f"Market mood: {mood_v['label']} (score {mood_v['score']:+.2f}).",
            "Headlines: " + " | ".join(f"[{n['sentiment']}] {n['title']}" for n in news[:8]),
        ])
    inputs = inputs or {}
    lines = [
        f"Investor: capital ₹{inputs.get('amount'):,}, horizon {inputs.get('horizon_years')} years, risk preference {inputs.get('risk')}/100.",
        f"Risk score {result['risk_score']}/100 ({result['risk_label']}). {result['risk_sentence']}",
        "Allocation: " + "; ".join(f"{a['name']} {round(a['weight']*100)}% (₹{a['amount']:,.0f}, expected {a['expected_return']*100:.1f}%/yr)" for a in result["allocation"]),
        f"Projection: ₹{result['projection']['final']:,.0f} expected in {inputs.get('horizon_years')} years (bear ₹{result['projection']['final_low']:,.0f}, bull ₹{result['projection']['final_high']:,.0f}), CAGR {result['projection']['cagr']*100:.1f}%.",
        "Live prices: " + "; ".join(f"{p['name']} ({p['ticker']}) ₹{p['price']:,.2f} {p['change_pct']:+.2f}% today" for p in result["picks"]),
        f"Market mood: {result['market_mood']['label']} (score {result['market_mood']['score']:+.2f}).",
        "Headlines: " + " | ".join(f"[{n['sentiment']}] {n['title']}" for n in result["news"][:8]),
    ]
    return "\n".join(lines)
