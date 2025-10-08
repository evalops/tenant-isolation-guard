from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import User, Project, FeatureFlag, Workspace

router = APIRouter()


def get_db():
    """Database session dependency"""
    pass


def get_current_workspace(db: Session = Depends(get_db)):
    """Returns current workspace from auth context"""
    pass


def require_admin():
    """Admin-only dependency"""
    pass


# BAD: Missing tenant filter on query
@router.get("/users")
def list_users_bad(db: Session = Depends(get_db)):
    """ISSUE: Queries User table without workspace_id filter"""
    users = db.query(User).all()
    return users


# GOOD: Has tenant filter
@router.get("/users/safe")
def list_users_good(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Correctly filters by workspace_id"""
    users = db.query(User).filter(User.workspace_id == workspace.id).all()
    return users


# BAD: Missing tenant dependency
@router.get("/projects")
def list_projects_no_auth(db: Session = Depends(get_db)):
    """ISSUE: Accesses tenant-scoped table without workspace dependency"""
    projects = db.query(Project).all()
    return projects


# BAD: Has dependency but forgot filter
@router.get("/projects/missing-filter")
def list_projects_missing_filter(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """ISSUE: Has workspace dependency but doesn't use it in query"""
    projects = db.query(Project).all()
    return projects


# GOOD: Proper tenant isolation
@router.get("/projects/safe")
def list_projects_safe(
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Correctly scoped to workspace"""
    projects = db.query(Project).filter(Project.workspace_id == workspace.id).all()
    return projects


# BAD: Update without tenant filter
@router.put("/projects/{project_id}")
def update_project_bad(
    project_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """ISSUE: Update doesn't verify workspace_id"""
    db.query(Project).filter(Project.id == project_id).update({"name": "Updated"})
    db.commit()
    return {"status": "updated"}


# GOOD: Update with tenant filter
@router.put("/projects/{project_id}/safe")
def update_project_safe(
    project_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Correctly checks workspace before update"""
    db.query(Project).filter(
        Project.id == project_id,
        Project.workspace_id == workspace.id
    ).update({"name": "Updated"})
    db.commit()
    return {"status": "updated"}


# GOOD: Global table access (no tenant needed)
@router.get("/feature-flags")
def list_feature_flags(db: Session = Depends(get_db)):
    """OK: FeatureFlag is a global table"""
    flags = db.query(FeatureFlag).all()
    return flags


# GOOD: Admin endpoint (exempt from tenant checks)
@router.get("/admin/all-users")
def admin_list_all_users(
    db: Session = Depends(get_db),
    _admin = Depends(require_admin)
):
    """OK: Admin endpoint can access all users"""
    users = db.query(User).all()
    return users


# BAD: Delete without tenant check
@router.delete("/users/{user_id}")
def delete_user_bad(
    user_id: int,
    db: Session = Depends(get_db)
):
    """ISSUE: Missing workspace dependency and filter"""
    db.query(User).filter(User.id == user_id).delete()
    db.commit()
    return {"status": "deleted"}


# GOOD: Delete with tenant check
@router.delete("/users/{user_id}/safe")
def delete_user_safe(
    user_id: int,
    db: Session = Depends(get_db),
    workspace: Workspace = Depends(get_current_workspace)
):
    """Correctly verifies workspace before delete"""
    db.query(User).filter(
        User.id == user_id,
        User.workspace_id == workspace.id
    ).delete()
    db.commit()
    return {"status": "deleted"}
