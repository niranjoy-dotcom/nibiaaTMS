from app.database import SessionLocal
from app.models import User, UserTenant, Project, Task, TaskComment, TaskTemplate, ZohoTenant, ZohoCustomer

def clear_remaining_data():
    db = SessionLocal()
    try:
        # 1. Clear Task Comments
        num_comments = db.query(TaskComment).delete()
        print(f"Deleted {num_comments} task comments.")

        # 2. Clear Tasks
        num_tasks = db.query(Task).delete()
        print(f"Deleted {num_tasks} tasks.")

        # 3. Clear Projects
        num_projects = db.query(Project).delete()
        print(f"Deleted {num_projects} projects.")

        # 4. Clear User Tenants (Tenant List assignments)
        num_user_tenants = db.query(UserTenant).delete()
        print(f"Deleted {num_user_tenants} user tenant assignments.")

        # 5. Clear Task Templates
        num_templates = db.query(TaskTemplate).delete()
        print(f"Deleted {num_templates} task templates.")

        # 6. Clear Zoho Tenants (Tenant List data)
        num_zoho_tenants = db.query(ZohoTenant).delete()
        print(f"Deleted {num_zoho_tenants} Zoho tenants.")

        # 7. Clear Zoho Customers
        num_zoho_customers = db.query(ZohoCustomer).delete()
        print(f"Deleted {num_zoho_customers} Zoho customers.")

        db.commit()
        print("Successfully cleared all specified tables.")

    except Exception as e:
        print(f"Error clearing data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clear_remaining_data()
