from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass(frozen=True)
class FieldSpec:
    name: str
    expression: str
    table: str
    description: str
    kind: str


class SemanticCatalog:
    def __init__(self, raw: dict[str, Any]):
        self.raw = raw
        self.name: str = raw["name"]
        self.database: str = raw["database"]
        self.schema: str = raw["schema"]
        self.tables: dict[str, dict[str, Any]] = raw["tables"]
        self.joins: list[dict[str, str]] = raw.get("joins", [])
        self.dimensions = self._load_fields("dimensions", "dimension")
        self.metrics = self._load_fields("metrics", "metric")

    @classmethod
    def load(cls, path: str | Path) -> "SemanticCatalog":
        with Path(path).open(encoding="utf-8") as handle:
            raw = yaml.safe_load(handle)
        return cls(raw)

    def _load_fields(self, key: str, kind: str) -> dict[str, FieldSpec]:
        return {
            name: FieldSpec(
                name=name,
                expression=value["expression"],
                table=value["table"],
                description=value["description"],
                kind=kind,
            )
            for name, value in self.raw[key].items()
        }

    def field(self, name: str) -> FieldSpec:
        if name in self.dimensions:
            return self.dimensions[name]
        if name in self.metrics:
            return self.metrics[name]
        raise KeyError(f"Unknown semantic field: {name}")

    def prompt_schema(self) -> dict[str, Any]:
        return {
            "dataset": self.name,
            "description": self.raw.get("description", ""),
            "dimensions": {k: v.description for k, v in self.dimensions.items()},
            "metrics": {k: v.description for k, v in self.metrics.items()},
            "examples": self.raw.get("examples", []),
        }
