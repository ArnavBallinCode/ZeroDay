import pytest

from datamind.core.safety import (
    GuardrailsConfig,
    UnsafeQuery,
    validate_question,
    validate_read_only,
)


@pytest.mark.parametrize('question', [
    'DROP TABLE CUSTOMER; -- Test', 'Please delete all customer records',
    'DELETE FROM ORDERS', 'drop /* comment */ table CUSTOMER',
    'revenue last two years; DROP TABLE ORDERS', 'UPDATE CUSTOMER SET C_NAME=1',
])
def test_rejects_destructive_question(question):
    with pytest.raises(UnsafeQuery):
        validate_question(question)


@pytest.mark.parametrize('question', [
    'How much did revenue drop in 1995?', 'How many orders did each market segment place?',
    'Show customers with the largest revenue', 'What is the return rate?',
])
def test_allows_ordinary_analytics_language(question):
    validate_question(question)


def test_core_protections_cannot_be_disabled_or_removed():
    for config in [GuardrailsConfig(rules=[]), GuardrailsConfig()]:
        for rule in config.rules:
            rule.enabled = False
            rule.severity = 'warn'
        for sql in ['DROP TABLE CUSTOMER', 'SELECT * INTO X FROM CUSTOMER',
                    'SELECT * FROM SECRET', 'SELECT * FROM CUSTOMER; DELETE FROM CUSTOMER']:
            with pytest.raises(UnsafeQuery):
                validate_read_only(sql, {'CUSTOMER'}, config)


def test_rejects_same_table_name_in_other_dataset():
    with pytest.raises(UnsafeQuery, match='outside the active'):
        validate_read_only('SELECT * FROM DB.TPCH_SF10.ORDERS', {'ORDERS'},
                           namespace=('DB', 'TPCH_SF1'))


def test_allows_one_select_from_allowlisted_tables() -> None:
    validate_read_only("SELECT COUNT(*) FROM DB.SCHEMA.ORDERS", {"ORDERS"})


def test_allows_bound_parameter_markers() -> None:
    validate_read_only("SELECT COUNT(*) FROM ORDERS WHERE O_ORDERDATE >= %s", {"ORDERS"})


@pytest.mark.parametrize(
    "sql",
    [
        "DELETE FROM ORDERS",
        "SELECT * FROM ORDERS; SELECT * FROM CUSTOMER",
        "CREATE TABLE X AS SELECT * FROM ORDERS",
    ],
)
def test_rejects_non_read_only_or_multiple_statements(sql: str) -> None:
    with pytest.raises(UnsafeQuery):
        validate_read_only(sql, {"ORDERS", "CUSTOMER"})


def test_rejects_table_outside_semantic_model() -> None:
    with pytest.raises(UnsafeQuery, match="outside"):
        validate_read_only("SELECT * FROM ACCOUNT_USAGE.USERS", {"ORDERS"})


def test_guardrails_evaluation_report() -> None:
    from datamind.core.safety import GuardrailsConfig

    cfg = GuardrailsConfig()
    report = cfg.evaluate("SELECT O_ORDERKEY FROM ORDERS WHERE 1=1", {"ORDERS"})
    # Boolean tautology 1=1 should be caught by default injection rule
    assert not report.passed
    assert any("tautology" in v.message.lower() for v in report.violations)


def test_custom_rule_blocks_query() -> None:
    from datamind.core.safety import GuardrailRule, GuardrailsConfig

    cfg = GuardrailsConfig()
    custom = GuardrailRule(
        id="custom-no-wildcards",
        name="No Wildcard Projections",
        description="Prevent SELECT * queries",
        category="custom",
        severity="block",
        enabled=True,
        is_system=False,
        parameters={"pattern": r"SELECT\s+\*"},
    )
    cfg.add_rule(custom)

    report = cfg.evaluate("SELECT * FROM ORDERS", {"ORDERS"})
    assert not report.passed
    assert any(v.rule_id == "custom-no-wildcards" for v in report.violations)

    # With specific projection, it passes
    report2 = cfg.evaluate("SELECT O_ORDERKEY FROM ORDERS", {"ORDERS"})
    assert report2.passed


def test_disable_rule_allows_behavior() -> None:
    from datamind.core.safety import GuardrailsConfig

    cfg = GuardrailsConfig()
    # Disable SQL injection rule
    cfg.update_rule("rule-sql-injection", {"enabled": False})

    # Now a tautology passes through the injection rule
    report = cfg.evaluate("SELECT O_ORDERKEY FROM ORDERS WHERE 1=1", {"ORDERS"})
    assert report.passed


def test_max_joins_guardrail() -> None:
    from datamind.core.safety import GuardrailsConfig

    cfg = GuardrailsConfig()
    cfg.update_rule("rule-max-joins", {"parameters": {"max_joins": 1}})

    sql = "SELECT c.c_name FROM CUSTOMER c JOIN ORDERS o ON c.c_custkey = o.o_custkey JOIN LINEITEM l ON o.o_orderkey = l.l_orderkey"
    report = cfg.evaluate(sql, {"CUSTOMER", "ORDERS", "LINEITEM"})
    assert not report.passed
    assert any("exceeding the limit of 1" in v.message for v in report.violations)


def test_forbidden_keyword_guardrail() -> None:
    from datamind.core.safety import GuardrailsConfig

    cfg = GuardrailsConfig()
    sql = "SELECT SYSTEM$WAIT(5) FROM ORDERS"
    report = cfg.evaluate(sql, {"ORDERS"})
    assert not report.passed
    assert any("SYSTEM$WAIT" in v.message for v in report.violations)

