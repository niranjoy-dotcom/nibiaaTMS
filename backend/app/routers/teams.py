from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)

get_db = database.get_db

@router.post("", response_model=schemas.Team)
def create_team(
    team: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    db_team = models.Team(**team.dict())
    try:
        db.add(db_team)
        db.commit()
        db.refresh(db_team)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Team with this name already exists")
    return db_team

@router.get("", response_model=List[schemas.Team])
def read_teams(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    teams = db.query(models.Team).offset(skip).limit(limit).all()
    return teams


# Team Types API

@router.post("/types", response_model=schemas.TeamType)
def create_team_type(
    team_type: schemas.TeamTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    existing = db.query(models.TeamType).filter(models.TeamType.name == team_type.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team Type with this name already exists")
    
    db_type = models.TeamType(**team_type.dict())
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return db_type

@router.get("/types", response_model=List[schemas.TeamType])
def read_team_types(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    types = db.query(models.TeamType).offset(skip).limit(limit).all()
    return types

@router.delete("/types/{type_id}")
def delete_team_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    db_type = db.query(models.TeamType).filter(models.TeamType.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="Team Type not found")
    
    db.delete(db_type)
    db.commit()
    return {"message": "Team Type deleted"}


# Task Types API
@router.post("/types/{type_id}/task-types", response_model=schemas.TaskType)
def create_task_type(
    type_id: int,
    task_type: schemas.TaskTypeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    team_type = db.query(models.TeamType).filter(models.TeamType.id == type_id).first()
    if not team_type:
        raise HTTPException(status_code=404, detail="Team Type not found")
        
    # Ensure name is unique within this team type
    existing = db.query(models.TaskType).filter(
        models.TaskType.team_type_id == type_id,
        models.TaskType.name == task_type.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Task Type with this name already exists for this Team Type")
        
    db_task_type = models.TaskType(**task_type.dict())
    # Override team_type_id from url to ensure consistency, though schema checks match
    db_task_type.team_type_id = type_id 
    
    db.add(db_task_type)
    db.commit()
    db.refresh(db_task_type)
    return db_task_type

@router.get("/types/{type_id}/task-types", response_model=List[schemas.TaskType])
def read_task_types(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    team_type = db.query(models.TeamType).filter(models.TeamType.id == type_id).first()
    if not team_type:
        # If type_id is 0 or special, maybe return all? No, stick to specific team type.
        raise HTTPException(status_code=404, detail="Team Type not found")
        
    task_types = db.query(models.TaskType).filter(models.TaskType.team_type_id == type_id).all()
    return task_types

@router.delete("/task-types/{task_type_id}")
def delete_task_type(
    task_type_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    db_task_type = db.query(models.TaskType).filter(models.TaskType.id == task_type_id).first()
    if not db_task_type:
        raise HTTPException(status_code=404, detail="Task Type not found")
    
    db.delete(db_task_type)
    db.commit()
    return {"message": "Task Type deleted"}

@router.get("/{team_id}", response_model=schemas.Team)
def read_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.put("/{team_id}", response_model=schemas.Team)
def update_team(
    team_id: int,
    team_update: schemas.TeamUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    update_data = team_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_team, key, value)
    
    try:
        db.commit()
        db.refresh(db_team)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Team name already exists")
    
    return db_team

@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner"]))
):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    db.delete(db_team)
    db.commit()
    return {"message": "Team deleted"}

@router.post("/{team_id}/members", response_model=schemas.TeamMember)
def add_team_member(
    team_id: int,
    member: schemas.TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    user = db.query(models.User).filter(models.User.id == member.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if already a member
    existing = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == member.user_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member of this team")
        
    new_member = models.TeamMember(team_id=team_id, **member.dict())
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role(["owner", "marketing"]))
):
    member = db.query(models.TeamMember).filter(
        models.TeamMember.team_id == team_id,
        models.TeamMember.user_id == user_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this team")
    
    db.delete(member)
    db.commit()

# Task Types API
