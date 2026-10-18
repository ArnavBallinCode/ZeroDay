from decimal import Decimal

from datamind.adapters.snowflake import SnowflakeExecutor


def test_sql_api_bindings_preserve_types_and_positions() -> None:
    assert SnowflakeExecutor._api_bindings(("INDIA", 1995, Decimal("12.50"), True)) == {
        "1": {"type": "TEXT", "value": "INDIA"},
        "2": {"type": "FIXED", "value": "1995"},
        "3": {"type": "REAL", "value": "12.50"},
        "4": {"type": "BOOLEAN", "value": True},
    }


def test_sql_api_values_restore_numeric_types() -> None:
    assert SnowflakeExecutor._convert_api_value("42", {"type": "fixed", "scale": 0}) == 42
    assert SnowflakeExecutor._convert_api_value("12.50", {"type": "fixed", "scale": 2}) == Decimal(
        "12.50"
    )
    assert SnowflakeExecutor._convert_api_value("3.14", {"type": "real"}) == Decimal("3.14")
