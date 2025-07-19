import json
import os
from typing import Dict
from uuid import uuid4
from models import Membership, MembershipTemplate, User, CustomerType, FeatureLimit, MembershipStatus
from datetime import datetime, timedelta

# Use mounted volume for persistent storage, fallback to local file
# In Docker container: /app/data, in local development: current directory
DATA_DIR = os.getenv("DATA_DIR", ".")
DATA_FILE = os.path.join(DATA_DIR, "data.json")

MEMBERSHIPS: Dict[str, Membership] = {}
MEMBERSHIP_TEMPLATES: Dict[str, MembershipTemplate] = {}
USERS: Dict[str, User] = {}

def _load_data():
    global MEMBERSHIPS, MEMBERSHIP_TEMPLATES, USERS
    try:
        # Only create directory if we're in a Docker container (DATA_DIR is /app/data)
        if DATA_DIR.startswith("/app"):
            os.makedirs(DATA_DIR, exist_ok=True)
        
        with open(DATA_FILE, "r") as f:
            data = json.load(f)
            USERS = {k: User(**v) for k, v in data.get("users", {}).items()}
            MEMBERSHIP_TEMPLATES = {k: MembershipTemplate(**v) for k, v in data.get("membership_templates", {}).items()}
            MEMBERSHIPS = {k: Membership(**v) for k, v in data.get("memberships", {}).items()}
            # Convert datetime strings back to datetime objects
            for mid, membership in MEMBERSHIPS.items():
                membership.created_at = datetime.fromisoformat(str(membership.created_at))
                membership.expires_at = datetime.fromisoformat(str(membership.expires_at))
    except (FileNotFoundError, json.JSONDecodeError):
        print(f"Data file {DATA_FILE} not found or invalid, initializing with seed data.")
        init_seed_data_defaults()

def _save_data():
    # Only create directory if we're in a Docker container (DATA_DIR is /app/data)
    if DATA_DIR.startswith("/app"):
        os.makedirs(DATA_DIR, exist_ok=True)
    
    data = {
        "users": {k: v.dict() for k, v in USERS.items()},
        "membership_templates": {k: v.dict() for k, v in MEMBERSHIP_TEMPLATES.items()},
        "memberships": {k: v.dict() for k, v in MEMBERSHIPS.items()}
    }
    # Convert datetime objects to ISO format strings for JSON serialization
    for mid, membership_data in data["memberships"].items():
        membership_data["created_at"] = membership_data["created_at"].isoformat()
        membership_data["expires_at"] = membership_data["expires_at"].isoformat()

    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

def init_seed_data_defaults():
    """Initialize with basic B2C membership templates and users if no data file exists"""
    basic_b2c_template = MembershipTemplate(
        id="basic-b2c",
        name="Basic Plan (B2C)",
        customer_type=CustomerType.B2C,
        duration_days=30,
        limits=FeatureLimit(conversation=10, analysis=3),
        price=9.99,
        is_active=True
    )
    
    premium_b2c_template = MembershipTemplate(
        id="premium-b2c",
        name="Premium Plan (B2C)",
        customer_type=CustomerType.B2C,
        duration_days=60,
        limits=FeatureLimit(conversation=20, analysis=5),
        price=19.99,
        is_active=True
    )
    
    unlimited_b2c_template = MembershipTemplate(
        id="unlimited-b2c",
        name="Unlimited Plan (B2C)",
        customer_type=CustomerType.B2C,
        duration_days=90,
        limits=FeatureLimit(conversation=None, analysis=None),
        price=39.99,
        is_active=True
    )

    basic_b2b_template = MembershipTemplate(
        id="basic-b2b",
        name="Basic Plan (B2B)",
        customer_type=CustomerType.B2B,
        duration_days=365,
        limits=FeatureLimit(conversation=100, analysis=50),
        price=None, # B2B might not have a direct price
        is_active=True
    )

    MEMBERSHIP_TEMPLATES[basic_b2c_template.id] = basic_b2c_template
    MEMBERSHIP_TEMPLATES[premium_b2c_template.id] = premium_b2c_template
    MEMBERSHIP_TEMPLATES[unlimited_b2c_template.id] = unlimited_b2c_template
    MEMBERSHIP_TEMPLATES[basic_b2b_template.id] = basic_b2b_template
    
    b2c_user = User(
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
    
    USERS[b2c_user.id] = b2c_user
    USERS[b2b_user.id] = b2b_user

    # Create initial active memberships
    # B2C user gets a basic B2C membership
    b2c_membership_id = str(uuid4())
    b2c_membership = Membership(
        id=b2c_membership_id,
        name=basic_b2c_template.name,
        user_id=b2c_user.id,
        template_id=basic_b2c_template.id,
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(days=basic_b2c_template.duration_days),
        status=MembershipStatus.ACTIVE,
        limits=basic_b2c_template.limits,
        customer_type=basic_b2c_template.customer_type
    )
    MEMBERSHIPS[b2c_membership_id] = b2c_membership

    # B2B user gets a basic B2B membership
    b2b_membership_id = str(uuid4())
    b2b_membership = Membership(
        id=b2b_membership_id,
        name=basic_b2b_template.name,
        user_id=b2b_user.id,
        template_id=basic_b2b_template.id,
        created_at=datetime.now(),
        expires_at=datetime.now() + timedelta(days=basic_b2b_template.duration_days),
        status=MembershipStatus.ACTIVE,
        limits=basic_b2b_template.limits,
        customer_type=basic_b2b_template.customer_type
    )
    MEMBERSHIPS[b2b_membership_id] = b2b_membership

    _save_data() # Save initial seed data to file

# Load data on startup
_load_data()
