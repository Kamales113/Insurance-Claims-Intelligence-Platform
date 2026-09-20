import json
import inspect

import pytest
from pydantic import ValidationError

from app.ai.knowledge_loader import (
    KNOWLEDGE_FILE_PATH,
    KnowledgeLoadError,
    load_knowledge_base,
    load_knowledge_documents,
)
from app.ai import knowledge_loader
from app.schemas.knowledge import KnowledgeDocument

EXPECTED_POLICY_TYPES = {
    "Auto Comprehensive",
    "Homeowners Protection",
    "Individual Health Premier",
    "Auto Liability",
    "Commercial Property",
}
REQUIRED_DOCUMENT_FIELDS = {
    "id",
    "policy_type",
    "title",
    "content",
    "category",
    "source",
}


def valid_document_data() -> dict:
    return {
        "id": "demo-policy-document",
        "policy_type": "Auto Comprehensive",
        "title": "Demo Policy Document",
        "content": "A standalone demo policy passage for validation.",
        "category": "coverage",
        "source": "demo-policy-guidelines",
    }


def test_knowledge_file_loads_and_returns_documents():
    knowledge_base = load_knowledge_base()
    documents = load_knowledge_documents()

    assert knowledge_base.knowledge_base_version == "1.0"
    assert documents == knowledge_base.documents
    assert len(documents) == 25


def test_every_current_policy_type_has_knowledge_documents():
    policy_types = {document.policy_type for document in load_knowledge_documents()}

    assert EXPECTED_POLICY_TYPES <= policy_types


def test_knowledge_json_documents_have_required_metadata():
    raw_knowledge = json.loads(KNOWLEDGE_FILE_PATH.read_text(encoding="utf-8"))

    for document in raw_knowledge["documents"]:
        assert REQUIRED_DOCUMENT_FIELDS <= document.keys()
        assert all(document[field] for field in REQUIRED_DOCUMENT_FIELDS)


def test_valid_knowledge_document_is_accepted():
    document = KnowledgeDocument.model_validate(valid_document_data())

    assert document.id == "demo-policy-document"


@pytest.mark.parametrize(
    "field,value",
    [
        ("id", ""),
        ("content", ""),
        ("category", "not-a-category"),
    ],
)
def test_invalid_knowledge_document_is_rejected(field: str, value: str):
    data = valid_document_data()
    data[field] = value

    with pytest.raises(ValidationError):
        KnowledgeDocument.model_validate(data)


def test_loader_fails_clearly_for_missing_file(tmp_path):
    missing_file = tmp_path / "missing.json"

    with pytest.raises(KnowledgeLoadError, match="Knowledge file not found"):
        load_knowledge_base(missing_file)


def test_loader_fails_clearly_for_malformed_json(tmp_path):
    malformed_file = tmp_path / "malformed.json"
    malformed_file.write_text("{not valid json", encoding="utf-8")

    with pytest.raises(KnowledgeLoadError, match="invalid JSON"):
        load_knowledge_base(malformed_file)


def test_loader_has_no_openai_http_or_database_dependencies():
    loader_source = inspect.getsource(knowledge_loader)

    for prohibited_dependency in ("google", "genai", "openai", "httpx", "requests", "sqlalchemy"):
        assert prohibited_dependency not in loader_source
