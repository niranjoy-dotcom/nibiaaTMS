# Thingsboard API Key Integration Index

## 📚 Documentation Files (Read These)

Start here based on your needs:

### 🚀 [THINGSBOARD_QUICK_START.md](THINGSBOARD_QUICK_START.md)
**Best for**: Getting up and running in 5 minutes
- Quick 3-step setup
- Common usage examples
- All endpoints at a glance
- Quick troubleshooting

### 📖 [THINGSBOARD_README.md](THINGSBOARD_README.md)
**Best for**: Complete overview and summary
- What was created
- All 14 endpoints
- Step-by-step guide
- FAQ and next steps

### 📚 [THINGSBOARD_API_KEY_GUIDE.md](THINGSBOARD_API_KEY_GUIDE.md)
**Best for**: Detailed reference and learning
- Complete setup instructions
- Security best practices
- Integration examples
- Troubleshooting guide
- Production deployment tips

### 🔧 [THINGSBOARD_CURL_EXAMPLES.md](THINGSBOARD_CURL_EXAMPLES.md)
**Best for**: Testing without Python
- Curl examples for all endpoints
- Manual testing scripts
- Error response examples
- Tips & tricks

---

## 💻 Code Files (Use These)

### [test_thingsboard_api_key.py](test_thingsboard_api_key.py)
**Main testing module** - Use this to test Thingsboard APIs

```python
from test_thingsboard_api_key import ThingsboardAPITester

api = ThingsboardAPITester("http://localhost:8080", "your_api_key")
result = api.list_all_tenants()
print(result)
```

**Contains:**
- `ThingsboardAPITester` class - Core API client
- `ThingsboardTestSuite` class - Test suite runner
- All 14 endpoints implemented

### [app/thingsboard_service.py](app/thingsboard_service.py)
**Service layer** - Use this to integrate with FastAPI

```python
from app.thingsboard_service import get_thingsboard_service

service = get_thingsboard_service()
tenants = service.list_tenants()
```

**Contains:**
- `ThingsboardService` class - Singleton service
- High-level methods for all operations
- Logging and error handling

### [routers/thingsboard_example.py](routers/thingsboard_example.py)
**FastAPI router** - Ready-to-use FastAPI endpoints

```python
# In your main.py
from routers.thingsboard_example import router as tb_router
app.include_router(tb_router)

# Now you have:
# GET /api/thingsboard/tenants
# POST /api/thingsboard/tenants
# POST /api/thingsboard/users/enable/{user_id}
# ... and more
```

---

## ⚙️ Configuration Files

### [.env.thingsboard.example](.env.thingsboard.example)
**Configuration template**

Copy this to `.env.thingsboard` and fill in your values:
```bash
cp .env.thingsboard.example .env.thingsboard
nano .env.thingsboard
```

---

## 🎯 Quick Navigation by Task

### "I want to test endpoints right now"
1. Read: [THINGSBOARD_QUICK_START.md](THINGSBOARD_QUICK_START.md)
2. Copy: `.env.thingsboard.example` → `.env.thingsboard`
3. Run: `python test_thingsboard_api_key.py`

### "I want to use curl to test"
1. Read: [THINGSBOARD_CURL_EXAMPLES.md](THINGSBOARD_CURL_EXAMPLES.md)
2. Set: `export THINGSBOARD_API_KEY=your_key`
3. Copy: A curl example and run it

### "I want to integrate with FastAPI"
1. Read: [THINGSBOARD_README.md](THINGSBOARD_README.md) - FastAPI Integration section
2. Use: `app/thingsboard_service.py` in your routers
3. Or: Include `routers/thingsboard_example.py` in main.py

### "I need complete documentation"
1. Read: [THINGSBOARD_API_KEY_GUIDE.md](THINGSBOARD_API_KEY_GUIDE.md)
2. Learn: Setup, security, integration, troubleshooting

### "I'm having issues"
1. Check: [THINGSBOARD_API_KEY_GUIDE.md](THINGSBOARD_API_KEY_GUIDE.md#troubleshooting)
2. Try: The troubleshooting steps
3. Test: With curl examples from [THINGSBOARD_CURL_EXAMPLES.md](THINGSBOARD_CURL_EXAMPLES.md)

---

## 📋 All 14 API Endpoints

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

---

## 🔄 What Changed

### Why API Key Instead of JWT?
- ✅ JWT is deprecated in Thingsboard
- ✅ API Keys are simpler (no refresh cycles)
- ✅ Better security model (easy to revoke)
- ✅ Service-to-service communication is cleaner

### Authentication Change
```diff
- # Old: JWT Token in Authorization header
- -H "Authorization: Bearer JWT_TOKEN"

+ # New: API Key in X-API-Key header
+ -H "X-API-Key: API_KEY"
```

---

## ✅ Verification Checklist

- [ ] API key created in Thingsboard admin panel
- [ ] `.env.thingsboard` file configured
- [ ] Ran `python test_thingsboard_api_key.py` successfully
- [ ] All tests passed
- [ ] .env.thingsboard added to .gitignore
- [ ] Service imported in your code
- [ ] (Optional) Router included in main.py

---

## 🚀 Getting Started

### 1. Setup (2 minutes)
```bash
cd backend
cp .env.thingsboard.example .env.thingsboard
# Edit .env.thingsboard with your values
```

### 2. Test (1 minute)
```bash
python test_thingsboard_api_key.py
```

### 3. Integrate (Choose one)

**Option A: Direct usage**
```python
from test_thingsboard_api_key import ThingsboardAPITester
api = ThingsboardAPITester(url, key)
result = api.list_all_tenants()
```

**Option B: Via service layer**
```python
from app.thingsboard_service import get_thingsboard_service
service = get_thingsboard_service()
result = service.list_tenants()
```

**Option C: Via FastAPI router**
```python
from routers.thingsboard_example import router
app.include_router(router)
# Now you have endpoints like: GET /api/thingsboard/tenants
```

---

## 📞 Need Help?

1. **Quick answers**: Check [THINGSBOARD_QUICK_START.md](THINGSBOARD_QUICK_START.md)
2. **Detailed answers**: Check [THINGSBOARD_API_KEY_GUIDE.md](THINGSBOARD_API_KEY_GUIDE.md)
3. **Issues**: Check troubleshooting section in GUIDE
4. **Test endpoints**: Use [THINGSBOARD_CURL_EXAMPLES.md](THINGSBOARD_CURL_EXAMPLES.md)

---

## 📊 File Structure

```
backend/
├── test_thingsboard_api_key.py          # Main testing module
├── app/
│   └── thingsboard_service.py           # Service layer
├── routers/
│   └── thingsboard_example.py           # FastAPI router
├── .env.thingsboard.example             # Configuration template
├── THINGSBOARD_README.md                # Summary and overview
├── THINGSBOARD_QUICK_START.md           # 5-minute guide
├── THINGSBOARD_API_KEY_GUIDE.md         # Complete reference
├── THINGSBOARD_CURL_EXAMPLES.md         # Curl testing examples
└── THINGSBOARD_INDEX.md                 # This file
```

---

## 💡 Tips

- Always use `.env` files for sensitive data
- Test with curl before Python for debugging
- Check Thingsboard logs for detailed errors
- Keep API keys rotated and minimal permissions
- Use the service layer for better code organization

---

**Ready to get started?** → [THINGSBOARD_QUICK_START.md](THINGSBOARD_QUICK_START.md)
