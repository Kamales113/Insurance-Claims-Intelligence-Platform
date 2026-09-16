from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.agent import Agent
    from app.models.history import ClaimStatusHistory
    from app.models.document import ClaimDocument
    from app.models.claim import Claim


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="customer")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    customer: Mapped[Optional["Customer"]] = relationship("Customer", back_populates="user", uselist=False)
    agent: Mapped[Optional["Agent"]] = relationship("Agent", back_populates="user", uselist=False)
    assigned_claims: Mapped[List["Claim"]] = relationship("Claim", back_populates="assigned_agent")
    status_histories_created: Mapped[List["ClaimStatusHistory"]] = relationship(
        "ClaimStatusHistory", back_populates="changed_by_user"
    )
    documents_uploaded: Mapped[List["ClaimDocument"]] = relationship("ClaimDocument", back_populates="uploaded_by_user")
