# Ringle AI Tutor Backend API

## Overview

This is the backend API for the Ringle AI Tutor membership management system. It provides comprehensive membership and usage tracking functionality for both B2B and B2C customers.

## Features

### Core Functionality
- ✅ **Membership Management**: Create, read, update, delete memberships
- ✅ **Usage Tracking**: Track conversation and analysis feature usage
- ✅ **Expiration Handling**: Automatic membership expiration validation
- ✅ **B2B/B2C Support**: Different membership types for business and consumer customers
- ✅ **Payment Processing**: Mock payment gateway integration
- ✅ **Admin Management**: Admin APIs for membership assignment and management

### Membership Features
- **Conversation Limits**: Track AI conversation usage
- **Analysis Limits**: Track AI analysis feature usage
- **Unlimited Plans**: Support for unlimited usage plans
- **Flexible Expiration**: Configurable membership duration
- **Multiple Status**: Active, Expired, Suspended membership states

## API Structure

### Base URL
```
http://localhost:8000/api/v1
```

### Main Endpoints

#### 1. Templates Management (`/templates`)
- `GET /templates` - List all membership templates
- `POST /templates` - Create new template (Admin)
- `GET /templates/{id}` - Get specific template
- `PUT /templates/{id}` - Update template (Admin)
- `DELETE /templates/{id}` - Delete template (Admin)

#### 2. Users Management (`/users`)
- `GET /users` - List all users
- `POST /users` - Create new user
- `GET /users/{id}` - Get specific user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

#### 3. Memberships (`/memberships`)
- `GET /memberships` - List all memberships
- `POST /memberships` - Create membership
- `GET /memberships/{id}` - Get specific membership
- `DELETE /memberships/{id}` - Delete membership
- `GET /users/{user_id}/memberships` - Get user's memberships
- `GET /users/{user_id}/active-membership` - Get user's active membership

#### 4. Usage Tracking (`/usage`)
- `POST /usage/check` - Check if user can use a feature
- `POST /usage/update` - Update feature usage after consumption

#### 5. Payments (`/payments`)
- `POST /payments/process` - Process user payment for membership

#### 6. Admin APIs (`/admin`)
- `POST /admin/assign-membership` - Admin assigns membership to user
- `DELETE /admin/memberships/{id}` - Admin revokes membership
- `PATCH /admin/memberships/{id}/suspend` - Admin suspends membership
- `PATCH /admin/memberships/{id}/activate` - Admin activates membership
- `GET /admin/memberships` - Admin lists all memberships
- `GET /admin/users/{user_id}/memberships` - Admin gets user memberships

## Data Models

### Customer Types
- `B2B`: Business customers with company-specific memberships
- `B2C`: Individual consumers with standard membership plans

### Membership Status
- `active`: Membership is valid and usable
- `expired`: Membership has passed expiration date
- `suspended`: Membership is temporarily disabled by admin

### Feature Types
- `conversation`: AI conversation feature
- `analysis`: AI analysis feature

## Example Usage

### 1. Create a B2B Template
```bash
curl -X POST "http://localhost:8000/api/v1/templates" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Enterprise Plan",
    "customer_type": "B2B",
    "duration_days": 365,
    "limits": {
      "conversation": null,
      "analysis": null
    }
  }'
```

### 2. Process Payment for B2C User
```bash
curl -X POST "http://localhost:8000/api/v1/payments/process" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-1",
    "template_id": "premium-b2c",
    "payment_method": "credit_card",
    "amount": 19.99
  }'
```

### 3. Check Feature Usage
```bash
curl -X POST "http://localhost:8000/api/v1/usage/check" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-1",
    "feature_type": "conversation"
  }'
```

### 4. Update Feature Usage
```bash
curl -X POST "http://localhost:8000/api/v1/usage/update" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-1",
    "feature_type": "conversation"
  }'
```

### 5. Admin Assign Membership
```bash
curl -X POST "http://localhost:8000/api/v1/admin/assign-membership" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-2",
    "template_id": "enterprise-template-id",
    "assigned_by": "admin-1"
  }'
```

## Running the Server

1. Install dependencies:
```bash
pip install fastapi uvicorn
```

2. Start the server:
```bash
python -m uvicorn main:app --reload --port 8000
```

3. Access the API documentation:
```
http://localhost:8000/docs
```

## Testing

Run the test script to verify all functionality:
```bash
python test_api.py
```

## Pre-loaded Data

The system comes with sample data:

### Users
- `user-1`: John Doe (B2C customer)
- `user-2`: Jane Smith (B2B customer)

### B2C Templates
- **Basic Plan**: 30 days, 10 conversations, 3 analyses ($9.99)
- **Premium Plan**: 60 days, 20 conversations, 5 analyses ($19.99)
- **Unlimited Plan**: 90 days, unlimited usage ($39.99)

## Architecture

### File Structure
```
backend/
├── main.py              # FastAPI application setup
├── models.py            # Pydantic data models
├── db.py               # In-memory database and seed data
├── routes/
│   ├── membership.py   # Membership and usage endpoints
│   ├── templates.py    # Template management
│   ├── users.py        # User management
│   ├── payments.py     # Payment processing
│   └── admin.py        # Admin operations
├── test_api.py         # API test script
└── README.md           # This file
```

### Key Features
- **Automatic Expiration**: Memberships are automatically marked as expired when accessed after expiration date
- **Usage Validation**: Before allowing feature use, system validates limits and expiration
- **Mock Payment**: Simulated payment gateway for testing
- **Admin Controls**: Full admin capabilities for membership management
- **Flexible Limits**: Support for limited and unlimited usage plans

## Future Enhancements

- Database integration (PostgreSQL/MySQL)
- Authentication and authorization
- Real payment gateway integration
- Webhook support for payment notifications
- Advanced analytics and reporting
- Rate limiting and caching