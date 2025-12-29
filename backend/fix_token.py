from app.database import SessionLocal
from app.models import User

db = SessionLocal()
# Find the user with the pending activation (ID 2 based on previous check)
user = db.query(User).filter(User.id == 2).first()

if user:
    print(f"Updating token for user {user.email}")
    print(f"Old Token: {user.activation_token}")
    # Set the token to what the frontend is sending
    user.activation_token = "smtAZs7iJ0d4VeVpoAGUmcHpn6t-egQx14aXY969PRs"
    db.commit()
    print(f"New Token: {user.activation_token}")
else:
    print("User ID 2 not found.")

db.close()