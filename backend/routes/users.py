from fastapi import APIRouter, HTTPException
from uuid import uuid4
from models import User, UserCreate
from db import USERS

router = APIRouter()

@router.post("/users", response_model=User)
def create_user(data: UserCreate):
    """Create a new user"""
    user_id = str(uuid4())
    user = User(id=user_id, **data.dict())
    USERS[user_id] = user
    return user

@router.get("/users", response_model=list[User])
def list_users():
    """List all users"""
    return list(USERS.values())

@router.get("/users/{user_id}", response_model=User)
def get_user(user_id: str):
    """Get a specific user"""
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    return USERS[user_id]

@router.put("/users/{user_id}", response_model=User)
def update_user(user_id: str, data: UserCreate):
    """Update a user"""
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    
    updated_user = User(id=user_id, **data.dict())
    USERS[user_id] = updated_user
    return updated_user

@router.delete("/users/{user_id}")
def delete_user(user_id: str):
    """Delete a user"""
    if user_id not in USERS:
        raise HTTPException(status_code=404, detail="User not found")
    del USERS[user_id]
    return {"message": "User deleted"}