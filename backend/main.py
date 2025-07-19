import logging
from fastapi import FastAPI
from routes import membership, templates, users, payments, admin, chat

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

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
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed")
    return {
        "message": "Ringle AI Tutor Backend API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint for Fly.io monitoring"""
    return {"status": "healthy", "timestamp": "2025-01-17T06:59:32Z"}