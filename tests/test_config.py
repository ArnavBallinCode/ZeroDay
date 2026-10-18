from datamind.config import Settings


def test_snowflake_is_not_ready_with_template_values() -> None:
    settings = Settings(
        snowflake_account="your_org-your_account",
        snowflake_user="your_username",
    )

    assert not settings.snowflake_ready


def test_snowflake_is_ready_with_account_identifiers() -> None:
    settings = Settings(
        snowflake_account="acme-analytics",
        snowflake_user="DATAMIND_DEMO",
    )

    assert settings.snowflake_ready


def test_rotated_pat_takes_precedence_during_overlap() -> None:
    settings = Settings(snowflake_pat="old", snowflake_pat2="new")

    assert settings.active_snowflake_pat == "new"
