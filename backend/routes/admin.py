from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime, timedelta
from models import (
    MembershipAssignment, Membership, MembershipStatus, 
    FeatureUsage, CustomerType
)
from db import USERS, MEMBERSHIP_TEMPLATES, MEMBERSHIPS

router = APIRouter()

@router.post("/admin/assign-membership")
def assign_membership(assignment: MembershipAssignment):
    """Admin assigns membership to user"""
    # Validate user exists
    if assignment.user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate template exists
    if assignment.template_id not in MEMBERSHIP_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    user = USERS[assignment.user_id]
    template = MEMBERSHIP_TEMPLATES[assignment.template_id]
    
    # For B2B customers, admin can assign any template
    # For B2C customers, validate customer type matches
    if user.customer_type == CustomerType.B2C and template.customer_type != CustomerType.B2C:
        raise HTTPException(
            status_code=400, 
            detail="Cannot assign B2B template to B2C customer"
        )
    
    # Create membership
    membership_id = str(uuid4())
    expires_at = datetime.now() + timedelta(days=template.duration_days)
    
    membership = Membership(
        id=membership_id,
        user_id=assignment.user_id,
        name=template.name,
        expires_at=expires_at,
        limits=template.limits,
        customer_type=user.customer_type,
        template_id=assignment.template_id,
        status=MembershipStatus.ACTIVE,
        usage=FeatureUsage(),
        created_at=datetime.now()
    )
    
    MEMBERSHIPS[membership_id] = membership
    
    return {
        "message": "Membership assigned successfully",
        "membership": membership,
        "assigned_by": assignment.assigned_by
    }

@router.delete("/admin/memberships/{membership_id}")
def revoke_membership(membership_id: str, admin_id: str):
    """Admin revokes/deletes membership"""
    if membership_id not in MEMBERSHIPS:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    membership = MEMBERSHIPS[membership_id]
    del MEMBERSHIPS[membership_id]
    
    return {
        "message": "Membership revoked successfully",
        "revoked_by": admin_id,
        "membership_id": membership_id
    }

@router.patch("/admin/memberships/{membership_id}/suspend")
def suspend_membership(membership_id: str, admin_id: str):
    """Admin suspends membership"""
    if membership_id not in MEMBERSHIPS:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    membership = MEMBERSHIPS[membership_id]
    membership.status = MembershipStatus.SUSPENDED
    
    return {
        "message": "Membership suspended successfully",
        "suspended_by": admin_id,
        "membership": membership
    }

@router.patch("/admin/memberships/{membership_id}/activate")
def activate_membership(membership_id: str, admin_id: str):
    """Admin activates suspended membership"""
    if membership_id not in MEMBERSHIPS:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    membership = MEMBERSHIPS[membership_id]
    
    # Check if membership is expired
    if datetime.now() > membership.expires_at:
        raise HTTPException(status_code=400, detail="Cannot activate expired membership")
    
    membership.status = MembershipStatus.ACTIVE
    
    return {
        "message": "Membership activated successfully",
        "activated_by": admin_id,
        "membership": membership
    }

@router.get("/admin/memberships")
def list_all_memberships():
    """Admin lists all memberships"""
    return list(MEMBERSHIPS.values())

@router.get("/admin/users/{user_id}/memberships")
def get_user_memberships(user_id: str):
    """Admin gets all memberships for a specific user"""
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_memberships = [
        membership for membership in MEMBERSHIPS.values()
        if membership.user_id == user_id
    ]
    
    return user_memberships