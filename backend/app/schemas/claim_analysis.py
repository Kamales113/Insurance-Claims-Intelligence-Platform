"""Schemas for AI-assisted Claim Analysis."""

from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from app.schemas.knowledge import RetrievalResult

SeverityLevel = Literal["info", "low", "medium", "high"]
EvidenceType = Literal["claim", "policy", "history", "document", "knowledge"]


class ClaimAnalysisFinding(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    severity: SeverityLevel

    model_config = ConfigDict(from_attributes=True)


class RiskSignal(BaseModel):
    title: str = Field(min_length=1)
    description: str = Field(min_length=1)
    severity: SeverityLevel

    model_config = ConfigDict(from_attributes=True)


class EvidenceItem(BaseModel):
    type: EvidenceType
    description: str = Field(min_length=1)
    source: str = Field(min_length=1)

    model_config = ConfigDict(from_attributes=True)


class ClaimAnalysisResponse(BaseModel):
    claim_id: str
    summary: str = Field(min_length=1)
    key_findings: list[ClaimAnalysisFinding]
    risk_signals: list[RiskSignal]
    recommendation: str = Field(min_length=1)
    evidence: list[EvidenceItem]
    sources: list[RetrievalResult]
    model: str = Field(default_factory=lambda: settings.GEMINI_MODEL)

    model_config = ConfigDict(from_attributes=True)
