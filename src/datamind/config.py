from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    snowflake_account: str = ""
    snowflake_user: str = ""
    snowflake_authenticator: str = "externalbrowser"
    snowflake_password: str = ""
    snowflake_pat: str = ""
    snowflake_pat2: str = ""
    snowflake_warehouse: str = "DATAMIND_WH"
    snowflake_database: str = "SNOWFLAKE_SAMPLE_DATA"
    snowflake_schema: str = "TPCH_SF1"
    snowflake_role: str = "DATAMIND_READER"
    ollama_base_url: str = "http://127.0.0.1:11434"
    gemma_model: str = "gemma2:2b"
    max_result_rows: int = Field(default=200, ge=1, le=1000)
    statement_timeout_seconds: int = Field(default=30, ge=5, le=120)

    @property
    def snowflake_ready(self) -> bool:
        account = self.snowflake_account.strip().lower()
        user = self.snowflake_user.strip().lower()
        placeholder_prefixes = ("your_", "organization-")
        return bool(account and user) and not any(
            value.startswith(placeholder_prefixes) for value in (account, user)
        )

    @property
    def active_snowflake_pat(self) -> str:
        return self.snowflake_pat2 or self.snowflake_pat
