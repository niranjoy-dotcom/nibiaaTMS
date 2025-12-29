from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, tb, projects, admin
from . import auth as auth_utils # To create initial admin
import os

Base.metadata.create_all(bind=engine)

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
]

# Allow any origin on port 5173 (for local network access)
origin_regex = r"http://.*:5173"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tb.router)
app.include_router(projects.router)
app.include_router(admin.router)

@app.on_event("startup")
def startup_event():
    # Create initial admin user if not exists
    from .database import SessionLocal
    from .models import User
    db = SessionLocal()
    
    # Ensure Admin exists
    admin_email = os.getenv("ADMIN_EMAIL", "adminuser@nibiaa.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin12")
    
    user = db.query(User).filter(User.email == admin_email).first()
    if not user:
        hashed_password = auth_utils.get_password_hash(admin_password)
        db_user = User(email=admin_email, hashed_password=hashed_password, role="admin")
        db.add(db_user)
        db.commit()
        print(f"Created default admin user: {admin_email}")
    else:
        print(f"Admin user {admin_email} already exists. Skipping creation.")
        
    db.close()


@app.get("/")
def read_root():
    return {"message": "Welcome to Nibiaa Manager API"}
