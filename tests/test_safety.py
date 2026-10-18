import pytest

from datamind.core.safety import UnsafeQuery, validate_read_only


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
