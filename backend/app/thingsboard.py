import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("TB_BASE_URL")
if not BASE_URL:
    raise ValueError("TB_BASE_URL must be set in .env")

def get_headers(token):
    return {
        "Content-Type": "application/json",
        "X-Authorization": f"Bearer {token}"
    }

def fetch_all_pages(token, url_path, params=None):
    if params is None:
        params = {}
    
    all_data = []
    page = 0
    has_next = True
    
    while has_next:
        current_params = params.copy()
        current_params['pageSize'] = 100
        current_params['page'] = page
        
        try:
            response = requests.get(f"{BASE_URL}{url_path}", headers=get_headers(token), params=current_params)
            if response.status_code == 200:
                res_json = response.json()
                all_data.extend(res_json.get('data', []))
                has_next = res_json.get('hasNext', False)
                page += 1
            else:
                has_next = False
        except Exception as e:
            print(f"Error fetching page {page} for {url_path}: {e}")
            has_next = False
            
    return all_data

def tb_login(username, password):

    url = f"{BASE_URL}/api/auth/login"
    try:
        response = requests.post(url, json={"username": username, "password": password})
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "refreshToken": data["refreshToken"]}
    except Exception as e:
        print(f"TB Login Error: {e}")
        return None

def get_current_tb_user(token):
    url = f"{BASE_URL}/api/auth/user"
    try:
        response = requests.get(url, headers=get_headers(token))
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching current TB user: {e}")
    return None
    return None

def tb_refresh_token(refresh_token):
    url = f"{BASE_URL}/api/auth/token"
    try:
        response = requests.post(url, json={"refreshToken": refresh_token})
        if response.status_code == 200:
            data = response.json()
            return {"token": data["token"], "refreshToken": data["refreshToken"]}
    except Exception as e:
        print(f"TB Refresh Error: {e}")
    return None

def tb_logout(token):
    url = f"{BASE_URL}/api/auth/logout"
    try:
        requests.post(url, headers=get_headers(token))
    except Exception:
        pass



def get_tenant_profiles(token):
    return fetch_all_pages(token, "/api/tenantProfiles")

def list_tenants(token):
    data = fetch_all_pages(token, "/api/tenants")
    # Sort by createdTime descending (Latest First)
    data.sort(key=lambda x: x.get('createdTime', 0), reverse=True)
    return data

def get_tenant_users(token, tenant_id):
    return fetch_all_pages(token, f"/api/tenant/{tenant_id}/users")


def get_user_token(sys_token, user_id):
    url = f"{BASE_URL}/api/user/{user_id}/token"
    try:
        response = requests.get(url, headers=get_headers(sys_token))
        if response.status_code == 200:
            return response.json()['token']
    except Exception:
        pass
    return None

def enrich_users_with_details(token, users):
    for u in users:
        try:
            user_id = u['id']['id']
            
            # 1. Fetch User Details (for additionalInfo)
            detail_url = f"{BASE_URL}/api/user/{user_id}"
            detail_res = requests.get(detail_url, headers=get_headers(token))
            if detail_res.status_code == 200:
                real_user = detail_res.json()
                if 'additionalInfo' in real_user:
                    u['additionalInfo'] = real_user['additionalInfo']
            
            # 2. Fetch Credentials (for Real Active Status)
            cred_url = f"{BASE_URL}/api/user/{user_id}/credentials"
            cred_res = requests.get(cred_url, headers=get_headers(token))
            if cred_res.status_code == 200:
                creds = cred_res.json()
                if 'additionalInfo' not in u or u['additionalInfo'] is None:
                    u['additionalInfo'] = {}
                # Store the real status in additionalInfo so frontend can read it
                u['additionalInfo']['userCredentialsEnabled'] = creds.get('enabled', False)
                
        except Exception as e:
            print(f"Error enriching user {u.get('email')}: {e}")
            pass
    return users


def get_all_user_infos(token):
    users = fetch_all_pages(token, "/api/userInfos/all")
    return enrich_users_with_details(token, users)

def get_customers(token):
    return fetch_all_pages(token, "/api/customers")

def get_customer_users(token, customer_id):
    return fetch_all_pages(token, f"/api/customer/{customer_id}/users")

def get_tenant_admins(token):
    # As a Tenant Admin, fetching /api/users usually returns users managed by the tenant
    # But let's try to be specific if possible. 
    # Actually, /api/users returns all users in scope.
    return fetch_all_pages(token, "/api/users", params={"sortProperty": "createdTime", "sortOrder": "DESC"})



def create_tenant_profile(token, name, description=None):
    url = f"{BASE_URL}/api/tenantProfile"
    payload = {
        "name": name,
        "description": description,
        "isolatedTbRuleEngine": False,
        "profileData": {
            "configuration": {
                "type": "DEFAULT",
                "maxDevices": 0,
                "maxAssets": 0,
                "maxCustomers": 0,
                "maxUsers": 0,
                "maxDashboards": 0,
                "maxRuleChains": 0,
                "maxResourcesInBytes": 0,
                "maxOtaPackagesInBytes": 0,
                "transportTenantMsgRateLimit": None,
                "transportTenantTelemetryMsgRateLimit": None,
                "transportTenantTelemetryDataPointsRateLimit": None,
                "transportDeviceMsgRateLimit": None,
                "transportDeviceTelemetryMsgRateLimit": None,
                "transportDeviceTelemetryDataPointsRateLimit": None
            }
        }
    }
    try:
        response = requests.post(url, json=payload, headers=get_headers(token))
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to create tenant profile: {response.text}")
    except Exception as e:
        print(f"Exception creating tenant profile: {e}")
    return None

def create_tenant(token, title, profile_id=None, use_case=None, email=None):
    url = f"{BASE_URL}/api/tenant"
    payload = {"title": title}
    if email:
        payload["email"] = email
    if profile_id:
        payload["tenantProfileId"] = {"id": profile_id, "entityType": "TENANT_PROFILE"}
    
    if use_case:
        payload["additionalInfo"] = {"useCase": use_case}

    try:
        response = requests.post(url, json=payload, headers=get_headers(token))
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return None

def update_tenant(token, tenant_id, title, profile_id):
    url = f"{BASE_URL}/api/tenant"
    payload = {
        "id": {"id": tenant_id, "entityType": "TENANT"},
        "title": title,
        "tenantProfileId": {"id": profile_id, "entityType": "TENANT_PROFILE"}
    }
    try:
        response = requests.post(url, json=payload, headers=get_headers(token))
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error updating tenant: {e}")
    return None

def create_tenant_admin(token, tenant_id, email, first_name, last_name):
    return create_user(token, email, first_name, last_name, "TENANT_ADMIN", tenant_id=tenant_id)

def create_user(token, email, first_name, last_name, authority, tenant_id=None, customer_id=None):
    url = f"{BASE_URL}/api/user?sendActivationMail=true"
    payload = {
        "email": email,
        "authority": authority,
        "firstName": first_name,
        "lastName": last_name
    }
    
    if tenant_id:
        payload["tenantId"] = {"id": tenant_id, "entityType": "TENANT"}
        
    if customer_id:
        payload["customerId"] = {"id": customer_id, "entityType": "CUSTOMER"}
        
    try:
        response = requests.post(url, json=payload, headers=get_headers(token))
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Failed to create user: {response.text}")
    except Exception as e:
        print(f"Exception creating user: {e}")
    return None

def toggle_user_credentials(token, user_id, enabled):
    headers = get_headers(token)
    cred_url = f"{BASE_URL}/api/user/{user_id}/userCredentialsEnabled?userCredentialsEnabled={str(enabled).lower()}"
    try:
        requests.post(cred_url, headers=headers)
        
        # Update Entity
        user_url = f"{BASE_URL}/api/user/{user_id}"
        get_res = requests.get(user_url, headers=headers)
        if get_res.status_code == 200:
            user_data = get_res.json()
            if 'additionalInfo' not in user_data or user_data['additionalInfo'] is None:
                user_data['additionalInfo'] = {}
            
            user_data['additionalInfo']['userActivated'] = enabled
            user_data['additionalInfo']['userCredentialsEnabled'] = enabled
            
            save_url = f"{BASE_URL}/api/user"
            requests.post(save_url, json=user_data, headers=headers)
            return True
    except Exception:
        pass
    return False
