# 🚀 Backend - Ringle AI Tutor

FastAPI Python backend for membership management and AI conversation APIs.

## 🚀 Quick Start

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python -m uvicorn main:app --reload
```

## 🌐 Development Server

- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
backend/
├── main.py                # FastAPI application entry point
├── requirements.txt       # Python dependencies
├── .venv/                # Virtual environment (created)
├── database.db           # SQLite database (created)
├── models/               # Database models
│   ├── __init__.py
│   ├── user.py          # User model
│   ├── membership.py    # Membership model
│   └── template.py      # Membership template model
├── routes/               # API route handlers
│   ├── __init__.py
│   ├── users.py         # User management
│   ├── membership.py    # Membership operations
│   └── templates.py     # Membership templates
├── schemas/              # Pydantic schemas
│   ├── __init__.py
│   ├── user.py          # User schemas
│   ├── membership.py    # Membership schemas
│   └── template.py      # Template schemas
├── services/             # Business logic
│   ├── __init__.py
│   ├── membership_service.py
│   └── template_service.py
└── utils/                # Utility functions
    ├── __init__.py
    └── database.py      # Database configuration
```

## 🎯 Key Features

### 👥 User Management
- **User switching** between B2B/B2C types
- **User profiles** with customer type classification
- **Simple authentication** (development mode)

### 💳 Membership System
- **Membership creation** with expiration dates
- **Usage tracking** for conversations and analysis
- **Membership validation** and limit checking
- **Purchase workflow** simulation

### 📊 Template Management
- **Membership templates** for different user types
- **Pricing and duration** configuration
- **Feature limits** (conversation/analysis counts)
- **B2B/B2C differentiation**

### 📈 Usage Tracking
- **Real-time usage monitoring**
- **Automatic deduction** on feature usage
- **Limit enforcement** and validation
- **Usage history** and analytics

## 🔧 Technical Stack

### Core Technologies
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Development database
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server

### Database Schema
```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer_type TEXT NOT NULL -- 'B2B' or 'B2C'
);

-- Membership templates
CREATE TABLE membership_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    duration_days INTEGER NOT NULL,
    customer_type TEXT NOT NULL,
    conversation_limit INTEGER,  -- NULL for unlimited
    analysis_limit INTEGER       -- NULL for unlimited
);

-- Active memberships
CREATE TABLE memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    status TEXT NOT NULL,        -- 'active', 'expired', 'cancelled'
    conversation_usage INTEGER DEFAULT 0,
    analysis_usage INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (template_id) REFERENCES membership_templates (id)
);
```

## 🛠️ API Endpoints

### 👤 User Management

#### Get Users
```http
GET /users
```
Returns list of all users with their details.

#### Get User Active Memberships
```http
GET /users/{user_id}/active-memberships
```
Returns active memberships for a specific user.

### 💳 Membership Operations

#### Check Usage Permission
```http
POST /usage/check
Content-Type: application/json

{
  "user_id": "user-1",
  "feature_type": "conversation"
}
```

#### Start Conversation (Deduct Usage)
```http
POST /usage/start-conversation
Content-Type: application/json

{
  "user_id": "user-1", 
  "feature_type": "conversation"
}
```

#### Update Usage
```http
POST /usage/update
Content-Type: application/json

{
  "user_id": "user-1",
  "feature_type": "conversation",
  "increment": 1
}
```

#### Purchase Membership
```http
POST /memberships
Content-Type: application/json

{
  "user_id": "user-1",
  "template_id": "template-id"
}
```

### 📋 Template Management

#### Get Templates by Customer Type
```http
GET /templates?customer_type=B2C
```

#### Get All Templates
```http
GET /templates
```

### ❤️ Health Check
```http
GET /health
```

## 🔧 Development

### Environment Setup

1. **Create virtual environment**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start development server**
   ```bash
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Database Initialization

The database is automatically initialized with sample data:

```python
# Sample users
users = [
    {"id": "user-1", "name": "Alice Johnson", "customer_type": "B2C"},
    {"id": "user-2", "name": "TechCorp Inc.", "customer_type": "B2B"}
]

# Sample templates
templates = [
    {
        "id": "basic-b2c",
        "name": "Basic Plan",
        "price": 29.99,
        "duration_days": 30,
        "customer_type": "B2C",
        "conversation_limit": 50,
        "analysis_limit": 10
    }
    # ... more templates
]
```

### Adding New Features

#### 1. Create Database Model
```python
# models/new_feature.py
from sqlalchemy import Column, String, DateTime, Integer
from utils.database import Base

class NewFeature(Base):
    __tablename__ = "new_features"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
```

#### 2. Create Pydantic Schema
```python
# schemas/new_feature.py
from pydantic import BaseModel
from datetime import datetime

class NewFeatureBase(BaseModel):
    name: str

class NewFeatureCreate(NewFeatureBase):
    pass

class NewFeature(NewFeatureBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### 3. Create Route Handler
```python
# routes/new_feature.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from utils.database import get_db

router = APIRouter(prefix="/new-features", tags=["New Features"])

@router.get("/")
def get_new_features(db: Session = Depends(get_db)):
    # Implementation
    pass
```

#### 4. Register Route
```python
# main.py
from routes import new_feature
app.include_router(new_feature.router)
```

## 📊 Data Models

### User Model
```python
class User(BaseModel):
    id: str
    name: str
    customer_type: Literal["B2B", "B2C"]
```

### Membership Template
```python
class MembershipTemplate(BaseModel):
    id: str
    name: str
    description: str
    price: Optional[float]
    duration_days: int
    customer_type: Literal["B2B", "B2C"]
    limits: UsageLimits
```

### Active Membership
```python
class Membership(BaseModel):
    id: str
    user_id: str
    template_id: str
    created_at: datetime
    expires_at: datetime
    status: Literal["active", "expired", "cancelled"]
    usage: UsageTracker
    limits: UsageLimits
```

### Usage Tracking
```python
class UsageTracker(BaseModel):
    conversation: int = 0
    analysis: int = 0

class UsageLimits(BaseModel):
    conversation: Optional[int] = None  # None = unlimited
    analysis: Optional[int] = None      # None = unlimited
```

## 🔒 Business Logic

### Membership Validation
```python
def can_use_feature(user_id: str, feature_type: str) -> bool:
    # 1. Get user's active memberships
    # 2. Check expiration dates
    # 3. Verify usage limits
    # 4. Return permission status
```

### Usage Deduction
```python
def deduct_usage(user_id: str, feature_type: str) -> bool:
    # 1. Validate permission first
    # 2. Find appropriate membership
    # 3. Increment usage counter
    # 4. Save to database
```

### Membership Purchase
```python
def purchase_membership(user_id: str, template_id: str) -> Membership:
    # 1. Validate user and template
    # 2. Calculate expiration date
    # 3. Create new membership record
    # 4. Return created membership
```

## 🧪 Testing

### Manual Testing with API Docs
1. Visit http://localhost:8000/docs
2. Test each endpoint interactively
3. Verify request/response schemas
4. Check error handling

### cURL Examples
```bash
# Check user membership
curl -X POST http://localhost:8000/usage/check \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-1", "feature_type": "conversation"}'

# Purchase membership
curl -X POST http://localhost:8000/memberships \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-1", "template_id": "basic-b2c"}'
```

### Database Inspection
```bash
# Connect to SQLite database
sqlite3 database.db

# View tables
.tables

# Check user data
SELECT * FROM users;

# Check active memberships
SELECT * FROM memberships WHERE status = 'active';
```

## 📈 Performance

### Database Optimization
- **Indexes** on frequently queried columns
- **Connection pooling** for concurrent requests
- **Query optimization** with SQLAlchemy
- **Caching** for template data

### API Performance
- **Async/await** for I/O operations
- **Request validation** with Pydantic
- **Response caching** where appropriate
- **Error handling** to prevent crashes

## 🔧 Configuration

### Environment Variables
```bash
# Database configuration
DATABASE_URL=sqlite:///./database.db

# API configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# External service keys (if needed)
OPENAI_API_KEY=your_key_here
```

### FastAPI Configuration
```python
# main.py
app = FastAPI(
    title="Ringle AI Tutor API",
    description="Backend API for membership and user management",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
```

## 🚀 Deployment

### Production Setup
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -ti:8000 | xargs kill -9
   ```

2. **Database locked**
   ```bash
   rm database.db  # Will be recreated with sample data
   ```

3. **Virtual environment issues**
   ```bash
   rm -rf .venv
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Import errors**
   ```bash
   # Ensure you're in the backend directory
   cd backend
   python -m uvicorn main:app --reload
   ```

### Debug Mode
```python
# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Database Issues
```bash
# Reset database
rm database.db
python -c "from main import init_db; init_db()"
```

## 📚 API Documentation

The FastAPI framework automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Authentication
Currently using simple user switching for development. In production, implement:
- JWT tokens
- OAuth2 integration
- API key authentication
- Rate limiting

### Rate Limiting
Basic rate limiting is implemented to prevent abuse:
- Max requests per IP
- User-based limits
- Feature-specific quotas

---

**Ready to develop?** Run `python -m uvicorn main:app --reload` and start building! 🚀