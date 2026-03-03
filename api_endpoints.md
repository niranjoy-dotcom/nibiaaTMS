# Nibiaa Manager API Documentation

## `POST` /api/token
**Summary:** Login For Access Token
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/x-www-form-urlencoded`, Schema: `Body_login_for_access_token_api_token_post`

---

## `POST` /api/users/
**Summary:** Create User
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/json`, Schema: `UserCreate`

---

## `GET` /api/users/
**Summary:** Read Users
**Tags:** ['Authentication']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional
- `role` (query, unknown) - Optional

---

## `POST` /api/users/assign-tenant
**Summary:** Assign Tenant
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/json`, Schema: `UserTenantAssign`

---

## `POST` /api/auth/forgot-password
**Summary:** Forgot Password
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/json`, Schema: `Body_forgot_password_api_auth_forgot_password_post`

---

## `POST` /api/auth/reset-password
**Summary:** Reset Password
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/json`, Schema: `Body_reset_password_api_auth_reset_password_post`

---

## `POST` /api/auth/activate
**Summary:** Activate Account
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/json`, Schema: `Body_activate_account_api_auth_activate_post`

---

## `GET` /api/users/me
**Summary:** Read Users Me
**Tags:** ['Authentication']

---

## `PUT` /api/users/me
**Summary:** Update User Me
**Tags:** ['Authentication']

**Request Body:**
- Media type: `application/json`, Schema: `UserUpdate`

---

## `POST` /api/users/me/avatar
**Summary:** Upload Avatar
**Tags:** ['Authentication']

**Request Body:**
- Media type: `multipart/form-data`, Schema: `Body_upload_avatar_api_users_me_avatar_post`

---

## `PUT` /api/users/{user_id}
**Summary:** Update User
**Tags:** ['Authentication']

**Parameters:**
- `user_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `UserUpdateAdmin`

---

## `DELETE` /api/users/{user_id}
**Summary:** Delete User
**Tags:** ['Authentication']

**Parameters:**
- `user_id` (path, integer) - Required

---

## `GET` /api/notifications/count
**Summary:** Get Notification Count
**Tags:** ['Authentication']

---

## `GET` /api/notifications
**Summary:** Get Notifications
**Tags:** ['Authentication']

---

## `POST` /api/tb/login
**Summary:** Login Tb
**Tags:** ['ThingsBoard']

**Request Body:**
- Media type: `application/json`, Schema: `LoginRequest`

---

## `POST` /api/tb/auth/token
**Summary:** Refresh Tb Token
**Tags:** ['ThingsBoard']

**Request Body:**
- Media type: `application/json`, Schema: `Body_refresh_tb_token_api_tb_auth_token_post`

---

## `POST` /api/tb/auth/logout
**Summary:** Logout Tb
**Tags:** ['ThingsBoard']

**Parameters:**
- `x-tb-token` (header, string) - Optional

---

## `GET` /api/tb/tenants
**Summary:** Get Tenants
**Tags:** ['ThingsBoard']

**Parameters:**
- `x-tb-token` (header, string) - Optional

---

## `POST` /api/tb/tenants
**Summary:** Create Tenant
**Tags:** ['ThingsBoard']

**Parameters:**
- `x-tb-token` (header, string) - Optional

**Request Body:**
- Media type: `application/json`, Schema: `TenantCreate`

---

## `GET` /api/tb/profiles
**Summary:** Get Profiles
**Tags:** ['ThingsBoard']

**Parameters:**
- `x-tb-token` (header, string) - Optional

---

## `POST` /api/tb/users
**Summary:** Create Tb User
**Tags:** ['ThingsBoard']

**Parameters:**
- `x-tb-token` (header, string) - Optional

**Request Body:**
- Media type: `application/json`, Schema: `TBUserCreate`

---

## `PUT` /api/tb/tenant/{tenant_id}
**Summary:** Update Tenant
**Tags:** ['ThingsBoard']

**Parameters:**
- `tenant_id` (path, string) - Required
- `x-tb-token` (header, string) - Optional

**Request Body:**
- Media type: `application/json`, Schema: `Body_update_tenant_api_tb_tenant__tenant_id__put`

---

## `GET` /api/tb/tenant/{tenant_id}/users
**Summary:** Get Tenant Users
**Tags:** ['ThingsBoard']

**Parameters:**
- `tenant_id` (path, string) - Required
- `x-tb-token` (header, string) - Optional

---

## `POST` /api/tb/tenant/{tenant_id}/deactivate-safe
**Summary:** Deactivate Safe
**Tags:** ['ThingsBoard']

**Parameters:**
- `tenant_id` (path, string) - Required
- `x-tb-token` (header, string) - Optional

---

## `POST` /api/tb/tenant/{tenant_id}/activate-safe
**Summary:** Activate Safe
**Tags:** ['ThingsBoard']

**Parameters:**
- `tenant_id` (path, string) - Required
- `x-tb-token` (header, string) - Optional

---

## `POST` /api/tb/tenant/{tenant_id}/schedule-deactivation
**Summary:** Schedule Deactivation
**Tags:** ['ThingsBoard']

**Parameters:**
- `tenant_id` (path, string) - Required
- `x-tb-token` (header, string) - Optional

**Request Body:**
- Media type: `application/json`, Schema: `Body_schedule_deactivation_api_tb_tenant__tenant_id__schedule_deactivation_post`

---

## `POST` /api/tb/user/{user_id}/toggle
**Summary:** Toggle User
**Tags:** ['ThingsBoard']

**Parameters:**
- `user_id` (path, string) - Required
- `x-tb-token` (header, string) - Optional

**Request Body:**
- Media type: `application/json`, Schema: `Body_toggle_user_api_tb_user__user_id__toggle_post`

---

## `POST` /api/tb/profile
**Summary:** Create Profile
**Tags:** ['ThingsBoard']

**Parameters:**
- `x-tb-token` (header, string) - Optional

**Request Body:**
- Media type: `application/json`, Schema: `Body_create_profile_api_tb_profile_post`

---

## `POST` /api/projects/
**Summary:** Create Project
**Tags:** ['Projects']

**Request Body:**
- Media type: `application/json`, Schema: `ProjectCreate`

---

## `GET` /api/projects/
**Summary:** Read Projects
**Tags:** ['Projects']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `GET` /api/projects/{project_id}
**Summary:** Read Project
**Tags:** ['Projects']

**Parameters:**
- `project_id` (path, integer) - Required

---

## `PUT` /api/projects/{project_id}
**Summary:** Update Project
**Tags:** ['Projects']

**Parameters:**
- `project_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `ProjectUpdate`

---

## `PUT` /api/projects/{project_id}/assign/{user_id}
**Summary:** Assign Project
**Tags:** ['Projects']

**Parameters:**
- `project_id` (path, integer) - Required
- `user_id` (path, integer) - Required

---

## `POST` /api/projects/{project_id}/tasks/
**Summary:** Create Task For Project
**Tags:** ['Projects']

**Parameters:**
- `project_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `TaskCreate`

---

## `PUT` /api/projects/tasks/{task_id}
**Summary:** Update Task
**Tags:** ['Projects']

**Parameters:**
- `task_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `TaskUpdate`

---

## `GET` /api/admin/users
**Summary:** Read Users
**Tags:** ['Technical Admin']

**Parameters:**
- `role` (query, unknown) - Optional
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `GET` /api/admin/stats/dashboard
**Summary:** Get Dashboard Stats
**Tags:** ['Technical Admin']

---

## `GET` /api/admin/stats/free-developers
**Summary:** Get Free Developers
**Tags:** ['Technical Admin']

---

## `GET` /api/admin/stats/project-assignments
**Summary:** Get Project Assignment Stats
**Tags:** ['Technical Admin']

**Parameters:**
- `days` (query, unknown) - Optional

---

## `POST` /api/admin/usecases
**Summary:** Create Usecase
**Tags:** ['Technical Admin']

**Request Body:**
- Media type: `application/json`, Schema: `UsecaseCreate`

---

## `GET` /api/admin/usecases
**Summary:** Read Usecases
**Tags:** ['Technical Admin']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `DELETE` /api/admin/usecases/{usecase_id}
**Summary:** Delete Usecase
**Tags:** ['Technical Admin']

**Parameters:**
- `usecase_id` (path, integer) - Required

---

## `PUT` /api/admin/usecases/{usecase_id}
**Summary:** Update Usecase
**Tags:** ['Technical Admin']

**Parameters:**
- `usecase_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `UsecaseUpdate`

---

## `POST` /api/admin/templates
**Summary:** Create Template
**Tags:** ['Technical Admin']

**Request Body:**
- Media type: `application/json`, Schema: `TaskTemplateCreate`

---

## `GET` /api/admin/templates
**Summary:** Read Templates
**Tags:** ['Technical Admin']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `DELETE` /api/admin/templates/{template_id}
**Summary:** Delete Template
**Tags:** ['Technical Admin']

**Parameters:**
- `template_id` (path, integer) - Required

---

## `PUT` /api/admin/templates/{template_id}
**Summary:** Update Template
**Tags:** ['Technical Admin']

**Parameters:**
- `template_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `TaskTemplateUpdate`

---

## `POST` /api/admin/plan-mappings
**Summary:** Create Plan Mapping
**Tags:** ['Technical Admin']

**Request Body:**
- Media type: `application/json`, Schema: `PlanProfileMappingCreate`

---

## `GET` /api/admin/plan-mappings
**Summary:** Read Plan Mappings
**Tags:** ['Technical Admin']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `DELETE` /api/admin/plan-mappings/{mapping_id}
**Summary:** Delete Plan Mapping
**Tags:** ['Technical Admin']

**Parameters:**
- `mapping_id` (path, integer) - Required

---

## `PUT` /api/admin/plan-mappings/{mapping_id}
**Summary:** Update Plan Mapping
**Tags:** ['Technical Admin']

**Parameters:**
- `mapping_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `PlanProfileMappingUpdate`

---

## `GET` /api/admin/tb-profiles
**Summary:** Read Tb Profiles
**Tags:** ['Technical Admin']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `GET` /api/zoho/auth
**Summary:** Zoho Auth
**Tags:** ['zoho']
**Description:** Initiate Zoho OAuth flow

---

## `GET` /api/zoho/callback
**Summary:** Zoho Callback
**Tags:** ['zoho']
**Description:** Handle Zoho OAuth callback

**Parameters:**
- `code` (query, string) - Optional
- `error` (query, string) - Optional

---

## `GET` /api/zoho/plans
**Summary:** Get Zoho Plans
**Tags:** ['zoho']
**Description:** Fetch ACTIVE plans from Local DB

---

## `GET` /api/zoho/products
**Summary:** Get Zoho Products
**Tags:** ['zoho']
**Description:** Fetch ACTIVE products from Local DB

---

## `GET` /api/zoho/plans/sync
**Summary:** Sync Zoho Plans Route
**Tags:** ['zoho']

---

## `GET` /api/zoho/products/sync
**Summary:** Sync Zoho Products Route
**Tags:** ['zoho']

---

## `GET` /api/zoho/subscriptions
**Summary:** Get Zoho Subscriptions
**Tags:** ['zoho']

---

## `GET` /api/zoho/customers
**Summary:** Get Zoho Customers
**Tags:** ['zoho']

---

## `GET` /api/zoho/stored_tenants
**Summary:** Get Stored Zoho Tenants
**Tags:** ['zoho']
**Description:** Get Zoho Tenants stored in local database. By default excludes those already created as Projects.

**Parameters:**
- `include_provisioned` (query, boolean) - Optional

---

## `POST` /api/zoho/provision/{subscription_id}
**Summary:** Provision Zoho Tenant
**Tags:** ['zoho']
**Description:** Auto-populate Tenant Name from Zoho Tenant Customer Name.
Determine Use Case by looking at Zoho Prefix in Plan Code.
Determine Plan/Profile from Plan Profile Mapping.
Create Thingsboard Tenant and Tenant Admin.
Create Project in local DB (Technical Manager is optional).
Send Email to Customer.

**Parameters:**
- `subscription_id` (path, string) - Required

**Request Body:**
- Media type: `application/json`, Schema: `Body_provision_zoho_tenant_api_zoho_provision__subscription_id__post`

---

## `POST` /api/teams
**Summary:** Create Team
**Tags:** ['Teams']

**Request Body:**
- Media type: `application/json`, Schema: `TeamCreate`

---

## `GET` /api/teams
**Summary:** Read Teams
**Tags:** ['Teams']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `POST` /api/teams/types
**Summary:** Create Team Type
**Tags:** ['Teams']

**Request Body:**
- Media type: `application/json`, Schema: `TeamTypeCreate`

---

## `GET` /api/teams/types
**Summary:** Read Team Types
**Tags:** ['Teams']

**Parameters:**
- `skip` (query, integer) - Optional
- `limit` (query, integer) - Optional

---

## `DELETE` /api/teams/types/{type_id}
**Summary:** Delete Team Type
**Tags:** ['Teams']

**Parameters:**
- `type_id` (path, integer) - Required

---

## `POST` /api/teams/types/{type_id}/task-types
**Summary:** Create Task Type
**Tags:** ['Teams']

**Parameters:**
- `type_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `TaskTypeCreate`

---

## `GET` /api/teams/types/{type_id}/task-types
**Summary:** Read Task Types
**Tags:** ['Teams']

**Parameters:**
- `type_id` (path, integer) - Required

---

## `DELETE` /api/teams/task-types/{task_type_id}
**Summary:** Delete Task Type
**Tags:** ['Teams']

**Parameters:**
- `task_type_id` (path, integer) - Required

---

## `GET` /api/teams/{team_id}
**Summary:** Read Team
**Tags:** ['Teams']

**Parameters:**
- `team_id` (path, integer) - Required

---

## `PUT` /api/teams/{team_id}
**Summary:** Update Team
**Tags:** ['Teams']

**Parameters:**
- `team_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `TeamUpdate`

---

## `DELETE` /api/teams/{team_id}
**Summary:** Delete Team
**Tags:** ['Teams']

**Parameters:**
- `team_id` (path, integer) - Required

---

## `POST` /api/teams/{team_id}/members
**Summary:** Add Team Member
**Tags:** ['Teams']

**Parameters:**
- `team_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `TeamMemberCreate`

---

## `DELETE` /api/teams/{team_id}/members/{user_id}
**Summary:** Remove Team Member
**Tags:** ['Teams']

**Parameters:**
- `team_id` (path, integer) - Required
- `user_id` (path, integer) - Required

---

## `GET` /api/widgets/
**Summary:** Read Widgets
**Tags:** ['widgets']

---

## `POST` /api/widgets/
**Summary:** Create Widget
**Tags:** ['widgets']

**Request Body:**
- Media type: `application/json`, Schema: `WidgetCreate`

---

## `DELETE` /api/widgets/{widget_id}
**Summary:** Delete Widget
**Tags:** ['widgets']

**Parameters:**
- `widget_id` (path, integer) - Required

---

## `PUT` /api/widgets/{widget_id}
**Summary:** Update Widget
**Tags:** ['widgets']

**Parameters:**
- `widget_id` (path, integer) - Required

**Request Body:**
- Media type: `application/json`, Schema: `WidgetUpdate`

---

## `GET` /api/api_health
**Summary:** Read Root

---

## `GET` /{full_path}
**Summary:** Serve Spa

**Parameters:**
- `full_path` (path, string) - Required

---
