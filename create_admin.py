#!/usr/bin/env python3
"""
Create admin user using UV in backend directory
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from app.models import User, Base
from app.database import get_db, engine
from app.auth import get_password_hash
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

def create_admin_user():
    """Create admin user using SQLAlchemy"""
    
    print("🔐 Creating Admin User in PostgreSQL Database")
    print("=" * 50)
    
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Get database session
        db = next(get_db())
        
        # Check if admin user already exists
        existing_user = db.query(User).filter(User.username == "admin").first()
        if existing_user:
            print("ℹ️  Admin user already exists")
            print(f"   Username: admin")
            print(f"   Email: {existing_user.email}")
            print(f"   Password: admin123")
            db.close()
            return True
        
        # Create admin user
        admin_id = uuid.uuid4()
        username = "admin"
        email = "admin@creditrisk.local"
        password = "admin123"  # Simple password for demo
        hashed_password = get_password_hash(password)
        
        admin_user = User(
            id=admin_id,
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        print(f"   UUID: {admin_id}")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    create_admin_user()