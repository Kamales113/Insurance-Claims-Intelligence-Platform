from fastapi import APIRouter
from app.api.v1.endpoints import ai, assistant, auth, claim_analysis, claims, customers, documents, policies

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(policies.router, prefix="/policies", tags=["Policies"])
api_router.include_router(claims.router, prefix="/claims", tags=["Claims"])
api_router.include_router(claim_analysis.router, prefix="/claims", tags=["Claims"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["Assistant"])


