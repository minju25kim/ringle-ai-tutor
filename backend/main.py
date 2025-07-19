from fastapi import FastAPI
from routes import membership, templates, users, payments, admin

app = FastAPI(
    title="Ringle AI Tutor Backend",
    description="Backend API for Ringle AI Tutor membership management",
    version="1.0.0"
)

app.include_router(membership.router, prefix="/api/v1", tags=["memberships"])
app.include_router(templates.router, prefix="/api/v1", tags=["templates"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])

@app.get("/")
def read_root():
    return {
        "message": "Ringle AI Tutor Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }