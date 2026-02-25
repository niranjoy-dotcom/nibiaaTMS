# Thingsboard API Key Authentication - Quick Start

## ⚡ Quick Setup (5 minutes)

### 1. Get Your API Key
```bash
# Login to your Thingsboard instance
# Navigate to Settings → API Keys → Create New API Key
# Copy the key
```

### 2. Configure Environment
```bash
cd backend
cp .env.thingsboard.example .env.thingsboard

# Edit .env.thingsboard with your details:
# THINGSBOARD_URL=http://localhost:8080
# THINGSBOARD_API_KEY=your_api_key_here
```

### 3. Run Tests
```bash
python test_thingsboard_api_key.py
```

## 📝 Usage Examples

### Example 1: List All Tenants
```python
from test_thingsboard_api_key import ThingsboardAPITester

api = ThingsboardAPITester("http://localhost:8080", "your_api_key")
tenants = api.list_all_tenants()
print(tenants)
```

### Example 2: Create New Tenant
```python
result = api.create_tenant("MyNewTenant", region="US")
print(result)
```

### Example 3: Get Users in Tenant
```python
users = api.get_users_in_tenant("tenant_id_here")
print(users)
```

### Example 4: Enable/Disable User
```python
# Enable user
api.enable_disable_user("user_id", enabled=True)

# Disable user
api.enable_disable_user("user_id", enabled=False)
```

### Example 5: Using Service in FastAPI
```python
# In your FastAPI router
from app.thingsboard_service import get_thingsboard_service

@router.get("/my-tenants")
async def get_my_tenants():
    tb_service = get_thingsboard_service()
    tenants = tb_service.list_tenants()
    return tenants
```

## 🔍 All 14 API Endpoints

| # | Method | Endpoint | Python Method |
|---|--------|----------|---------------|
| 1 | POST | `/api/tenant` | `create_tenant()` |
| 2 | GET | `/api/tenant` | `list_all_tenants()` |
| 3 | GET | `/api/tenantProfiles` | `get_tenant_profiles()` |
| 4 | GET | `/api/tenant/{id}/users` | `get_users_in_tenant()` |
| 5 | POST | `/api/user/{id}/userCredentialsEnabled` | `enable_disable_user()` |
| 6 | GET | `/api/userInfos/all` | `get_user_infos()` |
| 7 | POST | `/api/user` | `send_activation_mail()` |
| 8 | POST | `/api/auth/login` | `login()` |
| 9 | POST | `/api/auth/logout` | `logout()` |
| 11 | GET | `/api/admin/repositorySettings` | `get_repository_settings()` |
| 12 | POST | `/api/admin/repositorySettings` | `create_update_repository_settings()` |
| 13 | POST | `/api/admin/repositorySettings/checkAccess` | `check_repository_access()` |
| 14 | GET | `/api/admin/repositorySettings/exists` | `check_repository_exists()` |

## 📦 Files Created

1. **test_thingsboard_api_key.py** - Main API testing module
2. **app/thingsboard_service.py** - Service layer for FastAPI integration
3. **routers/thingsboard_example.py** - Example FastAPI router endpoints
4. **.env.thingsboard.example** - Environment configuration template
5. **THINGSBOARD_API_KEY_GUIDE.md** - Detailed documentation

## 🚀 FastAPI Integration

### Add to main.py:
```python
from routers.thingsboard_example import router as tb_router

app.include_router(tb_router)
```

### Available Endpoints:
- `POST /api/thingsboard/tenants` - Create tenant
- `GET /api/thingsboard/tenants` - List tenants
- `GET /api/thingsboard/tenant-profiles` - Get profiles
- `GET /api/thingsboard/tenants/{tenant_id}/users` - Get users
- `POST /api/thingsboard/users/enable/{user_id}` - Enable user
- `POST /api/thingsboard/users/disable/{user_id}` - Disable user
- `GET /api/thingsboard/users` - Get all users
- `POST /api/thingsboard/users/create-with-activation` - Create user
- `GET /api/thingsboard/repository-settings` - Get repo settings
- `POST /api/thingsboard/repository-settings` - Update repo settings
- `POST /api/thingsboard/repository/check-access` - Check access
- `GET /api/thingsboard/repository/check-exists` - Check existence
- `GET /api/thingsboard/health` - Health check

## ⚙️ Configuration

### Environment Variables
```bash
THINGSBOARD_URL=http://localhost:8080
THINGSBOARD_API_KEY=your_api_key_here
```

### Load from .env
```python
from dotenv import load_dotenv
load_dotenv('.env.thingsboard')
```

## 🔒 Security

✅ **Never commit API keys**
```bash
echo ".env.thingsboard" >> .gitignore
```

✅ **Use environment variables**
```bash
export THINGSBOARD_API_KEY=your_key
```

✅ **Rotate keys regularly** - Every 90 days recommended

## 🐛 Troubleshooting

**Error: "401 Unauthorized"**
- Check API key is correct
- Verify API key hasn't been revoked
- Generate new key if needed

**Error: "Connection refused"**
- Verify Thingsboard is running
- Check THINGSBOARD_URL is correct

**Error: "404 Not Found"**
- Verify endpoint path
- Check resource ID exists

## 📚 Additional Resources

- [Thingsboard Docs](https://thingsboard.io/docs/)
- [API Reference](https://thingsboard.io/docs/reference/rest-api/)
- [Full Guide](THINGSBOARD_API_KEY_GUIDE.md)

## ✅ Testing Checklist

- [ ] API key created in Thingsboard
- [ ] .env.thingsboard configured
- [ ] Run: `python test_thingsboard_api_key.py`
- [ ] All tests pass
- [ ] Service integrated in FastAPI
- [ ] Endpoints accessible

## 💡 Next Steps

1. ✅ Test with: `python test_thingsboard_api_key.py`
2. ✅ Integrate service: Import `ThingsboardService`
3. ✅ Update your FastAPI routers
4. ✅ Deploy with environment variables
5. ✅ Monitor API usage

---

**Questions?** See [THINGSBOARD_API_KEY_GUIDE.md](THINGSBOARD_API_KEY_GUIDE.md) for detailed documentation.
