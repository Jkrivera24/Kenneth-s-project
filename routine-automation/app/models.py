from pydantic import BaseModel, Field


class RoutineCreate(BaseModel):
    name: str
    period: str = "morning"


class StepCreate(BaseModel):
    title: str
    scheduled_time: str | None = None
    duration_minutes: int | None = None
    sort_order: int = 0


class PhoneEvent(BaseModel):
    event_type: str = Field(..., description="e.g. wake, location_home, focus_mode")
    payload: dict | None = None
    source: str = "phone"


class PhoneImport(BaseModel):
    source: str = "export"
    routines: list[dict] | None = None
    calendar_events: list[dict] | None = None


class CompleteStep(BaseModel):
    source: str = "web"
