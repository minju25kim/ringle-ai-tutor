from pydantic import BaseModel
from typing import Literal, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class CustomerType(str, Enum):
    B2B = "B2B"
    B2C = "B2C"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    SUSPENDED = "suspended"

class FeatureLimit(BaseModel):
    conversation: Optional[int]  # e.g. 20 or None (for unlimited)
    analysis: Optional[int]      # e.g. 5 or None

class FeatureUsage(BaseModel):
    conversation: int = 0
    analysis: int = 0

class MembershipTemplate(BaseModel):
    id: str
    name: str
    customer_type: CustomerType
    duration_days: int
    limits: FeatureLimit
    price: Optional[float] = None  # For B2C templates
    is_active: bool = True

class MembershipTemplateCreate(BaseModel):
    name: str
    customer_type: CustomerType
    duration_days: int
    limits: FeatureLimit
    price: Optional[float] = None

class User(BaseModel):
    id: str
    name: str
    email: str
    customer_type: CustomerType
    company_id: Optional[str] = None  # For B2B users

class UserCreate(BaseModel):
    name: str
    email: str
    customer_type: CustomerType
    company_id: Optional[str] = None

class PaymentInfo(BaseModel):
    payment_method: str
    amount: float
    currency: str = "USD"
    transaction_id: str

class MembershipBase(BaseModel):
    name: str
    expires_at: datetime
    limits: FeatureLimit
    customer_type: CustomerType
    template_id: Optional[str] = None

class MembershipCreate(MembershipBase):
    user_id: str

class Membership(MembershipBase):
    id: str
    user_id: str
    status: MembershipStatus = MembershipStatus.ACTIVE
    usage: FeatureUsage = FeatureUsage()
    created_at: datetime
    payment_info: Optional[PaymentInfo] = None

class MembershipAssignment(BaseModel):
    user_id: str
    template_id: str
    assigned_by: str  # Admin ID

class PaymentRequest(BaseModel):
    user_id: str
    template_id: str
    payment_method: str
    amount: float

class UsageUpdate(BaseModel):
    feature_type: str
    user_id: str
