from app.database import SessionLocal
from app.models import User

db = SessionLocal()
user = db.query(User).filter(User.email == "niranjoyy@gmail.com").first() # Note the typo in email from previous logs
if user:
    print(f"User: {user.email}")
    print(f"Role: {user.role}")
else:
    print("User not found")
db.close()