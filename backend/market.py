"""Live prices and headlines from yfinance, with on-disk fallbacks."""

from __future__ import annotations

import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import yfinance as yf

FALLBACK_PATH = Path(__file__).resolve().parent / "data" / "fallback.json"

PICKS = [
    {
        "ticker": "RELIANCE.NS",
        "name": "Reliance Industries",
        "why": "Largest company on the NSE, steady earnings across energy and retail.",
    },
    {
        "ticker": "TCS.NS",
        "name": "Tata Consultancy Services",
        "why": "India's biggest IT exporter, with long contracts and low debt.",
    },
    {
        "ticker": "HDFCBANK.NS",
        "name": "HDFC Bank",
        "why": "The largest private bank here, known for careful lending.",
    },
    {
        "ticker": "GOLDBEES.NS",
        "name": "Nippon India Gold ETF",
        "why": "Holds gold for you in demat form, so there is no locker or making charge.",
    },
    {
        "ticker": "BTC-INR",
        "name": "Bitcoin",
        "why": "The most traded crypto asset, and the most volatile thing on this list.",
    },
]

UNIVERSE = [
    ("RELIANCE.NS", "Reliance Industries", "Energy"),
    ("TCS.NS", "Tata Consultancy Services", "IT"),
    ("HDFCBANK.NS", "HDFC Bank", "Banking"),
    ("ICICIBANK.NS", "ICICI Bank", "Banking"),
    ("INFY.NS", "Infosys", "IT"),
    ("BHARTIARTL.NS", "Bharti Airtel", "Telecom"),
    ("SBIN.NS", "State Bank of India", "Banking"),
    ("ITC.NS", "ITC", "FMCG"),
    ("HINDUNILVR.NS", "Hindustan Unilever", "FMCG"),
    ("LT.NS", "Larsen & Toubro", "Infrastructure"),
    ("KOTAKBANK.NS", "Kotak Mahindra Bank", "Banking"),
    ("AXISBANK.NS", "Axis Bank", "Banking"),
    ("BAJFINANCE.NS", "Bajaj Finance", "NBFC"),
    ("MARUTI.NS", "Maruti Suzuki", "Auto"),
    ("TATAMOTORS.NS", "Tata Motors", "Auto"),
    ("M&M.NS", "Mahindra & Mahindra", "Auto"),
    ("SUNPHARMA.NS", "Sun Pharma", "Pharma"),
    ("TITAN.NS", "Titan", "Consumer"),
    ("ASIANPAINT.NS", "Asian Paints", "Consumer"),
    ("ULTRACEMCO.NS", "UltraTech Cement", "Cement"),
    ("NTPC.NS", "NTPC", "Power"),
    ("POWERGRID.NS", "Power Grid", "Power"),
    ("ONGC.NS", "ONGC", "Energy"),
    ("COALINDIA.NS", "Coal India", "Mining"),
    ("TATASTEEL.NS", "Tata Steel", "Metals"),
    ("JSWSTEEL.NS", "JSW Steel", "Metals"),
    ("HINDALCO.NS", "Hindalco", "Metals"),
    ("ADANIENT.NS", "Adani Enterprises", "Conglomerate"),
    ("ADANIPORTS.NS", "Adani Ports", "Infrastructure"),
    ("WIPRO.NS", "Wipro", "IT"),
    ("HCLTECH.NS", "HCL Technologies", "IT"),
    ("TECHM.NS", "Tech Mahindra", "IT"),
    ("NESTLEIND.NS", "Nestle India", "FMCG"),
    ("BAJAJFINSV.NS", "Bajaj Finserv", "Finance"),
    ("DRREDDY.NS", "Dr. Reddy's", "Pharma"),
    ("CIPLA.NS", "Cipla", "Pharma"),
    ("DIVISLAB.NS", "Divi's Labs", "Pharma"),
    ("EICHERMOT.NS", "Eicher Motors", "Auto"),
    ("HEROMOTOCO.NS", "Hero MotoCorp", "Auto"),
    ("BRITANNIA.NS", "Britannia", "FMCG"),
    ("GRASIM.NS", "Grasim", "Cement"),
    ("INDUSINDBK.NS", "IndusInd Bank", "Banking"),
    ("TATACONSUM.NS", "Tata Consumer", "FMCG"),
    ("APOLLOHOSP.NS", "Apollo Hospitals", "Healthcare"),
    ("ETERNAL.NS", "Eternal (Zomato)", "Internet"),
    ("PAYTM.NS", "Paytm", "Fintech"),
    ("IRCTC.NS", "IRCTC", "Travel"),
    ("DMART.NS", "Avenue Supermarts", "Retail"),
    ("GOLDBEES.NS", "Nippon India Gold ETF", "Gold"),
    ("NIFTYBEES.NS", "Nippon Nifty 50 ETF", "Index fund"),
    ("BTC-INR", "Bitcoin", "Crypto"),
    ("ETH-INR", "Ethereum", "Crypto"),
]
UNIVERSE_BY_TICKER = {t: {"ticker": t, "name": n, "sector": sec} for t, n, sec in UNIVERSE}


def search(q: str, limit: int = 8) -> list[dict]:
    q = q.strip().lower()
    if not q:
        return []
    scored = []
    for t, n, sec in UNIVERSE:
        sym = t.split(".")[0].lower()
        score = 0
        if sym.startswith(q) or n.lower().startswith(q):
            score = 3
        elif q in sym or q in n.lower():
            score = 2
        elif q in sec.lower():
            score = 1
        if score:
            scored.append((score, {"ticker": t, "name": n, "sector": sec}))
    scored.sort(key=lambda x: (-x[0], x[1]["name"]))
    out = [x[1] for x in scored[:limit]]
    if not out and q.isalnum():
        out = [{"ticker": q.upper() + ".NS", "name": q.upper(), "sector": ""}]
    return out


_quote_cache: dict[str, dict] = {}


def _fetch_quote(ticker: str) -> dict:
    info = yf.Ticker(ticker).fast_info
    last = float(info["last_price"])
    prev = float(info["previous_close"] or 0.0)
    if not last or last <= 0:
        raise ValueError("no last price")

    def _f(key: str) -> float | None:
        try:
            v = info[key]
            return float(v) if v is not None else None
        except Exception:
            return None

    return {
        "price": round(last, 2),
        "change_pct": round(((last - prev) / prev * 100.0) if prev else 0.0, 2),
        "prev_close": round(prev, 2),
        "day_high": _f("day_high"),
        "day_low": _f("day_low"),
        "year_high": _f("year_high"),
        "year_low": _f("year_low"),
        "volume": _f("last_volume"),
        "market_cap": _f("market_cap"),
    }


def get_quotes(tickers: list[str]) -> list[dict]:
    tickers = [t for t in dict.fromkeys(tickers) if t]
    now = time.time()
    stale = [t for t in tickers if t not in _quote_cache or now - _quote_cache[t]["at"] > PRICE_TTL]
    if stale:
        with ThreadPoolExecutor(max_workers=min(8, len(stale))) as pool:
            futures = {pool.submit(_fetch_quote, t): t for t in stale}
            try:
                for future in as_completed(futures, timeout=PRICE_TIMEOUT + 2):
                    t = futures[future]
                    try:
                        _quote_cache[t] = {"at": time.time(), "live": True, "q": future.result()}
                    except Exception:
                        if t in _quote_cache:
                            _quote_cache[t]["live"] = False
            except TimeoutError:
                pass
            for future in futures:
                future.cancel()
    out = []
    for t in tickers:
        meta = UNIVERSE_BY_TICKER.get(t, {"ticker": t, "name": t.split(".")[0], "sector": ""})
        entry = _quote_cache.get(t)
        if not entry:
            fb = _load_fallback().get("prices", {}).get(t)
            if not fb:
                continue
            q = {"price": fb["price"], "change_pct": fb["change_pct"], "prev_close": None, "day_high": None, "day_low": None, "year_high": None, "year_low": None, "volume": None, "market_cap": None}
            live = False
        else:
            q, live = entry["q"], entry["live"]
        out.append({**meta, **q, "currency": "INR", "live": live})
    return out


_history_cache: dict[str, dict] = {}
HISTORY_TTL = 600.0
RANGES = {"1w": ("7d", "1h"), "1m": ("1mo", "1d"), "3m": ("3mo", "1d"), "1y": ("1y", "1d"), "5y": ("5y", "1wk")}


def get_history(tickers: list[str], rng: str = "3m") -> dict[str, list[dict]]:
    period, interval = RANGES.get(rng, RANGES["3m"])
    tickers = [t for t in dict.fromkeys(tickers) if t]
    key_of = lambda t: f"{t}|{rng}"
    now = time.time()
    need = [t for t in tickers if key_of(t) not in _history_cache or now - _history_cache[key_of(t)]["at"] > HISTORY_TTL]
    if need:
        try:
            df = yf.download(need, period=period, interval=interval, progress=False, threads=True, auto_adjust=True, group_by="ticker")
            for t in need:
                try:
                    sub = df[t] if len(need) > 1 or (hasattr(df.columns, "levels") and t in df.columns.get_level_values(0)) else df
                    sub = sub.dropna(subset=["Close"])
                    pts = [
                        {
                            "t": idx.isoformat(),
                            "o": round(float(r["Open"]), 2),
                            "h": round(float(r["High"]), 2),
                            "l": round(float(r["Low"]), 2),
                            "c": round(float(r["Close"]), 2),
                            "v": int(r["Volume"]) if r["Volume"] == r["Volume"] else 0,
                        }
                        for idx, r in sub.iterrows()
                    ]
                    if pts:
                        _history_cache[key_of(t)] = {"at": time.time(), "pts": pts}
                except Exception:
                    continue
        except Exception:
            pass
    return {t: _history_cache[key_of(t)]["pts"] for t in tickers if key_of(t) in _history_cache}


POSITIVE_WORDS = (
    "rally", "surge", "gain", "record", "profit", "growth", "upgrade", "beat", "strong", "high",
)
NEGATIVE_WORDS = (
    "fall", "drop", "loss", "slump", "cut", "weak", "fear", "decline", "crash", "low",
)

PRICE_TTL = 60.0
NEWS_TTL = 600.0
PRICE_TIMEOUT = 6.0
NEWS_TIMEOUT = 5.0

_lock = threading.Lock()
_price_cache: dict = {"at": 0.0, "value": None}
_news_cache: dict = {"at": 0.0, "value": None}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_fallback() -> dict:
    try:
        with FALLBACK_PATH.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return {"prices": {}, "news": []}


def _save_fallback(data: dict) -> None:
    try:
        tmp = FALLBACK_PATH.with_suffix(".json.tmp")
        with tmp.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, ensure_ascii=False)
        tmp.replace(FALLBACK_PATH)
    except OSError:
        pass


def _fetch_one(ticker: str) -> tuple[float, float]:
    info = yf.Ticker(ticker).fast_info
    last = float(info["last_price"])
    prev = float(info["previous_close"])
    if not last or last <= 0:
        raise ValueError("no last price")
    change = ((last - prev) / prev * 100.0) if prev else 0.0
    return round(last, 2), round(change, 2)


def _fetch_prices() -> dict[str, tuple[float, float]]:
    results: dict[str, tuple[float, float]] = {}
    with ThreadPoolExecutor(max_workers=len(PICKS)) as pool:
        futures = {pool.submit(_fetch_one, pick["ticker"]): pick["ticker"] for pick in PICKS}
        try:
            for future in as_completed(futures, timeout=PRICE_TIMEOUT):
                ticker = futures[future]
                try:
                    results[ticker] = future.result()
                except Exception:
                    continue
        except TimeoutError:
            pass
        for future in futures:
            future.cancel()
    return results


INDICES = [
    {"ticker": "^NSEI", "name": "NIFTY 50", "fallback": (25120.5, 0.42)},
    {"ticker": "^BSESN", "name": "SENSEX", "fallback": (82340.2, 0.38)},
    {"ticker": "INR=X", "name": "USD/INR", "fallback": (88.12, -0.05)},
]
_index_cache: dict = {"at": 0.0, "value": None}


def get_indices() -> list[dict]:
    with _lock:
        if _index_cache["value"] is not None and time.time() - _index_cache["at"] < PRICE_TTL:
            return _index_cache["value"]
    live: dict[str, tuple[float, float]] = {}
    with ThreadPoolExecutor(max_workers=len(INDICES)) as pool:
        futures = {pool.submit(_fetch_one, ix["ticker"]): ix["ticker"] for ix in INDICES}
        try:
            for future in as_completed(futures, timeout=PRICE_TIMEOUT):
                try:
                    live[futures[future]] = future.result()
                except Exception:
                    continue
        except TimeoutError:
            pass
    out = []
    for ix in INDICES:
        price, change = live.get(ix["ticker"], ix["fallback"])
        out.append({"ticker": ix["ticker"], "name": ix["name"], "price": price, "change_pct": change, "live": ix["ticker"] in live})
    with _lock:
        _index_cache["at"] = time.time()
        _index_cache["value"] = out
    return out


def get_prices() -> list[dict]:
    with _lock:
        if _price_cache["value"] is not None and time.time() - _price_cache["at"] < PRICE_TTL:
            return _price_cache["value"]
    quotes = {q["ticker"]: q for q in get_quotes([p["ticker"] for p in PICKS])}
    fallback = _load_fallback()
    stored = dict(fallback.get("prices", {}))
    picks: list[dict] = []
    any_live = False
    for pick in PICKS:
        q = quotes.get(pick["ticker"])
        if q:
            picks.append({**q, "name": pick["name"], "why": pick["why"]})
            if q["live"]:
                any_live = True
                stored[pick["ticker"]] = {"price": q["price"], "change_pct": q["change_pct"]}
        else:
            saved = stored.get(pick["ticker"], {"price": 0.0, "change_pct": 0.0})
            picks.append({"ticker": pick["ticker"], "name": pick["name"], "sector": "", "price": float(saved["price"]), "change_pct": float(saved["change_pct"]), "prev_close": None, "day_high": None, "day_low": None, "year_high": None, "year_low": None, "volume": None, "market_cap": None, "currency": "INR", "why": pick["why"], "live": False})
    if any_live:
        fallback["prices"] = stored
        _save_fallback(fallback)
    with _lock:
        _price_cache["at"] = time.time()
        _price_cache["value"] = picks
    return picks


def classify(title: str) -> str:
    text = title.lower()
    positive = sum(1 for word in POSITIVE_WORDS if word in text)
    negative = sum(1 for word in NEGATIVE_WORDS if word in text)
    if positive > negative:
        return "positive"
    if negative > positive:
        return "negative"
    return "neutral"


def mood(items: list[dict]) -> dict:
    positive = sum(1 for item in items if item["sentiment"] == "positive")
    negative = sum(1 for item in items if item["sentiment"] == "negative")
    score = (positive - negative) / max(1, len(items))
    if score > 0.2:
        label = "Optimistic"
    elif score < -0.2:
        label = "Cautious"
    else:
        label = "Steady"
    return {"label": label, "score": round(score, 3)}


def _normalise(raw: dict) -> dict | None:
    item = raw.get("content") if isinstance(raw.get("content"), dict) else raw
    title = item.get("title") or raw.get("title")
    if not title:
        return None

    provider = item.get("provider")
    source = provider.get("displayName") if isinstance(provider, dict) else None
    source = source or item.get("publisher") or raw.get("publisher") or "Yahoo Finance"

    url = item.get("canonicalUrl") or item.get("clickThroughUrl") or {}
    url = url.get("url") if isinstance(url, dict) else url
    url = url or item.get("link") or raw.get("link") or "#"

    published = item.get("pubDate") or item.get("displayTime")
    if not published:
        stamp = item.get("providerPublishTime") or raw.get("providerPublishTime")
        published = (
            datetime.fromtimestamp(float(stamp), timezone.utc).isoformat()
            if stamp
            else _now_iso()
        )

    return {
        "title": str(title).strip(),
        "source": str(source),
        "url": str(url),
        "sentiment": classify(str(title)),
        "published": str(published),
    }


def _fetch_news() -> list[dict]:
    items: list[dict] = []

    def pull(symbol: str) -> list:
        return list(yf.Ticker(symbol).news or [])

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(pull, symbol) for symbol in ("^NSEI", "RELIANCE.NS")]
        try:
            for future in as_completed(futures, timeout=NEWS_TIMEOUT):
                try:
                    items.extend(future.result())
                except Exception:
                    continue
        except TimeoutError:
            pass
        for future in futures:
            future.cancel()

    seen: set[str] = set()
    out: list[dict] = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        entry = _normalise(raw)
        if entry is None or entry["title"] in seen:
            continue
        seen.add(entry["title"])
        out.append(entry)
        if len(out) >= 8:
            break
    return out


RELEVANT = (
    "nifty", "sensex", "rbi", "rupee", "india", "reliance", "tcs", "hdfc", "gold",
    "bitcoin", "crypto", "nse", "bse", "sebi", "mutual fund", "fii", "dalal",
)


def _relevant(title: str) -> bool:
    t = title.lower()
    return any(k in t for k in RELEVANT)


def get_news() -> tuple[list[dict], dict]:
    with _lock:
        if _news_cache["value"] is not None and time.time() - _news_cache["at"] < NEWS_TTL:
            return _news_cache["value"]

    live = [item for item in _fetch_news() if _relevant(item["title"])]
    seeded = [
        {
            "title": entry["title"],
            "source": entry["source"],
            "url": entry["url"],
            "sentiment": classify(entry["title"]),
            "published": entry["published"],
        }
        for entry in _load_fallback().get("news", [])
    ]
    items = (live + seeded)[:8]

    value = (items, mood(items))
    with _lock:
        _news_cache["at"] = time.time()
        _news_cache["value"] = value
    return value
