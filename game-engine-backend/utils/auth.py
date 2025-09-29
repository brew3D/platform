"""
Authentication utilities using JWT tokens.

Provides:
- generate_token(user_id): Create JWT token with user_id payload
- verify_token(token): Verify and decode JWT token, return user_id
- requires_auth decorator for protecting endpoints

Environment:
- SECRET_KEY: JWT signing secret (required)
- JWT_EXPIRY_HOURS: Token expiry in hours (default: 24)
"""

import os
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional

import jwt
from flask import request, jsonify

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-prod")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))


def generate_token(user_id: str) -> str:
    """Generate JWT token for user_id.
    
    Args:
        user_id: User identifier
        
    Returns:
        JWT token string
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id.
    
    Args:
        token: JWT token string
        
    Returns:
        user_id if valid, None if invalid/expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload.get("user_id")
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def requires_auth(f):
    """Decorator to require authentication for endpoints.
    
    Expects Authorization header: "Bearer <token>"
    Adds user_id to request context as request.user_id
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({
                "error": "missing_auth",
                "code": 401,
                "details": {"message": "Authorization header required"}
            }), 401
        
        token = auth_header.split(" ")[1]
        user_id = verify_token(token)
        if not user_id:
            return jsonify({
                "error": "invalid_token",
                "code": 401,
                "details": {"message": "Invalid or expired token"}
            }), 401
        
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated_function
