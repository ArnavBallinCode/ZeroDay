from datetime import UTC, datetime
from unittest.mock import Mock

from datamind.core.agent import DataMindAgent
from datamind.core.catalog import SemanticCatalog
from datamind.core.models import Filter, QueryPlan, QueryResult, Sort


def test_relative_period_uses_live_coverage_and_retains_proof():
    catalog = SemanticCatalog.load('config/tpch.yml')
    planner = Mock(model='gemma2:2b', temperature=0)
    planner.plan.return_value = QueryPlan(metrics=['revenue'])
    planner.explain.return_value = 'Revenue is 10.'
    executor = Mock(guardrails=None, allowed_tables=set(catalog.tables))
    executor.execute.side_effect = [
        QueryResult(query_id='coverage', columns=['order_year', 'order_count'],
                    rows=[[1998, 20]], elapsed_ms=1, warehouse='test', role='test', executed_at=datetime.now(UTC)),
        QueryResult(query_id='answer', columns=['revenue'], rows=[[10]], elapsed_ms=1,
                    warehouse='test', role='test', executed_at=datetime.now(UTC)),
    ]
    answer = DataMindAgent(catalog, planner, executor).ask('revenue in the last two years')
    assert answer.query.parameters == (1997, 1998)
    assert '1997–1998' in answer.summary
    assert answer.execution_trace[0].output_payload['result']['query_id'] == 'coverage'


def test_ordinal_followup_preserves_previous_ranking_and_reruns():
    catalog = SemanticCatalog.load('config/tpch.yml')
    planner = Mock(model='gemma2:2b', temperature=0)
    planner.plan.return_value = QueryPlan(metrics=['revenue'], clarification='Who?')
    planner.explain.return_value = 'Two rows returned.'
    executor = Mock(guardrails=None, allowed_tables=set(catalog.tables))
    executor.execute.return_value = QueryResult(
        query_id='fresh', columns=['nation_name', 'revenue'], rows=[['INDIA', 20], ['VIETNAM', 10]],
        elapsed_ms=1, warehouse='test', role='test', executed_at=datetime.now(UTC))
    previous = QueryPlan(metrics=['revenue'], dimensions=['nation_name'],
                         filters=[Filter(field='order_year', operator='eq', value=1995)],
                         sort=[Sort(field='revenue')], limit=5)
    answer = DataMindAgent(catalog, planner, executor).ask('who is first and second?', previous_plan=previous)
    assert answer.plan.limit == 2
    assert answer.query.parameters == (1995,)
    assert 'INDIA' in answer.summary and 'VIETNAM' in answer.summary
    assert answer.claims[1].row_indexes == [1]
    assert previous.limit == 5
    executor.execute.assert_called_once()
