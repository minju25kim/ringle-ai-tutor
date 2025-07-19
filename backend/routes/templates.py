from fastapi import APIRouter, HTTPException
from uuid import uuid4
from models import MembershipTemplate, MembershipTemplateCreate, CustomerType
from db import MEMBERSHIP_TEMPLATES, _save_data

router = APIRouter()

@router.post("/templates", response_model=MembershipTemplate)
def create_template(data: MembershipTemplateCreate):
    """Create a new membership template (Admin only)"""
    template_id = str(uuid4())
    template = MembershipTemplate(id=template_id, **data.dict())
    MEMBERSHIP_TEMPLATES[template_id] = template
    _save_data()
    return template

@router.get("/templates", response_model=list[MembershipTemplate])
def list_templates(customer_type: CustomerType = None):
    """List all membership templates, optionally filtered by customer type"""
    templates = list(MEMBERSHIP_TEMPLATES.values())
    if customer_type:
        templates = [t for t in templates if t.customer_type == customer_type]
    return templates

@router.get("/templates/{template_id}", response_model=MembershipTemplate)
def get_template(template_id: str):
    """Get a specific membership template"""
    if template_id not in MEMBERSHIP_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    return MEMBERSHIP_TEMPLATES[template_id]

@router.put("/templates/{template_id}", response_model=MembershipTemplate)
def update_template(template_id: str, data: MembershipTemplateCreate):
    """Update a membership template (Admin only)"""
    if template_id not in MEMBERSHIP_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    updated_template = MembershipTemplate(id=template_id, **data.dict())
    MEMBERSHIP_TEMPLATES[template_id] = updated_template
    _save_data()
    return updated_template

@router.delete("/templates/{template_id}")
def delete_template(template_id: str):
    """Delete a membership template (Admin only)"""
    if template_id not in MEMBERSHIP_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    del MEMBERSHIP_TEMPLATES[template_id]
    _save_data()
    return {"message": "Template deleted"}

@router.post("/templates/{template_id}/toggle")
def toggle_template_status(template_id: str):
    """Toggle template active status (Admin only)"""
    if template_id not in MEMBERSHIP_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = MEMBERSHIP_TEMPLATES[template_id]
    template.is_active = not template.is_active
    _save_data()
    return {"message": f"Template {'activated' if template.is_active else 'deactivated'}"}