from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database, auth

router = APIRouter(prefix="/widgets", tags=["widgets"])
get_db = database.get_db

@router.post("/", response_model=schemas.Widget)
def create_widget(
    widget: schemas.WidgetCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_widget = models.Widget(**widget.dict(), user_id=current_user.id)
    db.add(db_widget)
    db.commit()
    db.refresh(db_widget)
    return db_widget

@router.get("/", response_model=List[schemas.Widget])
def read_widgets(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    widgets = db.query(models.Widget).filter(models.Widget.user_id == current_user.id).order_by(models.Widget.position).all()
    
    # Optional: If no widgets exist, create defaults? 
    # Or let Frontend handle empty state by showing defaults or an "Add" button.
    # Let's let Frontend handle it for flexibility.
    
    return widgets

@router.delete("/{widget_id}")
def delete_widget(
    widget_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_widget = db.query(models.Widget).filter(models.Widget.id == widget_id, models.Widget.user_id == current_user.id).first()
    if not db_widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    db.delete(db_widget)
    db.commit()
    return {"status": "success"}

@router.put("/{widget_id}", response_model=schemas.Widget)
def update_widget(
    widget_id: int,
    widget_update: schemas.WidgetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_widget = db.query(models.Widget).filter(models.Widget.id == widget_id, models.Widget.user_id == current_user.id).first()
    if not db_widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    update_data = widget_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_widget, key, value)
    
    db.commit()
    db.refresh(db_widget)
    return db_widget
