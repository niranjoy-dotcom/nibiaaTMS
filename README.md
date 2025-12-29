# Nibiaa Manager (FastAPI + React)

## Prerequisites
- Python 3.8+
- Node.js 16+

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will run at `http://localhost:8000`.
   
   **Default Admin Credentials:**
   - Email: `adminuser@nibiaa.com`
   - Password: `admin12`

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:5173`.

## Usage

1. Open the frontend URL in your browser.
2. Log in with the default admin credentials.
3. You will be prompted to connect to ThingsBoard. Enter your ThingsBoard System Admin credentials (e.g., `sysadmin@thingsboard.org` / `sysadmin`).
4. Once connected, you can view tenants, create new tenants, and manage user activation status.
