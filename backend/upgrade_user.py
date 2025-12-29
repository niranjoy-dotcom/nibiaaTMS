from app.database import SessionLocal
from app.models import User

db = SessionLocal()
user = db.query(User).filter(User.email == "niranjoyy@gmail.com").first()

if user:
    print(f"Current Role: {user.role}")
    user.role = "admin"
    db.commit()
    print(f"New Role: {user.role}")
else:
    print("User not found")

db.close()