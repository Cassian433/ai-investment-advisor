"""Compounds an allocation forward month by month with a one-sigma band."""

from __future__ import annotations

DIVERSIFICATION_DISCOUNT = 0.7


def _compound(amount: float, annual_return: float, months: int) -> list[float]:
    monthly = (1.0 + max(annual_return, -0.95)) ** (1.0 / 12.0)
    return [amount * monthly**month for month in range(months + 1)]


def project(amount: float, allocation: list[dict], horizon_years: int) -> dict:
    expected = sum(item["weight"] * item["expected_return"] for item in allocation)
    volatility = sum(item["weight"] * item["volatility"] for item in allocation) * DIVERSIFICATION_DISCOUNT
    months = int(horizon_years) * 12

    mid = _compound(amount, expected, months)
    low = _compound(amount, expected - volatility, months)
    high = _compound(amount, expected + volatility, months)

    points = [
        {
            "month": month,
            "value": round(mid[month], 2),
            "low": round(low[month], 2),
            "high": round(high[month], 2),
        }
        for month in range(months + 1)
    ]

    final = mid[-1]
    cagr = (final / amount) ** (1.0 / horizon_years) - 1.0 if amount > 0 else 0.0

    return {
        "points": points,
        "final": round(final, 2),
        "final_low": round(low[-1], 2),
        "final_high": round(high[-1], 2),
        "cagr": round(cagr, 4),
    }
