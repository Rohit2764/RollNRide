from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.notification import AlertType, AlertSeverity

class AlertCreate(BaseModel):
    type: AlertType
    severity: AlertSeverity = AlertSeverity.INFO
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    suggested_action: Optional[str] = None

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    is_read: bool
    suggested_action: Optional[str] = None
    created_at: datetime
