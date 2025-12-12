"""
VoteFlow AI - Database Module
Multi-user support with payment tracking and quota management.
"""

import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import enum

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./voteflow.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PackageType(str, enum.Enum):
    """Available subscription packages."""
    STARTER = "starter"      # 500 messages - ₹999
    GROWTH = "growth"        # 2000 messages - ₹2999
    ENTERPRISE = "enterprise"  # 10000 messages - ₹9999


class PaymentStatus(str, enum.Enum):
    """Payment transaction status."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# Package limits configuration
PACKAGE_LIMITS = {
    PackageType.STARTER: {"messages": 500, "price": 999, "ai_enabled": False},
    PackageType.GROWTH: {"messages": 2000, "price": 2999, "ai_enabled": True},
    PackageType.ENTERPRISE: {"messages": 10000, "price": 9999, "ai_enabled": True},
}


class User(Base):
    """User model with WhatsApp session and quota tracking."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, index=True)  # From Clerk auth
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)
    
    # Package and quota
    package_type = Column(String, default=PackageType.STARTER.value)
    messages_remaining = Column(Integer, default=0)
    total_messages_sent = Column(Integer, default=0)
    
    # WhatsApp session
    whatsapp_linked = Column(Boolean, default=False)
    whatsapp_phone = Column(String, nullable=True)
    chrome_profile_path = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    payments = relationship("Payment", back_populates="user")
    campaigns = relationship("Campaign", back_populates="user")


class Payment(Base):
    """Payment transaction tracking."""
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Payment details
    amount = Column(Float)
    currency = Column(String, default="INR")
    package_type = Column(String)
    messages_purchased = Column(Integer)
    
    # Razorpay details
    razorpay_order_id = Column(String, unique=True)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    
    # Status
    status = Column(String, default=PaymentStatus.PENDING.value)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="payments")


class Campaign(Base):
    """Campaign tracking per user."""
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(String, unique=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Campaign details
    name = Column(String, nullable=True)
    message_template = Column(String)
    total_recipients = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    messages_failed = Column(Integer, default=0)
    
    # Status
    status = Column(String, default="pending")  # pending, running, completed, failed
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="campaigns")


# Database helper functions
def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    print("[DB] ✅ Database tables created successfully")


def get_user_by_clerk_id(db, clerk_user_id: str) -> User:
    """Get or create user by Clerk ID."""
    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        user = User(clerk_user_id=clerk_user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_user_quota(db, clerk_user_id: str) -> dict:
    """Get user's remaining message quota."""
    user = get_user_by_clerk_id(db, clerk_user_id)
    return {
        "messages_remaining": user.messages_remaining,
        "total_sent": user.total_messages_sent,
        "package_type": user.package_type,
        "whatsapp_linked": user.whatsapp_linked
    }


def decrement_quota(db, clerk_user_id: str, count: int = 1) -> bool:
    """Decrement user's message quota. Returns False if insufficient quota."""
    user = get_user_by_clerk_id(db, clerk_user_id)
    if user.messages_remaining < count:
        return False
    user.messages_remaining -= count
    user.total_messages_sent += count
    db.commit()
    return True


def add_quota(db, clerk_user_id: str, package_type: str) -> int:
    """Add messages to user quota based on package. Returns new total."""
    user = get_user_by_clerk_id(db, clerk_user_id)
    pkg = PackageType(package_type)
    messages = PACKAGE_LIMITS[pkg]["messages"]
    user.messages_remaining += messages
    user.package_type = package_type
    db.commit()
    return user.messages_remaining


def get_user_chrome_profile(clerk_user_id: str) -> str:
    """Get the Chrome profile directory path for a user."""
    base_path = os.getenv("CHROME_PROFILES_BASE", "/data/chrome-profiles")
    profile_path = os.path.join(base_path, clerk_user_id)
    os.makedirs(profile_path, exist_ok=True)
    return profile_path


# Initialize database on import
if __name__ == "__main__":
    init_db()
