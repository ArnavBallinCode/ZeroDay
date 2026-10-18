from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from datamind.adapters.gemma import GemmaPlanner, GemmaUnavailable
from datamind.adapters.snowflake import SnowflakeExecutor
from datamind.config import Settings
from datamind.core.agent import DataMindAgent, NeedsClarification
from datamind.core.catalog import SemanticCatalog
from datamind.core.compiler import InvalidPlan
from datamind.core.models import AnswerEnvelope


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)
    context: list[str] = Field(default_factory=list, max_length=3)


settings = Settings()
catalog = SemanticCatalog.load(Path("config/tpch.yml"))
planner = GemmaPlanner(settings.ollama_base_url, settings.gemma_model)
executor = SnowflakeExecutor(settings, set(catalog.tables))
agent = DataMindAgent(catalog, planner, executor)

app = FastAPI(title="DataMind API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, object]:
    return {
        "status": "ready" if settings.snowflake_ready and planner.health() else "setup_required",
        "snowflake": {
            "ready": settings.snowflake_ready,
            "warehouse": settings.snowflake_warehouse,
            "dataset": f"{settings.snowflake_database}.{settings.snowflake_schema}",
        },
        "gemma": {"ready": planner.health(), "model": settings.gemma_model},
        "semantic_model": {
            "name": catalog.name,
            "dimensions": len(catalog.dimensions),
            "metrics": len(catalog.metrics),
            "tables": len(catalog.tables),
        },
    }


@app.post("/api/ask", response_model=AnswerEnvelope)
def ask(payload: AskRequest) -> AnswerEnvelope:
    if not settings.snowflake_ready:
        raise HTTPException(503, "Snowflake is not configured. Add account and user to .env.")
    if not planner.health():
        raise HTTPException(503, f"Local Gemma model {settings.gemma_model} is not available.")
    try:
        return agent.ask(payload.question, payload.context)
    except NeedsClarification as exc:
        raise HTTPException(422, {"type": "clarification", "question": str(exc)}) from exc
    except (InvalidPlan, GemmaUnavailable) as exc:
        raise HTTPException(422, str(exc)) from exc
    except Exception as exc:
        raise HTTPException(502, f"The verified query could not complete: {exc}") from exc
