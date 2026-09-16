from app.schemas.auth import LoginRequest, AuthResponse
from app.schemas.user import UserResponse
from app.schemas.customer import (
    CustomerResponse,
    CustomerWithProfileResponse,
    CustomerClaimSummaryResponse,
)
from app.schemas.agent import AgentResponse, AgentClaimSummaryResponse
from app.schemas.policy import PolicyResponse, PolicyWithCustomerResponse
from app.schemas.claim import (
    ClaimCreate,
    ClaimStatusUpdate,
    ClaimResponse,
    ClaimWithPolicyResponse,
    AgentClaimWithCustomerResponse,
)
from app.schemas.history import ClaimStatusHistoryResponse
from app.schemas.document import ClaimDocumentResponse

__all__ = [
    "LoginRequest",
    "AuthResponse",
    "UserResponse",
    "CustomerResponse",
    "CustomerWithProfileResponse",
    "CustomerClaimSummaryResponse",
    "AgentResponse",
    "AgentClaimSummaryResponse",
    "PolicyResponse",
    "PolicyWithCustomerResponse",
    "ClaimCreate",
    "ClaimStatusUpdate",
    "ClaimResponse",
    "ClaimWithPolicyResponse",
    "AgentClaimWithCustomerResponse",
    "ClaimStatusHistoryResponse",
    "ClaimDocumentResponse",
]
