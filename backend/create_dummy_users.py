from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash

def create_dummy_users():
    db = SessionLocal()

    users_to_create = [
        {"email": "adminuser@nibiaa.com", "password": "admin12", "role": "admin"},
        {"email": "technical@nibiaa.com", "password": "technical12", "role": "technical_manager"},
        {"email": "maneger@nibiaa.com", "password": "maneger12", "role": "project_manager"},
    ]

    for user_data in users_to_create:
        existing_user = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing_user:
            new_user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                role=user_data["role"],
                is_active=True
            )
            db.add(new_user)
        else:
            pass
            # Optional: Update role/password if needed, but for now just skip
            # existing_user.role = user_data["role"]
            # existing_user.hashed_password = get_password_hash(user_data["password"])

    db.commit()
    db.close()

if __name__ == "__main__":
    create_dummy_users()
