"""Service for AI-assisted claim analysis generation."""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from app.ai.embedding_service import EmbeddingService, get_embedding_service
from app.ai.llm_client import AIProviderError, LLMClient, get_llm_client
from app.ai.retrieval import retrieve
from app.core.config import settings
from app.models.claim import Claim
from app.models.customer import Customer
from app.models.policy import Policy
from app.schemas.claim_analysis import (
    ClaimAnalysisFinding,
    ClaimAnalysisResponse,
    EvidenceItem,
    RiskSignal,
)
from app.services.claim_service import get_claim_documents, get_claim_history, get_claim_model_by_id

CLAIM_ANALYSIS_SYSTEM_PROMPT = """You are an AI assistant supporting a human insurance claims agent for a demonstration Insurance Claims Intelligence Platform.

Analyze ONLY the provided claim, policy, status history, document, and policy-knowledge context below.

Rules:
- You are an ASSISTANT to the human agent. Do NOT make a binding claim approval or rejection decision.
- Do not invent facts, fabricate policy clauses, or assume missing documentation exists.
- Clearly distinguish observed facts, policy-context observations, potential concerns, and missing information.
- Use controlled severity values ONLY: "info", "low", "medium", "high".
- The recommendation must be informational for human review (e.g., "Proceed to agent review", "Additional documentation recommended", "Manual investigation recommended").
- Output valid JSON ONLY with the exact structure:
{
  "summary": "...",
  "key_findings": [
    {"title": "...", "description": "...", "severity": "info" | "low" | "medium" | "high"}
  ],
  "risk_signals": [
    {"title": "...", "description": "...", "severity": "info" | "low" | "medium" | "high"}
  ],
  "recommendation": "...",
  "evidence": [
    {"type": "claim" | "policy" | "history" | "document" | "knowledge", "description": "...", "source": "..."}
  ]
}"""


def build_analysis_context(
    claim: Claim,
    policy: Policy,
    customer_name: str,
    history_count: int,
    document_count: int,
    knowledge_sources: list,
) -> str:
    knowledge_str = "\n".join(
        [f"- [{s.category}] {s.title}: {s.content}" for s in knowledge_sources]
    ) or "No specific policy guidelines retrieved."

    return (
        f"CLAIM CONTEXT:\n"
        f"- Claim ID: {claim.id}\n"
        f"- Claim Number: {claim.claim_number}\n"
        f"- Status: {claim.status}\n"
        f"- Claim Amount: ${claim.claim_amount}\n"
        f"- Incident Date: {claim.incident_date}\n"
        f"- Submitted At: {claim.submitted_at}\n"
        f"- Description: {claim.description}\n\n"
        f"POLICY CONTEXT:\n"
        f"- Policy Number: {policy.policy_number}\n"
        f"- Policy Type: {policy.type}\n"
        f"- Policyholder: {customer_name}\n"
        f"- Policy Status: {policy.status}\n"
        f"- Policy Start/End: {policy.start_date} to {policy.end_date}\n"
        f"- Coverage Limit: ${policy.coverage_amount}\n"
        f"- Annual Premium: ${policy.premium}\n\n"
        f"CLAIM HISTORY:\n"
        f"- Total Status Transitions: {history_count}\n\n"
        f"CLAIM DOCUMENTS:\n"
        f"- Total Documents Attached: {document_count}\n\n"
        f"RETRIEVED POLICY KNOWLEDGE GUIDELINES:\n"
        f"{knowledge_str}"
    )


async def analyze_claim(
    db: AsyncSession,
    claim_id: str,
    llm_client: Optional[LLMClient] = None,
    embedding_service: Optional[EmbeddingService] = None,
) -> ClaimAnalysisResponse:
    """Analyze a claim and generate structured AI findings for an agent."""
    claim = await get_claim_model_by_id(db, claim_id)
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found"
        )

    # Load associated policy
    pol_res = await db.execute(select(Policy).where(Policy.id == claim.policy_id))
    policy = pol_res.scalars().first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Associated policy not found"
        )

    # Load customer details
    cust_res = await db.execute(
        select(Customer).options(selectinload(Customer.user)).where(Customer.id == claim.customer_id)
    )
    customer = cust_res.scalars().first()
    user = customer.user if customer else None
    customer_name = f"{user.first_name} {user.last_name}" if user else "Policyholder"

    # Load history and document metadata
    history = await get_claim_history(db, claim_id)
    documents = await get_claim_documents(db, claim_id)

    # Retrieve relevant policy knowledge
    client = llm_client or get_llm_client()
    emb_service = embedding_service or get_embedding_service()

    knowledge_query = f"{policy.type} claim guideline: {claim.description}"
    sources = await retrieve(
        query=knowledge_query,
        policy_type=policy.type,
        top_k=5,
        llm_client=client,
        embedding_service=emb_service,
    )

    # Construct context & prompt
    context_str = build_analysis_context(
        claim=claim,
        policy=policy,
        customer_name=customer_name,
        history_count=len(history),
        document_count=len(documents),
        knowledge_sources=sources,
    )

    prompt = f"{CLAIM_ANALYSIS_SYSTEM_PROMPT}\n\nDATA CONTEXT:\n{context_str}"

    # Generate structured JSON from LLM
    raw_json = await client.generate_json(prompt)

    # Build default structured evidence if missing
    default_evidence = [
        EvidenceItem(
            type="claim",
            description=f"Claim #{claim.claim_number} submitted for ${claim.claim_amount} on {claim.incident_date}.",
            source="claim record",
        ),
        EvidenceItem(
            type="policy",
            description=f"Policy #{policy.policy_number} ({policy.type}) with coverage limit ${policy.coverage_amount}.",
            source="policy record",
        ),
        EvidenceItem(
            type="history",
            description=f"Claim status is currently {claim.status} with {len(history)} transition log(s).",
            source="claim status history",
        ),
        EvidenceItem(
            type="document",
            description=f"{len(documents)} document(s) uploaded for verification.",
            source="claim document registry",
        ),
    ]

    try:
        raw_json["claim_id"] = claim_id
        raw_json["sources"] = [s.model_dump() for s in sources]
        if "evidence" not in raw_json or not raw_json["evidence"]:
            raw_json["evidence"] = [e.model_dump() for e in default_evidence]
        if "model" not in raw_json:
            raw_json["model"] = settings.GEMINI_MODEL

        return ClaimAnalysisResponse.model_validate(raw_json)
    except Exception as exc:
        raise AIProviderError("AI service returned malformed structured analysis output.") from exc
