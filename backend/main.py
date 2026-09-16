"""FastAPI entrypoint for the AI investment advisor demo."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from backend import chat as chat_mod
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend import market, projection, risk_model
from backend.allocator import allocate


DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

app = FastAPI(title="AI Investment Advisor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyseRequest(BaseModel):
    amount: float = Field(gt=0)
    horizon_years: Literal[1, 3, 5, 10]
    risk: int = Field(ge=0, le=100)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.post("/api/analyse")
def analyse(request: AnalyseRequest) -> dict:
    risk_score, risk_label, risk_sentence = risk_model.score(
        request.amount, request.horizon_years, request.risk
    )
    allocation = allocate(risk_score, request.horizon_years)
    plan = projection.project(request.amount, allocation, request.horizon_years)
    news, market_mood = market.get_news()

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "risk_sentence": risk_sentence,
        "allocation": [
            {
                "key": item["key"],
                "name": item["name"],
                "weight": item["weight"],
                "amount": round(request.amount * item["weight"], 2),
                "expected_return": item["expected_return"],
            }
            for item in allocation
        ],
        "picks": market.get_prices(),
        "news": news,
        "market_mood": market_mood,
        "projection": plan,
        "generated_at": _now_iso(),
    }


@app.get("/api/prices")
def prices() -> dict:
    return {"picks": market.get_prices(), "indices": market.get_indices(), "generated_at": _now_iso()}


@app.get("/api/quotes")
def quotes(tickers: str) -> dict:
    return {"quotes": market.get_quotes(tickers.split(",")), "generated_at": _now_iso()}


@app.get("/api/search")
def search(q: str) -> dict:
    return {"results": market.search(q)}


@app.get("/api/history")
def history(tickers: str, range: str = "3m") -> dict:
    return {"range": range, "series": market.get_history(tickers.split(","), range)}


@app.get("/api/news")
def news() -> dict:
    items, market_mood = market.get_news()
    return {"news": items, "market_mood": market_mood}


class ChatRequest(BaseModel):
    question: str
    history: list[dict] = []
    inputs: dict | None = None
    result: dict | None = None


@app.get("/api/chat/suggested")
def chat_suggested(stage: str = "result") -> dict:
    return {"questions": chat_mod.SUGGESTED_START if stage == "start" else chat_mod.SUGGESTED}


@app.post("/api/chat")
def chat_endpoint(req: ChatRequest) -> dict:
    context = chat_mod.build_context(req.result, req.inputs)
    answer = chat_mod.ask(req.question, req.history, context)
    return {"answer": answer}


if (DIST / "index.html").exists():
    if (DIST / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    def spa(path: str) -> FileResponse:
        candidate = DIST / path
        if path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
