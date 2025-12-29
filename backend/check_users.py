from app.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).all()

print(f"{'ID':<5} {'Email':<30} {'Is Active':<10} {'Activation Token'}")
print("-" * 80)
for user in users:
    print(f"{user.id:<5} {user.email:<30} {str(user.is_active):<10} {user.activation_token}")

db.close()