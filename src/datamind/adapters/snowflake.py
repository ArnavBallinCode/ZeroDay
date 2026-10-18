from __future__ import annotations

import time
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

import httpx
import snowflake.connector

from datamind.config import Settings
from datamind.core.models import CompiledQuery, QueryResult
from datamind.core.safety import validate_read_only


class SnowflakeExecutor:
    def __init__(
        self,
        settings: Settings,
        allowed_tables: set[str],
        database: str | None = None,
        schema: str | None = None,
    ):
        self.settings = settings
        self.allowed_tables = allowed_tables
        self.database = database or settings.snowflake_database
        self.schema = schema or settings.snowflake_schema

    def execute(self, query: CompiledQuery) -> QueryResult:
        validate_read_only(query.sql, self.allowed_tables)
        if self.settings.active_snowflake_pat:
            return self._execute_sql_api(query)
        return self._execute_connector(query)

    def _execute_connector(self, query: CompiledQuery) -> QueryResult:
        started = time.perf_counter()
        connection_args: dict[str, Any] = {
            "account": self.settings.snowflake_account,
            "user": self.settings.snowflake_user,
            "authenticator": self.settings.snowflake_authenticator,
            "warehouse": self.settings.snowflake_warehouse,
            "database": self.database,
            "schema": self.schema,
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

    def _execute_sql_api(self, query: CompiledQuery) -> QueryResult:
        started = time.perf_counter()
        statement = query.sql.replace("%s", "?")
        account = self.settings.snowflake_account.lower()
        url = f"https://{account}.snowflakecomputing.com/api/v2/statements"
        headers = {
            "Authorization": f"Bearer {self.settings.active_snowflake_pat}",
            "X-Snowflake-Authorization-Token-Type": "PROGRAMMATIC_ACCESS_TOKEN",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        body: dict[str, Any] = {
            "statement": statement,
            "timeout": self.settings.statement_timeout_seconds,
            "warehouse": self.settings.snowflake_warehouse,
            "database": self.database,
            "schema": self.schema,
            "role": self.settings.snowflake_role,
            "parameters": {
                "QUERY_TAG": "datamind:interactive:v0.1",
            },
        }
        if query.parameters:
            body["bindings"] = self._api_bindings(query.parameters)

        timeout = self.settings.statement_timeout_seconds + 10
        with httpx.Client(timeout=timeout) as client:
            response = client.post(url, headers=headers, json=body)
            payload = response.json()
            while response.status_code == 202:
                status_url = payload["statementStatusUrl"]
                response = client.get(f"https://{account}.snowflakecomputing.com{status_url}", headers=headers)
                payload = response.json()

        if not response.is_success or payload.get("sqlState") not in (None, "00000"):
            message = payload.get("message", "Snowflake SQL API request failed")
            raise RuntimeError(f"Snowflake SQL API: {message}")

        metadata = payload["resultSetMetaData"]
        row_types = metadata["rowType"]
        columns = [column["name"].lower() for column in row_types]
        rows = [
            [self._convert_api_value(value, column) for value, column in zip(row, row_types, strict=True)]
            for row in payload.get("data", [])[: self.settings.max_result_rows]
        ]
        return QueryResult(
            query_id=payload["statementHandle"],
            columns=columns,
            rows=rows,
            elapsed_ms=round((time.perf_counter() - started) * 1000),
            warehouse=self.settings.snowflake_warehouse,
            role=self.settings.snowflake_role,
            executed_at=datetime.now(UTC),
        )

    @staticmethod
    def _api_bindings(parameters: tuple[Any, ...]) -> dict[str, dict[str, Any]]:
        bindings: dict[str, dict[str, Any]] = {}
        for index, value in enumerate(parameters, start=1):
            if isinstance(value, bool):
                snowflake_type, encoded = "BOOLEAN", value
            elif isinstance(value, int):
                snowflake_type, encoded = "FIXED", str(value)
            elif isinstance(value, (float, Decimal)):
                snowflake_type, encoded = "REAL", str(value)
            else:
                snowflake_type, encoded = "TEXT", None if value is None else str(value)
            bindings[str(index)] = {"type": snowflake_type, "value": encoded}
        return bindings

    @staticmethod
    def _convert_api_value(value: Any, column: dict[str, Any]) -> Any:
        if value is None:
            return None
        data_type = column["type"].lower()
        if data_type == "fixed":
            return Decimal(value) if column.get("scale") else int(value)
        if data_type == "real":
            return Decimal(value)
        if data_type == "boolean":
            return str(value).lower() == "true"
        return value
