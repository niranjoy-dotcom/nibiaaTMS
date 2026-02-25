"""
Thingsboard Integration Module for NibiaaManager FastAPI
Provides service layer for Thingsboard API operations using API Key authentication
"""

import os
from typing import Dict, List, Optional, Any
from test_thingsboard_api_key import ThingsboardAPITester
import logging

logger = logging.getLogger(__name__)


class ThingsboardService:
    """
    Service class for all Thingsboard operations
    Centralizes API interactions for NibiaaManager
    """
    
    _instance = None
    
    def __new__(cls):
        """Singleton pattern - ensure only one instance"""
        if cls._instance is None:
            cls._instance = super(ThingsboardService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize Thingsboard Service"""
        if self._initialized:
            return
        
        self.base_url = os.getenv("THINGSBOARD_URL", "http://localhost:8080")
        self.api_key = os.getenv("THINGSBOARD_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "THINGSBOARD_API_KEY not set. "
                "Please set it in .env file or environment variables"
            )
        
        self.api = ThingsboardAPITester(self.base_url, self.api_key)
        self._initialized = True
        logger.info("ThingsboardService initialized successfully")
    
    # ==================== TENANT OPERATIONS ====================
    
    def create_tenant(self, tenant_name: str, region: str = "US") -> Dict[str, Any]:
        """
        Create a new tenant
        
        Args:
            tenant_name: Name of the tenant
            region: Region code
            
        Returns:
            Response from Thingsboard API
        """
        logger.info(f"Creating tenant: {tenant_name}")
        return self.api.create_tenant(tenant_name, region)
    
    def list_tenants(self, page_size: int = 100, page: int = 0) -> Dict[str, Any]:
        """
        List all tenants with pagination
        
        Args:
            page_size: Number of tenants per page
            page: Page number (0-indexed)
            
        Returns:
            List of tenants
        """
        logger.info(f"Listing tenants (page: {page}, size: {page_size})")
        return self.api.list_all_tenants(page_size, page)
    
    def get_tenant_profiles(self) -> Dict[str, Any]:
        """
        Get all tenant profiles
        
        Returns:
            List of tenant profiles
        """
        logger.info("Fetching tenant profiles")
        return self.api.get_tenant_profiles()
    
    # ==================== USER OPERATIONS ====================
    
    def get_tenant_users(self, tenant_id: str) -> Dict[str, Any]:
        """
        Get all users in a specific tenant
        
        Args:
            tenant_id: ID of the tenant
            
        Returns:
            List of users in tenant
        """
        logger.info(f"Getting users for tenant: {tenant_id}")
        return self.api.get_users_in_tenant(tenant_id)
    
    def enable_user(self, user_id: str) -> Dict[str, Any]:
        """
        Enable a user account
        
        Args:
            user_id: User ID to enable
            
        Returns:
            Response from API
        """
        logger.info(f"Enabling user: {user_id}")
        return self.api.enable_disable_user(user_id, enabled=True)
    
    def disable_user(self, user_id: str) -> Dict[str, Any]:
        """
        Disable a user account
        
        Args:
            user_id: User ID to disable
            
        Returns:
            Response from API
        """
        logger.info(f"Disabling user: {user_id}")
        return self.api.enable_disable_user(user_id, enabled=False)
    
    def get_all_users(self, page_size: int = 100, page: int = 0) -> Dict[str, Any]:
        """
        Get all users in the system
        
        Args:
            page_size: Users per page
            page: Page number
            
        Returns:
            List of users
        """
        logger.info(f"Getting all users (page: {page}, size: {page_size})")
        return self.api.get_user_infos(page_size, page)
    
    def create_user_with_activation(self, email: str, password: str) -> Dict[str, Any]:
        """
        Create a new user and send activation email
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Response from API
        """
        logger.info(f"Creating user and sending activation email: {email}")
        return self.api.send_activation_mail(email, password)
    
    # ==================== AUTHENTICATION OPERATIONS ====================
    
    def login(self, username: str, password: str) -> Dict[str, Any]:
        """
        Login user (returns JWT for reference)
        
        Args:
            username: Username
            password: Password
            
        Returns:
            Login response with JWT token
        """
        logger.info(f"Logging in user: {username}")
        return self.api.login(username, password)
    
    def logout(self) -> Dict[str, Any]:
        """
        Logout current user
        
        Returns:
            Logout response
        """
        logger.info("Logging out user")
        return self.api.logout()
    
    # ==================== REPOSITORY OPERATIONS ====================
    
    def get_repository_settings(self) -> Dict[str, Any]:
        """
        Get repository settings
        
        Returns:
            Repository settings
        """
        logger.info("Getting repository settings")
        return self.api.get_repository_settings()
    
    def create_update_repository(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update repository settings
        
        Args:
            settings: Repository configuration
            
        Returns:
            Updated settings
        """
        logger.info("Creating/updating repository settings")
        return self.api.create_update_repository_settings(settings)
    
    def check_repository_access(self, repository_url: str) -> Dict[str, Any]:
        """
        Check if the application can access a repository
        
        Args:
            repository_url: URL of the repository
            
        Returns:
            Access check result
        """
        logger.info(f"Checking repository access: {repository_url}")
        return self.api.check_repository_access(repository_url)
    
    def check_repository_exists(self, repository_url: str) -> Dict[str, Any]:
        """
        Check if repository already exists
        
        Args:
            repository_url: URL of the repository
            
        Returns:
            Existence check result
        """
        logger.info(f"Checking if repository exists: {repository_url}")
        return self.api.check_repository_exists(repository_url)


# Convenience function for getting the service instance
def get_thingsboard_service() -> ThingsboardService:
    """
    Get or create Thingsboard service instance
    
    Returns:
        ThingsboardService instance
    """
    return ThingsboardService()
