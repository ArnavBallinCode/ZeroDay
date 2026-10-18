from __future__ import annotations

import sqlglot
from sqlglot import exp


class UnsafeQuery(ValueError):
    """Raised when generated SQL violates the read-only policy."""


FORBIDDEN_NODES = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Create,
    exp.Drop,
    exp.Alter,
    exp.Command,
    exp.Merge,
)


def validate_read_only(sql: str, allowed_tables: set[str]) -> None:
    statements = sqlglot.parse(sql, read="snowflake")
    if len(statements) != 1 or not isinstance(statements[0], exp.Select):
        raise UnsafeQuery("Exactly one SELECT statement is allowed")
    statement = statements[0]
    if any(statement.find(node) is not None for node in FORBIDDEN_NODES):
        raise UnsafeQuery("Data-changing SQL is not allowed")
    referenced = {table.name.upper() for table in statement.find_all(exp.Table)}
    disallowed = referenced - {name.upper() for name in allowed_tables}
    if disallowed:
        raise UnsafeQuery(f"Query referenced tables outside the semantic model: {sorted(disallowed)}")
