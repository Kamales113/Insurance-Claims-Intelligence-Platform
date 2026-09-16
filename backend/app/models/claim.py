from datetime import date, datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.policy import Policy
    from app.models.user import User
    from app.models.history import ClaimStatusHistory
    from app.models.document import ClaimDocument


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    claim_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    policy_id: Mapped[str] = mapped_column(String(64), ForeignKey("policies.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="SUBMITTED")
    incident_date: Mapped[date] = mapped_column(Date, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    claim_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    assigned_agent_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="claims")
    policy: Mapped["Policy"] = relationship("Policy", back_populates="claims")
    assigned_agent: Mapped[Optional["User"]] = relationship("User", back_populates="assigned_claims")
    status_history: Mapped[List["ClaimStatusHistory"]] = relationship("ClaimStatusHistory", back_populates="claim")
    documents: Mapped[List["ClaimDocument"]] = relationship("ClaimDocument", back_populates="claim")
