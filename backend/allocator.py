"""Maps a risk score and horizon onto a fixed set of asset classes."""

from __future__ import annotations

ASSETS = {
    "fd": {"name": "Bank fixed deposit", "expected_return": 0.070, "volatility": 0.005},
    "gold": {"name": "Gold", "expected_return": 0.090, "volatility": 0.120},
    "nifty": {"name": "Nifty 50 index fund", "expected_return": 0.125, "volatility": 0.160},
    "bluechip": {"name": "Bluechip stocks", "expected_return": 0.140, "volatility": 0.200},
    "crypto": {"name": "Crypto", "expected_return": 0.250, "volatility": 0.600},
}

ORDER = ("fd", "gold", "nifty", "bluechip", "crypto")

ANCHORS = {
    0: {"fd": 0.55, "gold": 0.25, "nifty": 0.15, "bluechip": 0.05, "crypto": 0.00},
    50: {"fd": 0.20, "gold": 0.15, "nifty": 0.35, "bluechip": 0.25, "crypto": 0.05},
    100: {"fd": 0.05, "gold": 0.05, "nifty": 0.30, "bluechip": 0.40, "crypto": 0.20},
}


def _interpolate(risk_score: float) -> dict[str, float]:
    risk = min(100.0, max(0.0, float(risk_score)))
    if risk <= 50.0:
        low, high, t = ANCHORS[0], ANCHORS[50], risk / 50.0
    else:
        low, high, t = ANCHORS[50], ANCHORS[100], (risk - 50.0) / 50.0
    return {key: low[key] + (high[key] - low[key]) * t for key in ORDER}


def allocate(risk_score: float, horizon_years: int) -> list[dict]:
    weights = _interpolate(risk_score)

    if horizon_years <= 1:
        moved = (weights["crypto"] + weights["bluechip"]) / 2.0
        weights["crypto"] /= 2.0
        weights["bluechip"] /= 2.0
        weights["fd"] += moved

    total = sum(weights.values()) or 1.0
    weights = {key: round(value / total, 3) for key, value in weights.items()}

    drift = round(1.0 - sum(weights.values()), 3)
    if drift:
        biggest = max(ORDER, key=lambda key: weights[key])
        weights[biggest] = round(weights[biggest] + drift, 3)

    return [
        {
            "key": key,
            "name": ASSETS[key]["name"],
            "weight": weights[key],
            "expected_return": ASSETS[key]["expected_return"],
            "volatility": ASSETS[key]["volatility"],
        }
        for key in ORDER
    ]
