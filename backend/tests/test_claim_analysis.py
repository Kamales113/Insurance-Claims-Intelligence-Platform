import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.ai.llm_client import AIConfigurationError, AIProviderError
from app.models.claim import Claim
from app.models.history import ClaimStatusHistory
from app.schemas.claim_analysis import ClaimAnalysisResponse
from app.schemas.knowledge import RetrievalResult
from app.services.claim_analysis_service import analyze_claim


class MockClaimAnalysisLLMClient:
    def __init__(self, json_data: dict | None = None):
        self.last_prompt = None
        self.json_data = json_data or {
            "summary": "Vehicle collision claim under Auto Comprehensive policy guidelines.",
            "key_findings": [
                {
                    "title": "Coverage eligibility",
                    "description": "Collision damage is a listed coverage under Auto Comprehensive guidelines.",
                    "severity": "info",
                }
            ],
            "risk_signals": [
                {
                    "title": "High claim amount",
                    "description": "Claim amount exceeds standard fast-track processing limit.",
                    "severity": "medium",
                }
            ],
            "recommendation": "Proceed to agent review.",
            "evidence": [
                {
                    "type": "claim",
                    "description": "Collision damage reported for $5000.",
                    "source": "claim record",
                }
            ],
        }

    async def generate_json(self, prompt: str) -> dict:
        self.last_prompt = prompt
        return self.json_data

    async def generate_embedding(self, text: str) -> list[float]:
        return [0.1] * 16

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        return [[0.1] * 16 for _ in texts]


def sample_retrieval_sources() -> list[RetrievalResult]:
    return [
        RetrievalResult(
            document_id="auto-comprehensive-coverage",
            policy_type="Auto Comprehensive",
            title="Auto Comprehensive Demo Coverage",
            category="coverage",
            content="Auto Comprehensive guidelines cover accidental collision damage.",
            source="demo-policy-guidelines",
            similarity=0.88,
        )
    ]


# ---------------------------------------------------------------------------
# 1. Authorization Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_claim_analysis_unauthenticated_rejected(client: AsyncClient):
    response = await client.post("/api/v1/claims/clm_001/ai-analysis")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_claim_analysis_customer_forbidden(client: AsyncClient):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "customer@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post("/api/v1/claims/clm_001/ai-analysis", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Operation not permitted for current user role."


@pytest.mark.asyncio
async def test_claim_analysis_missing_claim_returns_404(client: AsyncClient):
    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post("/api/v1/claims/non_existent_claim/ai-analysis", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Claim not found"


# ---------------------------------------------------------------------------
# 2. Service & Context Gathering Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_analyze_claim_service_gathers_context_and_validates_response(db_session, monkeypatch):
    mock_llm = MockClaimAnalysisLLMClient()

    async def fake_retrieve(query, policy_type=None, top_k=5, llm_client=None, embedding_service=None):
        return sample_retrieval_sources()

    monkeypatch.setattr("app.services.claim_analysis_service.retrieve", fake_retrieve)

    # Use first available claim from test seed
    res = await db_session.execute(select(Claim))
    claim = res.scalars().first()
    assert claim is not None

    result = await analyze_claim(db=db_session, claim_id=claim.id, llm_client=mock_llm)

    assert isinstance(result, ClaimAnalysisResponse)
    assert result.claim_id == claim.id
    assert result.recommendation == "Proceed to agent review."
    assert len(result.key_findings) == 1
    assert result.key_findings[0].severity == "info"
    assert len(result.risk_signals) == 1
    assert result.risk_signals[0].severity == "medium"
    assert len(result.sources) == 1
    assert result.sources[0].document_id == "auto-comprehensive-coverage"

    # Verify context reached LLM prompt
    assert mock_llm.last_prompt is not None
    assert f"Claim ID: {claim.id}" in mock_llm.last_prompt
    assert "POLICY CONTEXT:" in mock_llm.last_prompt
    assert "RETRIEVED POLICY KNOWLEDGE GUIDELINES:" in mock_llm.last_prompt


# ---------------------------------------------------------------------------
# 3. Read-Only Boundary & Immutability Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_claim_analysis_is_read_only_and_does_not_mutate_workflow(db_session, monkeypatch):
    mock_llm = MockClaimAnalysisLLMClient()

    async def fake_retrieve(query, policy_type=None, top_k=5, llm_client=None, embedding_service=None):
        return sample_retrieval_sources()

    monkeypatch.setattr("app.services.claim_analysis_service.retrieve", fake_retrieve)

    res = await db_session.execute(select(Claim))
    claim = res.scalars().first()
    claim_id = str(claim.id)
    initial_status = str(claim.status)

    hist_res = await db_session.execute(
        select(ClaimStatusHistory).where(ClaimStatusHistory.claim_id == claim_id)
    )
    initial_history_count = len(hist_res.scalars().all())

    # Invoke claim analysis
    await analyze_claim(db=db_session, claim_id=claim_id, llm_client=mock_llm)

    # Re-fetch claim and history
    db_session.expire_all()
    res_after = await db_session.execute(select(Claim).where(Claim.id == claim_id))
    claim_after = res_after.scalars().first()

    hist_after = await db_session.execute(
        select(ClaimStatusHistory).where(ClaimStatusHistory.claim_id == claim_id)
    )
    history_after_count = len(hist_after.scalars().all())

    # Assert 100% read-only compliance
    assert claim_after.status == initial_status
    assert history_after_count == initial_history_count



# ---------------------------------------------------------------------------
# 4. Error Handling Tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_claim_analysis_endpoint_handles_unconfigured_ai(client: AsyncClient, monkeypatch):
    async def fake_analyze_claim(db, claim_id):
        raise AIConfigurationError("AI service is not configured.")

    monkeypatch.setattr("app.api.v1.endpoints.claim_analysis.analyze_claim", fake_analyze_claim)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post("/api/v1/claims/clm_001/ai-analysis", headers=headers)
    assert response.status_code == 503
    assert response.json() == {"detail": "AI service is not configured."}


@pytest.mark.asyncio
async def test_claim_analysis_endpoint_handles_provider_failure(client: AsyncClient, monkeypatch):
    async def fake_analyze_claim(db, claim_id):
        raise AIProviderError("AI service is temporarily unavailable.")

    monkeypatch.setattr("app.api.v1.endpoints.claim_analysis.analyze_claim", fake_analyze_claim)

    login = await client.post(
        "/api/v1/auth/login",
        json={"email": "agent@demo.com", "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {login.json()['token']}"}

    response = await client.post("/api/v1/claims/clm_001/ai-analysis", headers=headers)
    assert response.status_code == 502
    assert response.json() == {"detail": "AI service is temporarily unavailable."}
