from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime
from models import (
    MembershipCreate, Membership, MembershipStatus, 
    UsageUpdate, FeatureUsage
)
from db import MEMBERSHIPS, USERS

router = APIRouter()

def check_membership_expiry(membership: Membership) -> Membership:
    """Check if membership is expired and update status"""
    if datetime.now() > membership.expires_at and membership.status == MembershipStatus.ACTIVE:
        membership.status = MembershipStatus.EXPIRED
    return membership

def validate_usage(membership: Membership, feature_type: str) -> bool:
    """Validate if user can use a feature based on limits and usage"""
    if membership.status != MembershipStatus.ACTIVE:
        return False
    
    if datetime.now() > membership.expires_at:
        membership.status = MembershipStatus.EXPIRED
        return False
    
    if feature_type == "conversation":
        limit = membership.limits.conversation
        usage = membership.usage.conversation
    elif feature_type == "analysis":
        limit = membership.limits.analysis
        usage = membership.usage.analysis
    else:
        return False
    
    # None means unlimited
    if limit is None:
        return True
    
    return usage < limit

@router.post("/memberships", response_model=Membership)
def create_membership(data: MembershipCreate):
    """Create a new membership"""
    new_id = str(uuid4())
    membership = Membership(
        id=new_id, 
        created_at=datetime.now(),
        usage=FeatureUsage(),
        **data.dict()
    )
    MEMBERSHIPS[new_id] = membership
    return membership

@router.get("/memberships", response_model=list[Membership])
def list_memberships():
    """List all memberships"""
    memberships = []
    for membership in MEMBERSHIPS.values():
        memberships.append(check_membership_expiry(membership))
    return memberships

@router.get("/memberships/{membership_id}", response_model=Membership)
def get_membership(membership_id: str):
    """Get a specific membership"""
    if membership_id not in MEMBERSHIPS:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    membership = MEMBERSHIPS[membership_id]
    return check_membership_expiry(membership)

@router.delete("/memberships/{membership_id}")
def delete_membership(membership_id: str):
    """Delete a membership"""
    if membership_id not in MEMBERSHIPS:
        raise HTTPException(status_code=404, detail="Membership not found")
    del MEMBERSHIPS[membership_id]
    return {"message": "Membership deleted"}

@router.get("/users/{user_id}/memberships", response_model=list[Membership])
def get_user_memberships(user_id: str):
    """Get all memberships for a specific user"""
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_memberships = []
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            user_memberships.append(check_membership_expiry(membership))
    
    return user_memberships

@router.get("/users/{user_id}/active-membership")
def get_user_active_membership(user_id: str):
    """Get user's active membership"""
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE:
                return membership
    
    raise HTTPException(status_code=404, detail="No active membership found")

@router.post("/usage/check")
def check_feature_usage(usage_check: UsageUpdate):
    """Check if user can use a feature"""
    user_id = usage_check.user_id
    feature_type = usage_check.feature_type
    
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find active membership
    active_membership = None
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE:
                active_membership = membership
                break
    
    if not active_membership:
        return {"can_use": False, "reason": "No active membership"}
    
    can_use = validate_usage(active_membership, feature_type)
    
    if not can_use:
        if feature_type == "conversation":
            limit = active_membership.limits.conversation
            usage = active_membership.usage.conversation
        else:
            limit = active_membership.limits.analysis
            usage = active_membership.usage.analysis
        
        reason = f"Usage limit reached ({usage}/{limit})" if limit else "Feature not available"
        return {"can_use": False, "reason": reason}
    
    return {"can_use": True, "membership": active_membership}

@router.post("/usage/update")
def update_feature_usage(usage_update: UsageUpdate):
    """Update feature usage after user consumes a feature"""
    user_id = usage_update.user_id
    feature_type = usage_update.feature_type
    
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find active membership
    active_membership = None
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE:
                active_membership = membership
                break
    
    if not active_membership:
        raise HTTPException(status_code=404, detail="No active membership")
    
    # Validate usage before incrementing
    if not validate_usage(active_membership, feature_type):
        raise HTTPException(status_code=400, detail="Usage limit exceeded")
    
    # Increment usage
    if feature_type == "conversation":
        active_membership.usage.conversation += 1
    elif feature_type == "analysis":
        active_membership.usage.analysis += 1
    
    return {
        "message": "Usage updated successfully",
        "current_usage": active_membership.usage,
        "limits": active_membership.limits
    }
