import logging
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime, timezone
from models import (
    MembershipCreate, Membership, MembershipStatus, 
    UsageUpdate, FeatureUsage
)
from db import MEMBERSHIPS, USERS, _save_data

router = APIRouter()
logger = logging.getLogger(__name__)

def check_membership_expiry(membership: Membership) -> Membership:
    """Check if membership is expired and update status"""
    if datetime.now(timezone.utc) > membership.expires_at and membership.status == MembershipStatus.ACTIVE:
        membership.status = MembershipStatus.EXPIRED
    return membership

def validate_usage(membership: Membership, feature_type: str) -> bool:
    """Validate if user can use a feature based on limits and usage"""
    if membership.status != MembershipStatus.ACTIVE:
        return False
    
    if datetime.now(timezone.utc) > membership.expires_at:
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
    logger.info(f"Creating new membership for user: {data.user_id}")
    new_id = str(uuid4())
    membership = Membership(
        id=new_id, 
        created_at=datetime.now(timezone.utc),
        usage=FeatureUsage(),
        **data.dict()
    )
    MEMBERSHIPS[new_id] = membership
    _save_data()
    logger.info(f"Membership created successfully with ID: {new_id}")
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
    _save_data()
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

@router.get("/users/{user_id}/active-memberships", response_model=list[Membership])
def get_user_active_memberships(user_id: str):
    """Get user's active memberships"""
    logger.info(f"Looking for active memberships for user: {user_id}")
    
    if user_id not in USERS:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    active_memberships = []
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE:
                active_memberships.append(membership)
    
    if not active_memberships:
        logger.warning(f"No active memberships found for user: {user_id}")
        # Return an empty list instead of 404 if no active memberships
        return []
    
    logger.info(f"Found {len(active_memberships)} active memberships for user {user_id}")
    return active_memberships

@router.post("/usage/check")
def check_feature_usage(usage_check: UsageUpdate):
    """Check if user can use a feature"""
    user_id = usage_check.user_id
    feature_type = usage_check.feature_type
    
    logger.info(f"Checking feature usage for user: {user_id}, feature: {feature_type}")
    
    if user_id not in USERS:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find an active membership that can be used for the feature
    valid_membership = None
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE and validate_usage(membership, feature_type):
                valid_membership = membership
                break # Found a valid one, can stop searching
    
    if not valid_membership:
        logger.warning(f"No valid active membership found for user: {user_id}, feature: {feature_type}")
        return {"can_use": False, "reason": "No valid active membership for this feature"}
    
    can_use = validate_usage(valid_membership, feature_type)
    
    if not can_use:
        if feature_type == "conversation":
            limit = valid_membership.limits.conversation
            usage = valid_membership.usage.conversation
        else:
            limit = valid_membership.limits.analysis
            usage = valid_membership.usage.analysis
        
        reason = f"Usage limit reached ({usage}/{limit})" if limit else "Feature not available"
        logger.warning(f"Usage limit exceeded for user {user_id}, feature {feature_type}: {reason}")
        return {"can_use": False, "reason": reason}
    
    logger.info(f"Feature usage check passed for user {user_id}, feature {feature_type}")
    return {"can_use": True, "membership": valid_membership}

@router.post("/memberships/{membership_id}/deduct-coupon")
def deduct_coupon(membership_id: str):
    """Deduct a coupon from a count-based membership"""
    logger.info(f"Attempting to deduct coupon for membership ID: {membership_id}")

    if membership_id not in MEMBERSHIPS:
        logger.warning(f"Membership not found: {membership_id}")
        raise HTTPException(status_code=404, detail="Membership not found")

    membership = MEMBERSHIPS[membership_id]
    membership = check_membership_expiry(membership)

    if membership.status != MembershipStatus.ACTIVE:
        logger.warning(f"Membership {membership_id} is not active. Status: {membership.status}")
        raise HTTPException(status_code=400, detail="Membership is not active")

    if membership.limits.conversation is None:
        logger.warning(f"Membership {membership_id} is not count-based (conversation limit is None).")
        raise HTTPException(status_code=400, detail="This membership is not count-based for conversations.")

    if membership.usage.conversation >= membership.limits.conversation:
        logger.warning(f"Membership {membership_id} has no remaining conversation coupons. Usage: {membership.usage.conversation}, Limit: {membership.limits.conversation}")
        raise HTTPException(status_code=400, detail="No remaining conversation coupons for this membership.")

    membership.usage.conversation += 1
    _save_data()
    logger.info(f"Coupon deducted successfully for membership {membership_id}. New usage: {membership.usage.conversation}")
    return {"success": True, "message": "Coupon deducted successfully"}

@router.post("/usage/start-conversation")
def start_conversation(usage_update: UsageUpdate):
    """Start a conversation and deduct usage upfront"""
    user_id = usage_update.user_id
    
    logger.info(f"Starting conversation for user: {user_id}")
    
    if user_id not in USERS:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find an active membership that can be used for conversation
    valid_membership = None
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE and validate_usage(membership, "conversation"):
                valid_membership = membership
                break
    
    if not valid_membership:
        logger.warning(f"No valid active membership found for user: {user_id}")
        raise HTTPException(status_code=400, detail="No active membership with remaining conversation usage")
    
    # Deduct conversation usage
    if valid_membership.limits.conversation is not None:
        valid_membership.usage.conversation += 1
        logger.info(f"Conversation usage deducted for user {user_id}. New usage: {valid_membership.usage.conversation}/{valid_membership.limits.conversation}")
    else:
        logger.info(f"Unlimited conversation membership for user {user_id}")
    
    _save_data()
    return {
        "message": "Conversation started successfully",
        "membership_id": valid_membership.id,
        "current_usage": valid_membership.usage,
        "limits": valid_membership.limits
    }

@router.post("/usage/update")
def update_feature_usage(usage_update: UsageUpdate):
    """Update feature usage after user consumes a feature"""
    user_id = usage_update.user_id
    feature_type = usage_update.feature_type
    
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find an active membership that can be used for the feature and has remaining usage
    updatable_membership = None
    for membership in MEMBERSHIPS.values():
        if membership.user_id == user_id:
            membership = check_membership_expiry(membership)
            if membership.status == MembershipStatus.ACTIVE and validate_usage(membership, feature_type):
                updatable_membership = membership
                break # Found a valid one, can stop searching
    
    if not updatable_membership:
        raise HTTPException(status_code=400, detail="No active membership with remaining usage for this feature")
    
    # Increment usage
    if feature_type == "conversation":
        updatable_membership.usage.conversation += 1
    elif feature_type == "analysis":
        updatable_membership.usage.analysis += 1
    _save_data()
    return {
        "message": "Usage updated successfully",
        "current_usage": updatable_membership.usage,
        "limits": updatable_membership.limits
    }
