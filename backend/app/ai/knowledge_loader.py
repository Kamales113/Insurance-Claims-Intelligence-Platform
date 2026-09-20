"""Deterministic loader for the version-controlled demo policy knowledge base."""

import json
from pathlib import Path

from pydantic import ValidationError

from app.schemas.knowledge import KnowledgeBase, KnowledgeDocument

KNOWLEDGE_FILE_PATH = (
    Path(__file__).resolve().parents[2] / "knowledge" / "insurance_policy_knowledge.json"
)


class KnowledgeLoadError(Exception):
    """Raised when the local demo knowledge source cannot be loaded safely."""


def load_knowledge_base(path: Path | None = None) -> KnowledgeBase:
    """Load and validate the local knowledge JSON without external dependencies."""
    knowledge_path = path or KNOWLEDGE_FILE_PATH
    try:
        payload = json.loads(knowledge_path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise KnowledgeLoadError(f"Knowledge file not found: {knowledge_path}") from exc
    except json.JSONDecodeError as exc:
        raise KnowledgeLoadError("Knowledge file contains invalid JSON.") from exc
    except OSError as exc:
        raise KnowledgeLoadError("Knowledge file could not be read.") from exc

    try:
        return KnowledgeBase.model_validate(payload)
    except ValidationError as exc:
        raise KnowledgeLoadError("Knowledge file has an invalid structure.") from exc


def load_knowledge_documents(path: Path | None = None) -> list[KnowledgeDocument]:
    """Return validated documents for a future retrieval implementation."""
    return load_knowledge_base(path).documents
