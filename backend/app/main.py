from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, tb, projects, admin, zoho, teams, widgets
from . import auth as auth_utils # To create initial admin
import os

# Base.metadata.create_all(bind=engine) # Moved to startup_event with retries

app = FastAPI(title="Nibiaa Manager")

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default
    "http://localhost:8090",
    "http://192.168.1.9:8090",
    "https://tms.nibiaa.com"
]

# Allow any origin on port 5173 and 8090 (for local network access)
origin_regex = r"http://.*:(5173|8090)"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(tb.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(zoho.router, prefix="/api")
app.include_router(teams.router, prefix="/api")
app.include_router(widgets.router, prefix="/api")

@app.on_event("startup")
def startup_event():
    import time
    from sqlalchemy.exc import OperationalError
    from .database import SessionLocal, engine, Base
    from .models import User
    
    # 1. Initialize Database with Retries
    max_retries = 10
    retry_delay = 3
    db_initialized = False
    
    print("Database initialization starting...")
    for i in range(max_retries):
        try:
            Base.metadata.create_all(bind=engine)
            db_initialized = True
            print("Database initialized successfully.")
            break
        except OperationalError as e:
            print(f"Database connection attempt {i+1} failed: {e}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
    
    if not db_initialized:
        print("CRITICAL: Failed to initialize database after multiple retries. Exiting.")
        return

    # 2. Create initial admin user if not exists
    db = SessionLocal()
    try:
        # Ensure Admin exists
        admin_email = os.getenv("ADMIN_EMAIL", "support@nibiaa.com")
        owner_password = os.getenv("ADMIN_PASSWORD", "Nibiaa@12")
        
        user = db.query(User).filter(User.email == admin_email).first()
        if not user:
            hashed_password = auth_utils.get_password_hash(owner_password)
            db_user = User(email=admin_email, hashed_password=hashed_password, role="owner")
            db.add(db_user)
            db.commit()
            print(f"Initial admin user {admin_email} created.")
        else:
            pass
    finally:
        db.close()


@app.get("/api/api_health")
def read_root():
    return {"message": "Welcome to Nibiaa Manager API"}

# Mount frontend build - MUST BE LAST to avoid shadowing API routes
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

# Mount frontend assets explicitly
if os.path.exists(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

# Serve specific root files if needed (e.g. favicon.ico, manifestation.json)
# For now, let's just handle index.html via catch-all

from fastapi.responses import FileResponse, JSONResponse

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # If API Request passes through to here, it means 404
    if full_path.startswith("api"):
         return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
    
    # Check if a static file exists in dist (e.g. favicon.ico)
    # BE CAREFUL: Prevent traversal. split("/")[-1] checks filename only? 
    # Better: just serve index.html for unknown paths to support Client Side Routing
    
    # If the file exists in dist and is NOT index.html (which we serve anyway), serve it?
    # Actually, we can just try to serve it.
    possible_path = os.path.join(frontend_dist, full_path)
    if os.path.exists(possible_path) and os.path.isfile(possible_path):
        return FileResponse(possible_path)

    # Fallback to index.html for SPA routing
    if os.path.exists(os.path.join(frontend_dist, "index.html")):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    
    return JSONResponse(status_code=404, content={"detail": "Frontend not found"})
