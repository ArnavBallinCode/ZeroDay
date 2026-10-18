from __future__ import annotations

from datamind.adapters.gemma import GemmaPlanner
from datamind.adapters.snowflake import SnowflakeExecutor
from datamind.core.answer import deterministic_summary
from datamind.core.catalog import SemanticCatalog
from datamind.core.compiler import QueryCompiler
from datamind.core.models import AnswerEnvelope


class NeedsClarification(ValueError):
    pass


class DataMindAgent:
    def __init__(
        self,
        catalog: SemanticCatalog,
        planner: GemmaPlanner,
        executor: SnowflakeExecutor,
    ):
        self.catalog = catalog
        self.planner = planner
        self.executor = executor
        self.compiler = QueryCompiler(catalog)

    def ask(self, question: str, context: list[str] | None = None) -> AnswerEnvelope:
        plan = self.planner.plan(question, self.catalog.prompt_schema(), context)
        if plan.clarification:
            raise NeedsClarification(plan.clarification)
        query = self.compiler.compile(plan)
        result = self.executor.execute(query)
        summary, claims = deterministic_summary(plan, result)
        explanation = self.planner.explain(question, plan, result.columns, result.rows)
        limitations = []
        if len(result.rows) >= plan.limit:
            limitations.append(f"The display is limited to {plan.limit} rows.")
        if plan.assumptions:
            limitations.extend(f"Assumption: {item}" for item in plan.assumptions)
        return AnswerEnvelope(
            question=question,
            summary=summary,
            plan=plan,
            query=query,
            result=result,
            claims=claims,
            explanation=explanation,
            limitations=limitations,
        )
