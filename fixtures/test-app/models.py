from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)


class User(Base):
    """Tenant-scoped table"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    email = Column(String, nullable=False)
    name = Column(String)
    
    workspace = relationship("Workspace")


class Project(Base):
    """Tenant-scoped table"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    
    workspace = relationship("Workspace")


class FeatureFlag(Base):
    """Global table - not tenant scoped"""
    __tablename__ = "feature_flags"
    
    id = Column(Integer, primary_key=True)
    key = Column(String, unique=True, nullable=False)
    enabled = Column(Boolean, default=False)
    description = Column(String)


class AuditLog(Base):
    """Global table - tracks all activity"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    action = Column(String, nullable=False)
    user_id = Column(Integer)
    workspace_id = Column(Integer)
    details = Column(String)
