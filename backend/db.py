from typing import Dict
from uuid import uuid4
from models import Membership, MembershipTemplate, User, CustomerType, FeatureLimit
from datetime import datetime, timedelta

MEMBERSHIPS: Dict[str, Membership] = {}
MEMBERSHIP_TEMPLATES: Dict[str, MembershipTemplate] = {}
USERS: Dict[str, User] = {}

def init_seed_data():
    """Initialize with basic B2C membership templates"""
    basic_template = MembershipTemplate(
        id="basic-b2c",
        name="Basic Plan",
        customer_type=CustomerType.B2C,
        duration_days=30,
        limits=FeatureLimit(conversation=10, analysis=3),
        price=9.99
    )
    
    premium_template = MembershipTemplate(
        id="premium-b2c",
        name="Premium Plan",
        customer_type=CustomerType.B2C,
        duration_days=60,
        limits=FeatureLimit(conversation=20, analysis=5),
        price=19.99
    )
    
    unlimited_template = MembershipTemplate(
        id="unlimited-b2c",
        name="Unlimited Plan",
        customer_type=CustomerType.B2C,
        duration_days=90,
        limits=FeatureLimit(conversation=None, analysis=None),
        price=39.99
    )
    
    MEMBERSHIP_TEMPLATES["basic-b2c"] = basic_template
    MEMBERSHIP_TEMPLATES["premium-b2c"] = premium_template
    MEMBERSHIP_TEMPLATES["unlimited-b2c"] = unlimited_template
    
    sample_user = User(
        id="user-1",
        name="John Doe",
        email="john@example.com",
        customer_type=CustomerType.B2C
    )
    
    b2b_user = User(
        id="user-2",
        name="Jane Smith",
        email="jane@company.com",
        customer_type=CustomerType.B2B,
        company_id="company-1"
    )
    
    USERS["user-1"] = sample_user
    USERS["user-2"] = b2b_user

init_seed_data()