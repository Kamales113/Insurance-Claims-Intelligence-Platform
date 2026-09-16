# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.customer import Customer  # noqa
from app.models.agent import Agent  # noqa
from app.models.policy import Policy  # noqa
from app.models.claim import Claim  # noqa
from app.models.history import ClaimStatusHistory  # noqa
from app.models.document import ClaimDocument  # noqa
