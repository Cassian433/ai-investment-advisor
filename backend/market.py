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


def get_prices() -> list[dict]:
    with _lock:
        if _price_cache["value"] is not None and time.time() - _price_cache["at"] < PRICE_TTL:
            return _price_cache["value"]

    live = _fetch_prices()
    fallback = _load_fallback()
    stored = dict(fallback.get("prices", {}))

    picks: list[dict] = []
    for pick in PICKS:
        ticker = pick["ticker"]
        if ticker in live:
            price, change = live[ticker]
            stored[ticker] = {"price": price, "change_pct": change}
            is_live = True
        else:
            saved = stored.get(ticker, {})
            price = float(saved.get("price", 0.0))
            change = float(saved.get("change_pct", 0.0))
            is_live = False
        picks.append(
            {
                "ticker": ticker,
                "name": pick["name"],
                "price": price,
                "change_pct": change,
                "currency": "INR",
                "why": pick["why"],
                "live": is_live,
            }
        )

    if live:
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
