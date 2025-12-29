import os
import httpx
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_zoho_token():
    client_id = os.getenv("ZOHO_CLIENT_ID")
    client_secret = os.getenv("ZOHO_CLIENT_SECRET")
    
    try:
        with open("zoho_token.txt", "r") as f:
            refresh_token = f.read().strip()
    except FileNotFoundError:
        print("zoho_token.txt not found")
        return

    print(f"Client ID: {client_id}")
    # print(f"Client Secret: {client_secret}") # Don't print secret
    print(f"Refresh Token: {refresh_token}")

    async def try_dc(dc):
        url = f"https://accounts.zoho.{dc}/oauth/v2/token"
        params = {
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token"
        }
        print(f"Trying DC: {dc}...")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, params=params)
            return response.json()

    # Try .com
    data = await try_dc("com")
    print(f"Response from .com: {data}")

    # Always try .in with the REAL token to verify it
    print("\n--- Testing with REAL token on .in ---")
    # Reset refresh token to the real one read from file
    with open("zoho_token.txt", "r") as f:
        refresh_token = f.read().strip()
    data = await try_dc("in")
    print(f"Response from .in: {data}")

    # Test with a fake code to see if we get invalid_code
    print("\n--- Testing with fake code as refresh token ---")
    refresh_token = "1000.fakecode.fakecode"
    data = await try_dc("in")
    print(f"Response with fake code: {data}")

if __name__ == "__main__":
    asyncio.run(test_zoho_token())
