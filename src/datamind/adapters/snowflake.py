from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Any

import snowflake.connector

from datamind.config import Settings
from datamind.core.models import CompiledQuery, QueryResult
from datamind.core.safety import validate_read_only


class SnowflakeExecutor:
    def __init__(self, settings: Settings, allowed_tables: set[str]):
        self.settings = settings
        self.allowed_tables = allowed_tables

    def execute(self, query: CompiledQuery) -> QueryResult:
        validate_read_only(query.sql, self.allowed_tables)
        started = time.perf_counter()
        connection_args: dict[str, Any] = {
            "account": self.settings.snowflake_account,
            "user": self.settings.snowflake_user,
            "authenticator": self.settings.snowflake_authenticator,
            "warehouse": self.settings.snowflake_warehouse,
            "database": self.settings.snowflake_database,
            "schema": self.settings.snowflake_schema,
            "role": self.settings.snowflake_role,
            "session_parameters": {
                "QUERY_TAG": "datamind:interactive:v0.1",
                "STATEMENT_TIMEOUT_IN_SECONDS": self.settings.statement_timeout_seconds,
            },
        }
        if self.settings.snowflake_authenticator == "snowflake":
            connection_args["password"] = self.settings.snowflake_password

        with (
            snowflake.connector.connect(**connection_args) as connection,
            connection.cursor() as cursor,
        ):
            cursor.execute(query.sql, query.parameters)
            rows = cursor.fetchmany(self.settings.max_result_rows)
            columns = [item[0].lower() for item in cursor.description]
            query_id = cursor.sfqid

        return QueryResult(
            query_id=query_id,
            columns=columns,
            rows=[list(row) for row in rows],
            elapsed_ms=round((time.perf_counter() - started) * 1000),
            warehouse=self.settings.snowflake_warehouse,
            role=self.settings.snowflake_role,
            executed_at=datetime.now(UTC),
        )
