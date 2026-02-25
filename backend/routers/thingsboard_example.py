"""
Example FastAPI Router for Thingsboard Integration
Demonstrates how to use ThingsboardService in your FastAPI endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from ..app.thingsboard_service import get_thingsboard_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/thingsboard",
    tags=["thingsboard"]
)

# Get service instance
tb_service = get_thingsboard_service()


# ==================== TENANT ENDPOINTS ====================

@router.post("/tenants")
async def create_tenant(
    tenant_name: str,
    region: str = "US"
):
    """
    Create a new tenant in Thingsboard
    """
    try:
        result = tb_service.create_tenant(tenant_name, region)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to create tenant: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants")
async def list_tenants(
    page_size: int = Query(100, ge=1, le=1000),
    page: int = Query(0, ge=0)
):
    """
    List all tenants with pagination
    """
    try:
        result = tb_service.list_tenants(page_size, page)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to list tenants: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenant-profiles")
async def get_tenant_profiles():
    """
    Get all tenant profiles
    """
    try:
        result = tb_service.get_tenant_profiles()
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to get tenant profiles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== USER ENDPOINTS ====================

@router.get("/tenants/{tenant_id}/users")
async def get_tenant_users(tenant_id: str):
    """
    Get all users in a specific tenant
    """
    try:
        result = tb_service.get_tenant_users(tenant_id)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to get tenant users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def get_all_users(
    page_size: int = Query(100, ge=1, le=1000),
    page: int = Query(0, ge=0)
):
    """
    Get all users in the system
    """
    try:
        result = tb_service.get_all_users(page_size, page)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to get all users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/enable/{user_id}")
async def enable_user(user_id: str):
    """
    Enable a user account
    """
    try:
        result = tb_service.enable_user(user_id)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "message": f"User {user_id} enabled", "data": result}
    except Exception as e:
        logger.error(f"Failed to enable user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/disable/{user_id}")
async def disable_user(user_id: str):
    """
    Disable a user account
    """
    try:
        result = tb_service.disable_user(user_id)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "message": f"User {user_id} disabled", "data": result}
    except Exception as e:
        logger.error(f"Failed to disable user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/create-with-activation")
async def create_user_with_activation(
    email: str,
    password: str
):
    """
    Create a new user and send activation email
    """
    try:
        if len(password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        result = tb_service.create_user_with_activation(email, password)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "message": "User created and activation email sent", "data": result}
    except Exception as e:
        logger.error(f"Failed to create user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== AUTHENTICATION ENDPOINTS ====================

@router.post("/auth/login")
async def login(username: str, password: str):
    """
    Login user
    """
    try:
        result = tb_service.login(username, password)
        if "error" in result:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Login failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auth/logout")
async def logout():
    """
    Logout user
    """
    try:
        result = tb_service.logout()
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== REPOSITORY ENDPOINTS ====================

@router.get("/repository-settings")
async def get_repository_settings():
    """
    Get repository settings
    """
    try:
        result = tb_service.get_repository_settings()
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to get repository settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/repository-settings")
async def create_update_repository(settings: dict):
    """
    Create or update repository settings
    """
    try:
        result = tb_service.create_update_repository(settings)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "message": "Repository settings updated", "data": result}
    except Exception as e:
        logger.error(f"Failed to update repository settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/repository/check-access")
async def check_repository_access(repository_url: str):
    """
    Check if repository is accessible
    """
    try:
        result = tb_service.check_repository_access(repository_url)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "data": result}
    except Exception as e:
        logger.error(f"Failed to check repository access: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/repository/check-exists")
async def check_repository_exists(repository_url: str):
    """
    Check if repository already exists
    """
    try:
        result = tb_service.check_repository_exists(repository_url)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"success": True, "exists": result}
    except Exception as e:
        logger.error(f"Failed to check repository existence: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== HEALTH CHECK ====================

@router.get("/health")
async def thingsboard_health_check():
    """
    Check Thingsboard connectivity
    """
    try:
        # Try to list tenants as a connectivity check
        result = tb_service.list_tenants(page_size=1, page=0)
        if "error" in result:
            return {"status": "error", "message": "Cannot connect to Thingsboard"}
        return {"status": "healthy", "message": "Connected to Thingsboard"}
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "message": str(e)}
