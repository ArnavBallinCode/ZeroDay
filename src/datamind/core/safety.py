from __future__ import annotations

import re
from typing import Any, Literal

import sqlglot
from pydantic import BaseModel, Field
from sqlglot import exp
from sqlglot.errors import SqlglotError


class GuardrailViolation(BaseModel):
    rule_id: str
    rule_name: str
    severity: Literal["block", "warn"]
    message: str
    category: str


class GuardrailRule(BaseModel):
    id: str
    name: str
    description: str
    category: Literal["ast", "allowlist", "injection", "complexity", "custom"]
    severity: Literal["block", "warn"] = "block"
    enabled: bool = True
    is_system: bool = True
    parameters: dict[str, Any] = Field(default_factory=dict)


class GuardrailEvaluationReport(BaseModel):
    passed: bool
    rules_checked: int
    violations: list[GuardrailViolation] = Field(default_factory=list)
    warnings: list[GuardrailViolation] = Field(default_factory=list)
    ast_type: str | None = None
    tables_detected: list[str] = Field(default_factory=list)
    joins_count: int = 0
    subqueries_count: int = 0
    has_limit: bool = False
    limit_value: int | None = None


class UnsafeQuery(ValueError):
    """Raised when generated SQL violates guardrail policies."""

    def __init__(self, message: str, violations: list[GuardrailViolation] | None = None) -> None:
        super().__init__(message)
        self.violations = violations or []


FORBIDDEN_NODES = (
    exp.Into,
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Create,
    exp.Drop,
    exp.Alter,
    exp.Command,
    exp.Merge,
    *( [exp.TruncateTable] if hasattr(exp, "TruncateTable") else [] ),
)


def validate_question(question: str) -> None:
    """Reject mutation commands before model planning or any coverage query."""
    normalized = re.sub(r'/\*.*?\*/', ' ', question, flags=re.DOTALL)
    command = re.search(
        r'\b(?:drop\s+(?:table|database|schema|view|role|user)|'
        r'truncate\s+(?:table\s+)?\w+|delete\s+from|insert\s+into|'
        r'update\s+[\w.\"]+\s+set|alter\s+(?:table|database|schema|user|role)|'
        r'create\s+(?:or\s+replace\s+)?(?:table|database|schema|view|user|role)|'
        r'merge\s+into|grant\s+\w+|revoke\s+\w+|execute\s+immediate)\b',
        normalized, re.IGNORECASE,
    )
    natural_mutation = re.search(
        r'^\s*(?:please\s+)?(?:delete|remove|erase|truncate|drop)\s+'
        r'(?:(?:all|the|every)\s+)*(?:data|rows|records|tables?|customers?|orders?)\b',
        normalized, re.IGNORECASE,
    )
    if command or natural_mutation:
        raise UnsafeQuery('This app supports read-only analytics. Requests to change or delete data are blocked before planning; no SQL was executed.')

DEFAULT_FORBIDDEN_KEYWORDS = [
    "SYSTEM$WAIT",
    "SLEEP",
    "BENCHMARK",
    "PG_SLEEP",
    "EXECUTE IMMEDIATE",
    "CALL",
    "LOAD",
    "UNLOAD",
]


def get_default_rules() -> list[GuardrailRule]:
    return [
        GuardrailRule(
            id="rule-single-select",
            name="Single SELECT Statement",
            description="Enforces that exactly one root SELECT statement is submitted, rejecting multi-statements or non-query commands.",
            category="ast",
            severity="block",
            enabled=True,
            is_system=True,
            parameters={},
        ),
        GuardrailRule(
            id="rule-no-mutation",
            name="Data Mutation Guard",
            description="Forbids DDL and DML operations (INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, MERGE) via AST parsing.",
            category="ast",
            severity="block",
            enabled=True,
            is_system=True,
            parameters={},
        ),
        GuardrailRule(
            id="rule-table-allowlist",
            name="Semantic Model Table Allowlist",
            description="Strictly confines table references to the allowlisted tables declared in the active semantic model catalog.",
            category="allowlist",
            severity="block",
            enabled=True,
            is_system=True,
            parameters={},
        ),
        GuardrailRule(
            id="rule-sql-injection",
            name="SQL Injection & Comment Guard",
            description="Detects comment injections (-- or /* */), stacked query injections (;), and boolean tautology patterns.",
            category="injection",
            severity="block",
            enabled=True,
            is_system=True,
            parameters={"block_comments": True, "block_tautologies": True},
        ),
        GuardrailRule(
            id="rule-max-joins",
            name="Maximum Table Joins",
            description="Limits the maximum number of JOIN operations in a single query to protect Snowflake warehouse compute budgets.",
            category="complexity",
            severity="block",
            enabled=True,
            is_system=True,
            parameters={"max_joins": 6},
        ),
        GuardrailRule(
            id="rule-max-subqueries",
            name="Subquery Nesting Depth",
            description="Restricts the count of nested subqueries to control plan compilation and AST traversal complexity.",
            category="complexity",
            severity="warn",
            enabled=True,
            is_system=True,
            parameters={"max_subqueries": 3},
        ),
        GuardrailRule(
            id="rule-enforce-limit",
            name="Row Ceiling & LIMIT Enforcement",
            description="Ensures result sets are bounded by a reasonable row ceiling to prevent accidental giant result sets.",
            category="complexity",
            severity="warn",
            enabled=True,
            is_system=True,
            parameters={"max_limit": 1000, "require_limit": False},
        ),
        GuardrailRule(
            id="rule-forbidden-keywords",
            name="Dialect Function Blacklist",
            description="Blocks hazardous Snowflake system procedures and delay routines (e.g., SYSTEM$WAIT, EXECUTE IMMEDIATE).",
            category="custom",
            severity="block",
            enabled=True,
            is_system=True,
            parameters={"keywords": list(DEFAULT_FORBIDDEN_KEYWORDS)},
        ),
    ]


class GuardrailsConfig(BaseModel):
    strict_mode: bool = True
    rules: list[GuardrailRule] = Field(default_factory=get_default_rules)

    def get_rule(self, rule_id: str) -> GuardrailRule | None:
        for r in self.rules:
            if r.id == rule_id:
                return r
        return None

    def add_rule(self, rule: GuardrailRule) -> None:
        self.rules = [r for r in self.rules if r.id != rule.id]
        self.rules.append(rule)

    def remove_rule(self, rule_id: str) -> bool:
        initial_len = len(self.rules)
        self.rules = [r for r in self.rules if r.id != rule_id]
        return len(self.rules) < initial_len

    def update_rule(self, rule_id: str, updates: dict[str, Any]) -> GuardrailRule | None:
        rule = self.get_rule(rule_id)
        if not rule:
            return None
        for key, value in updates.items():
            if hasattr(rule, key):
                setattr(rule, key, value)
        return rule

    def reset_to_defaults(self) -> None:
        self.rules = get_default_rules()
        self.strict_mode = True

    def evaluate(self, sql: str, allowed_tables: set[str]) -> GuardrailEvaluationReport:
        violations: list[GuardrailViolation] = []
        warnings: list[GuardrailViolation] = []
        rules_checked = 0

        # Normalise parameter markers for parsing
        parser_sql = sql.replace("%s", "?")

        # Extract statement and AST
        statements: list[exp.Expression] = []
        parse_error: str | None = None
        try:
            statements = sqlglot.parse(parser_sql, read="snowflake")
        except (SqlglotError, ValueError, TypeError) as exc:
            parse_error = str(exc)

        # Basic metadata
        statement = statements[0] if statements else None
        ast_type = type(statement).__name__ if statement else "None"
        tables_detected: list[str] = []
        joins_count = 0
        subqueries_count = 0
        has_limit = False
        limit_value: int | None = None

        if statement:
            tables_detected = sorted({t.name.upper() for t in statement.find_all(exp.Table) if t.name})
            joins_count = len(list(statement.find_all(exp.Join)))
            subqueries_count = len(list(statement.find_all(exp.Subquery)))
            limit_node = statement.find(exp.Limit)
            if limit_node:
                has_limit = True
                try:
                    limit_value = int(str(limit_node.expression.this))
                except (ValueError, AttributeError):
                    limit_value = None

        # Helper to record finding
        def record(rule: GuardrailRule, message: str) -> None:
            violation = GuardrailViolation(
                rule_id=rule.id,
                rule_name=rule.name,
                severity=rule.severity,
                message=message,
                category=rule.category,
            )
            if rule.id in {'rule-single-select', 'rule-no-mutation', 'rule-table-allowlist'}:
                violation.severity = 'block'
            if violation.severity == "block":
                violations.append(violation)
            else:
                warnings.append(violation)

        required_ids = {'rule-single-select', 'rule-no-mutation', 'rule-table-allowlist'}
        effective_rules = list(self.rules)
        effective_rules.extend(r for r in get_default_rules()
                               if r.id in required_ids and not self.get_rule(r.id))
        for rule in effective_rules:
            if not rule.enabled and rule.id not in {'rule-single-select', 'rule-no-mutation', 'rule-table-allowlist'}:
                continue
            rules_checked += 1

            # 1. Single SELECT Statement
            if rule.id == "rule-single-select":
                if parse_error or len(statements) != 1 or not isinstance(statement, exp.Select):
                    record(rule, "Exactly one SELECT statement is allowed")

            # 2. Data Mutation Guard
            elif rule.id == "rule-no-mutation":
                if statement:
                    mutations = [node for node in FORBIDDEN_NODES if statement.find(node) is not None]
                    if mutations:
                        names = ", ".join(m.__name__.upper() for m in mutations)
                        record(rule, f"Data-changing SQL is not allowed: detected {names}")

            # 3. Table Allowlist
            elif rule.id == "rule-table-allowlist":
                if statement:
                    allowed_upper = {name.upper() for name in allowed_tables}
                    disallowed = set(tables_detected) - allowed_upper
                    if disallowed:
                        record(rule, f"Query referenced tables outside the semantic model: {sorted(disallowed)}")

            # 4. SQL Injection & Stacking Guard
            elif rule.id == "rule-sql-injection":
                params = rule.parameters or {}
                if params.get("block_comments", True) and re.search(r"(--|/\*|\*/)", sql):
                    record(rule, "SQL comments (-- or /* */) are disallowed to prevent injection masking")
                if params.get("block_tautologies", True) and re.search(r"(?i)\b(WHERE|OR|AND)\s+['\"]?([a-zA-Z0-9_]+)['\"]?\s*=\s*['\"]?\2\b", sql):
                    record(rule, "Boolean tautology pattern (e.g. WHERE 1=1 or OR 1=1) detected")
                if len(statements) > 1:
                    record(rule, "Stacked SQL queries separated by semicolons are prohibited")

            # 5. Maximum Joins
            elif rule.id == "rule-max-joins":
                max_joins = int(rule.parameters.get("max_joins", 6))
                if joins_count > max_joins:
                    record(rule, f"Query has {joins_count} joins, exceeding the limit of {max_joins}")

            # 6. Maximum Subqueries
            elif rule.id == "rule-max-subqueries":
                max_sub = int(rule.parameters.get("max_subqueries", 3))
                if subqueries_count > max_sub:
                    record(rule, f"Query has {subqueries_count} subqueries, exceeding recommendation of {max_sub}")

            # 7. Row Ceiling & LIMIT Enforcement
            elif rule.id == "rule-enforce-limit":
                max_lim = int(rule.parameters.get("max_limit", 1000))
                req_lim = bool(rule.parameters.get("require_limit", False))
                if req_lim and not has_limit:
                    record(rule, "Query must contain an explicit LIMIT clause")
                elif has_limit and limit_value is not None and limit_value > max_lim:
                    record(rule, f"Query LIMIT ({limit_value}) exceeds maximum allowed ceiling of {max_lim}")

            # 8. Forbidden Keywords
            elif rule.id == "rule-forbidden-keywords":
                keywords = rule.parameters.get("keywords", DEFAULT_FORBIDDEN_KEYWORDS)
                for kw in keywords:
                    pattern = rf"\b{re.escape(kw)}\b"
                    if re.search(pattern, sql, re.IGNORECASE):
                        record(rule, f"Query contains forbidden keyword or function: {kw}")
                        break

            # 9. Custom Rules (Regex / Keyword based)
            else:
                regex_pat = rule.parameters.get("pattern")
                if regex_pat:
                    try:
                        if re.search(regex_pat, sql, re.IGNORECASE):
                            record(rule, f"Custom rule violation '{rule.name}': matched pattern {regex_pat}")
                    except re.error:
                        pass
                custom_kw = rule.parameters.get("keywords", [])
                for kw in custom_kw:
                    if re.search(rf"\b{re.escape(kw)}\b", sql, re.IGNORECASE):
                        record(rule, f"Custom rule violation '{rule.name}': contains blocked term '{kw}'")
                        break

        passed = len(violations) == 0
        return GuardrailEvaluationReport(
            passed=passed,
            rules_checked=rules_checked,
            violations=violations,
            warnings=warnings,
            ast_type=ast_type,
            tables_detected=tables_detected,
            joins_count=joins_count,
            subqueries_count=subqueries_count,
            has_limit=has_limit,
            limit_value=limit_value,
        )


# Global default configuration instance
_DEFAULT_GUARDRAILS = GuardrailsConfig()


def get_default_guardrails() -> GuardrailsConfig:
    return _DEFAULT_GUARDRAILS


def validate_read_only(
    sql: str,
    allowed_tables: set[str],
    guardrails: GuardrailsConfig | None = None,
    namespace: tuple[str, str] | None = None,
) -> None:
    config = guardrails or _DEFAULT_GUARDRAILS
    report = config.evaluate(sql, allowed_tables)
    if not report.passed:
        first_violation = report.violations[0]
        raise UnsafeQuery(first_violation.message, violations=report.violations)
    if namespace:
        database, schema = (part.upper() for part in namespace)
        statement = sqlglot.parse_one(sql.replace('%s', '?'), read='snowflake')
        for table in statement.find_all(exp.Table):
            if (table.catalog and table.catalog.upper() != database) or (
                table.db and table.db.upper() != schema
            ):
                raise UnsafeQuery('Query referenced a database or schema outside the active semantic model')
