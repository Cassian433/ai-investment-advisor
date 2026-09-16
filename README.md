# AI Investment Advisor

Tell it how much money you have. It tells you where to put it.

Live: https://atharva.funl.bio

## What it does

You enter three things: how much you want to invest, for how long, and how much risk you are comfortable with. The app then shows:

- **Risk score**: a number from 0 to 100 with a plain sentence about what to expect.
- **Where the money goes**: a split across five options (bank fixed deposit, gold, Nifty 50 index fund, bluechip stocks, crypto) with the rupee amount for each.
- **What to buy today**: five picks with live prices and today's change.
- **What the news says**: today's headlines, each marked positive, neutral or negative, and an overall market mood.
- **Growth**: a chart of what the money is expected to become over the chosen period, with a best and worst case.

## How it works

1. The risk score comes from a logistic regression model trained on 2,000 investor profiles (amount, time horizon, risk preference).
2. The score picks a mix from three reference portfolios (safe, balanced, aggressive) and blends between them. Short horizons move money out of crypto and stocks into fixed deposits.
3. Growth is compounded monthly from long-run average returns for each asset class. The band is one standard deviation either side.
4. Prices and news come from Yahoo Finance. Headlines are scored by a keyword rule and combined into a market mood.
5. If the market feed is down, the app falls back to the last prices it saw and a stored set of headlines, so the demo never breaks.

## Data sources

- Prices and news: Yahoo Finance (NSE tickers RELIANCE, TCS, HDFCBANK, GOLDBEES, and BTC-INR).
- Expected returns and volatility per asset class: published long-run averages, fixed in `backend/allocator.py`.
- Risk model training data: generated from investor profile rules in `backend/risk_model.py`.

## Run it

Backend (Python 3.12):

```
uv venv .venv && uv pip install --python .venv/bin/python -r backend/requirements.txt
.venv/bin/uvicorn backend.main:app --port 8011
```

Frontend (Node 20+):

```
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. For production, `npm run build` and the backend serves `frontend/dist` on the same port.

## Stack

React, TypeScript, Tailwind, Framer Motion, Recharts on the front. FastAPI, scikit-learn, yfinance on the back.

## What next

- SIP mode that invests a fixed amount every month.
- Broker connection so the app can place the order.
- Hindi and regional languages.
- Alerts when the news turns negative on something you hold.

## Slides

`docs/AI-Investment-Advisor.pptx` and the PDF export.
