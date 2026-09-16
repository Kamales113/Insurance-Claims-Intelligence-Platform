from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.document import ClaimDocumentResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[ClaimDocumentResponse],
    status_code=200,
    summary="List documents",
    description="Metadata only document endpoint placeholder.",
)
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ClaimDocumentResponse]:
    return []
