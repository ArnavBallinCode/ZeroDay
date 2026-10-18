from datetime import UTC, datetime
from unittest.mock import Mock

import pytest

from datamind.core.agent import DataMindAgent, NeedsClarification
from datamind.core.catalog import SemanticCatalog
from datamind.core.models import Filter, QueryPlan, QueryResult, Sort
from datamind.core.safety import UnsafeQuery


@pytest.mark.parametrize('dataset', ['tpch', 'tpch_sf10', 'ecommerce'])
def test_blocked_request_never_calls_model_or_snowflake(dataset):
    planner, executor = Mock(), Mock()
    agent = DataMindAgent(SemanticCatalog.load(f'config/{dataset}.yml'), planner, executor)
    with pytest.raises(UnsafeQuery):
        agent.ask('DROP TABLE CUSTOMER; -- Test last two years')
    planner.plan.assert_not_called()
    executor.execute.assert_not_called()


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


def test_vague_last_years_defaults_to_latest_two_and_honors_rank_count():
    catalog = SemanticCatalog.load('config/tpch_sf10.yml')
    planner = Mock(model='gemma2:2b', temperature=0)
    planner.plan.return_value = QueryPlan(
        dataset='tpch', dimensions=['nation_name'], metrics=['revenue'], limit=20)
    planner.explain.return_value = 'Ranked result.'
    executor = Mock(guardrails=None, allowed_tables=set(catalog.tables))
    executor.execute.side_effect = [
        QueryResult(query_id='coverage', columns=['order_year', 'order_count'], rows=[[1998, 1]],
                    elapsed_ms=1, warehouse='test', role='test', executed_at=datetime.now(UTC)),
        QueryResult(query_id='answer', columns=['nation_name', 'revenue'], rows=[['VIETNAM', 10]],
                    elapsed_ms=1, warehouse='test', role='test', executed_at=datetime.now(UTC)),
    ]
    answer = DataMindAgent(catalog, planner, executor).ask(
        'Which five customer nations generated the max revenue in the last years')
    assert answer.plan.limit == 5
    assert answer.plan.sort[0].field == 'revenue'
    assert answer.query.parameters == (1997, 1998)


def test_supplier_balance_uses_supplier_geography_and_real_balance_metric():
    catalog = SemanticCatalog.load('config/tpch_sf10.yml')
    planner = Mock(model='gemma2:2b', temperature=0)
    planner.plan.return_value = QueryPlan(
        dataset='tpch', dimensions=['supplier_name', 'nation_name'], metrics=['supply_cost'],
        filters=[Filter(
            field='supplier_nation_name', operator='in', value=['Germany', 'France', 'UK'])],
        sort=[Sort(field='supply_cost')], limit=20)
    planner.explain.return_value = 'Supplier balance ranking.'
    executor = Mock(guardrails=None, allowed_tables=set(catalog.tables))
    executor.execute.return_value = QueryResult(
        query_id='supplier-answer', columns=['supplier_name', 'supplier_account_balance'],
        rows=[['Supplier#1', 9999]], elapsed_ms=1, warehouse='test', role='test',
        executed_at=datetime.now(UTC))

    answer = DataMindAgent(catalog, planner, executor).ask(
        'Show top suppliers by account balance in Europe')

    assert answer.plan.dimensions == ['supplier_name']
    assert answer.plan.metrics == ['supplier_account_balance']
    assert answer.plan.filters == [
        Filter(field='supplier_region_name', operator='eq', value='EUROPE')]
    assert answer.plan.sort == [Sort(field='supplier_account_balance', direction='desc')]
    assert answer.plan.limit == 10
    assert 'SUPPLIER.S_ACCTBAL' in answer.query.sql
    assert 'SUPPLIER_REGION.R_NAME' in answer.query.sql
    assert answer.query.parameters == ('EUROPE',)


def test_undefined_loss_requests_clarification_without_execution():
    catalog = SemanticCatalog.load('config/tpch_sf10.yml')
    planner = Mock(model='gemma2:2b', temperature=0)
    planner.plan.return_value = QueryPlan(metrics=['loss'], dimensions=['supplier_name'])
    executor = Mock(guardrails=None, allowed_tables=set(catalog.tables))

    with pytest.raises(NeedsClarification, match="'Loss' is not defined") as exc:
        DataMindAgent(catalog, planner, executor).ask('Who has the max loss?')

    assert len(exc.value.suggested_questions) == 3
    executor.execute.assert_not_called()


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


def test_plan_is_scoped_to_active_compatible_catalog():
    catalog = SemanticCatalog.load('config/tpch_sf10.yml')
    planner = Mock(model='gemma2:2b', temperature=0)
    # Small models commonly emit the base TPC-H name even when SF10 is active.
    planner.plan.return_value = QueryPlan(
        dataset='tpch', dimensions=['customer_segment'], metrics=['order_count'])
    planner.explain.return_value = 'Five market segments were returned.'
    executor = Mock(guardrails=None, allowed_tables=set(catalog.tables))
    executor.execute.return_value = QueryResult(
        query_id='sf10-live', columns=['customer_segment', 'order_count'],
        rows=[['BUILDING', 3000000]], elapsed_ms=1, warehouse='test', role='test',
        executed_at=datetime.now(UTC))

    answer = DataMindAgent(catalog, planner, executor).ask(
        'How many orders did each market segment place?')

    assert answer.plan.dataset == 'tpch_sf10'
    assert 'SNOWFLAKE_SAMPLE_DATA.TPCH_SF10.ORDERS' in answer.query.sql
    assert answer.result.query_id == 'sf10-live'
    assert any('active semantic model' in item for item in answer.plan.assumptions)


def test_vague_superlative_best_customer_requires_clarification():
    catalog = SemanticCatalog.load('config/tpch.yml')
    planner, executor = Mock(), Mock()
    planner.plan.return_value = QueryPlan(dimensions=['customer_name'], metrics=['revenue'])
    agent = DataMindAgent(catalog, planner, executor)
    with pytest.raises(NeedsClarification) as exc_info:
        agent.ask('who are the best customers')
    assert 'ambiguous without specifying a metric' in exc_info.value.message
    assert len(exc_info.value.suggested_questions) >= 2
    executor.execute.assert_not_called()

