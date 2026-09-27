from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Alert, AlertSeverity
from app.schemas.notification import AlertResponse, AlertCreate
from app.services.anomaly_service import AnomalyService

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    unread_only: bool = False,
    severity: Optional[AlertSeverity] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    # Trigger anomaly detection scan
    AnomalyService.detect_anomalies(db)

    query = db.query(Alert)
    if unread_only:
        query = query.filter(Alert.is_read == False)
    if severity:
        query = query.filter(Alert.severity == severity)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()

@router.patch("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert

@router.delete("/{alert_id}")
def dismiss_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"status": "success", "message": "Alert dismissed"}
