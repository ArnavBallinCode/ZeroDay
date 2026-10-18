from pathlib import Path

import pytest

from datamind.core.catalog import SemanticCatalog
from datamind.core.compiler import InvalidPlan, QueryCompiler
from datamind.core.models import Filter, QueryPlan, Sort


@pytest.fixture
def compiler() -> QueryCompiler:
    return QueryCompiler(SemanticCatalog.load(Path("config/tpch.yml")))


def test_compiles_ranked_join_with_bound_dates(compiler: QueryCompiler) -> None:
    plan = QueryPlan(
        dimensions=["nation_name"],
        metrics=["revenue"],
        filters=[Filter(field="order_date", operator="between", value=["1995-01-01", "1995-12-31"])],
        sort=[Sort(field="revenue", direction="desc")],
        limit=5,
    )

    query = compiler.compile(plan)

    assert query.tables == ["LINEITEM", "ORDERS", "CUSTOMER", "NATION"]
    assert "LINEITEM.L_ORDERKEY = ORDERS.O_ORDERKEY" in query.sql
    assert "ORDERS.O_ORDERDATE BETWEEN %s AND %s" in query.sql
    assert 'ORDER BY "revenue" DESC' in query.sql
    assert query.parameters == ("1995-01-01", "1995-12-31")


def test_rejects_unknown_model_field(compiler: QueryCompiler) -> None:
    plan = QueryPlan(metrics=["revenue"], dimensions=["secret_salary"])

    with pytest.raises(InvalidPlan, match="Unknown semantic field"):
        compiler.compile(plan)


def test_rejects_unbounded_in_list(compiler: QueryCompiler) -> None:
    plan = QueryPlan(
        metrics=["order_count"],
        filters=[Filter(field="order_status", operator="in", value=list(range(101)))],
    )

    with pytest.raises(InvalidPlan, match="1-100"):
        compiler.compile(plan)
