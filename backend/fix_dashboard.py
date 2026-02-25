from app.database import SessionLocal, engine
from app.models import Widget

def fix_widget_sizes():
    db = SessionLocal()
    try:
        widgets = db.query(Widget).all()
        print(f"Found {len(widgets)} widgets.")
        for w in widgets:
            if w.size != "1":
                print(f"Updating widget {w.title} ({w.id}) from size {w.size} to 1")
                w.size = "1"
        
        db.commit()
        print("All widgets updated to size 1.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_widget_sizes()
