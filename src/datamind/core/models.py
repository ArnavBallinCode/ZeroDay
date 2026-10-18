from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Filter(BaseModel):
    field: str
    operator: Literal["eq", "neq", "gt", "gte", "lt", "lte", "in", "between"]
    value: Any


class Sort(BaseModel):
    field: str
    direction: Literal["asc", "desc"] = "desc"


class QueryPlan(BaseModel):
    dataset: str = "tpch"
    dimensions: list[str] = Field(default_factory=list)
    metrics: list[str] = Field(min_length=1)
    filters: list[Filter] = Field(default_factory=list)
    sort: list[Sort] = Field(default_factory=list)
    limit: int = Field(default=20, ge=1, le=200)
    assumptions: list[str] = Field(default_factory=list)
    clarification: str | None = None

    @field_validator("dimensions", "metrics")
    @classmethod
    def unique_fields(cls, values: list[str]) -> list[str]:
        return list(dict.fromkeys(values))


class CompiledQuery(BaseModel):
    sql: str
    parameters: tuple[Any, ...] = ()
    tables: list[str]
    selected_fields: list[str]


class QueryResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    query_id: str
    columns: list[str]
    rows: list[list[Any]]
    elapsed_ms: int
    warehouse: str
    role: str
    executed_at: datetime
    bytes_scanned: int = 0
    partitions_scanned: int = 0
    credits_used: float = 0.0
    cache_hit: bool = False


class EvidenceClaim(BaseModel):
    text: str
    row_indexes: list[int]
    columns: list[str]


class SentenceGrounding(BaseModel):
    sentence: str
    grounded: bool
    matched_values: list[str] = Field(default_factory=list)
    matched_row_indexes: list[int] = Field(default_factory=list)


class AnswerEnvelope(BaseModel):
    question: str
    summary: str
    plan: QueryPlan
    query: CompiledQuery
    result: QueryResult
    claims: list[EvidenceClaim]
    explanation: str
    sentence_grounding: list[SentenceGrounding] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
