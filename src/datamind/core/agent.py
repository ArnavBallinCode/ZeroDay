from __future__ import annotations

from datamind.adapters.gemma import GemmaPlanner
from datamind.adapters.snowflake import SnowflakeExecutor
from datamind.core.answer import deterministic_summary, verify_sentence_grounding
from datamind.core.catalog import SemanticCatalog
from datamind.core.compiler import QueryCompiler
from datamind.core.models import AnswerEnvelope, QueryPlan


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

    def ask(
        self,
        question: str,
        context: list[str] | None = None,
        previous_plan: QueryPlan | None = None,
    ) -> AnswerEnvelope:
        plan = self.planner.plan(question, self.catalog.prompt_schema(), context, previous_plan)
        if plan.clarification:
            raise NeedsClarification(plan.clarification)

        # Deterministic multi-turn fallback: if follow-up omitted dimensions or metrics
        if previous_plan:
            if not plan.metrics and previous_plan.metrics:
                plan.metrics = previous_plan.metrics
            if not plan.dimensions and previous_plan.dimensions and not plan.filters:
                plan.dimensions = previous_plan.dimensions
            if not plan.sort and previous_plan.sort:
                plan.sort = previous_plan.sort

        query = self.compiler.compile(plan)
        result = self.executor.execute(query)
        summary, claims = deterministic_summary(plan, result)
        explanation = self.planner.explain(question, plan, result.columns, result.rows)
        sentence_grounding = verify_sentence_grounding(explanation, plan, result)

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
            sentence_grounding=sentence_grounding,
            limitations=limitations,
        )
