"""Synthetic-data risk classifier used to turn a questionnaire into a risk score."""

from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression

LABELS = ("Low", "Moderate", "High")

SENTENCES = {
    "Low": "Your money stays mostly in safe places, so it grows slowly and steadily.",
    "Moderate": "Steady growth with small swings along the way.",
    "High": "You accept bigger ups and downs in exchange for a higher long-term return.",
}

_N_SAMPLES = 2000
_SEED = 42


def _make_dataset() -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(_SEED)
    amount = rng.lognormal(mean=12.0, sigma=1.1, size=_N_SAMPLES)
    amount_log = np.log10(np.clip(amount, 1000.0, None))
    horizon = rng.choice([1, 3, 5, 10], size=_N_SAMPLES)
    risk_pref = rng.uniform(0.0, 100.0, size=_N_SAMPLES)

    noise = rng.normal(0.0, 7.0, size=_N_SAMPLES)
    latent = risk_pref - 2.2 * (horizon - 1) + 1.5 * (amount_log - 5.0) + noise
    label = np.where(latent < 34.0, 0, np.where(latent < 67.0, 1, 2))

    features = np.column_stack([amount_log, horizon.astype(float), risk_pref])
    return features, label


def _train() -> LogisticRegression:
    features, label = _make_dataset()
    model = LogisticRegression(max_iter=300)
    model.fit(features, label)
    return model


_MODEL = _train()


def _label_for(score: int) -> str:
    if score < 34:
        return "Low"
    if score < 67:
        return "Moderate"
    return "High"


def score(amount: float, horizon_years: int, risk_pref: int) -> tuple[int, str, str]:
    amount_log = float(np.log10(max(float(amount), 1000.0)))
    row = np.array([[amount_log, float(horizon_years), float(risk_pref)]])
    p_low, p_mod, p_high = _MODEL.predict_proba(row)[0]
    raw = p_low * 15.0 + p_mod * 50.0 + p_high * 88.0
    risk_score = int(round(min(100.0, max(0.0, raw))))
    label = _label_for(risk_score)
    return risk_score, label, SENTENCES[label]
