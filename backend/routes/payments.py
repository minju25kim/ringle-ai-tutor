from fastapi import APIRouter, HTTPException
from uuid import uuid4
from datetime import datetime, timedelta
from models import (
    PaymentRequest, PaymentInfo, Membership, MembershipStatus, 
    FeatureUsage, CustomerType
)
from db import USERS, MEMBERSHIP_TEMPLATES, MEMBERSHIPS

router = APIRouter()

def mock_payment_gateway(payment_method: str, amount: float) -> dict:
    """Mock payment gateway integration"""
    return {
        "success": True,
        "transaction_id": f"txn_{uuid4()}",
        "message": "Payment processed successfully"
    }

@router.post("/payments/process")
def process_payment(payment_request: PaymentRequest):
    """Process user payment for membership"""
    # Validate user exists
    if payment_request.user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate template exists
    if payment_request.template_id not in MEMBERSHIP_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    user = USERS[payment_request.user_id]
    template = MEMBERSHIP_TEMPLATES[payment_request.template_id]
    
    # Validate customer type matches template
    if user.customer_type != template.customer_type:
        raise HTTPException(
            status_code=400, 
            detail=f"Template is for {template.customer_type} customers only"
        )
    
    # Validate template is active
    if not template.is_active:
        raise HTTPException(status_code=400, detail="Template is not active")
    
    # For B2C customers, validate payment amount
    if user.customer_type == CustomerType.B2C:
        if template.price is None:
            raise HTTPException(status_code=400, detail="Template price not set")
        if payment_request.amount != template.price:
            raise HTTPException(status_code=400, detail="Invalid payment amount")
    
    # Process payment through mock gateway
    payment_result = mock_payment_gateway(
        payment_request.payment_method, 
        payment_request.amount
    )
    
    if not payment_result["success"]:
        raise HTTPException(status_code=400, detail="Payment failed")
    
    # Create membership
    membership_id = str(uuid4())
    expires_at = datetime.now() + timedelta(days=template.duration_days)
    
    payment_info = PaymentInfo(
        payment_method=payment_request.payment_method,
        amount=payment_request.amount,
        currency="USD",
        transaction_id=payment_result["transaction_id"]
    )
    
    membership = Membership(
        id=membership_id,
        user_id=payment_request.user_id,
        name=template.name,
        expires_at=expires_at,
        limits=template.limits,
        customer_type=user.customer_type,
        template_id=payment_request.template_id,
        status=MembershipStatus.ACTIVE,
        usage=FeatureUsage(),
        created_at=datetime.now(),
        payment_info=payment_info
    )
    
    MEMBERSHIPS[membership_id] = membership
    
    return {
        "message": "Payment processed successfully",
        "membership": membership,
        "transaction_id": payment_result["transaction_id"]
    }