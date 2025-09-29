from typing import Optional
from pydantic import BaseModel
from datetime import datetime

# --- User ---
class RegisterIn(BaseModel):
    email: str
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str

# --- Sensor ---
class SensorIn(BaseModel):
    name: str
    model: str
    description: Optional[str] = None

class SensorOut(BaseModel):
    id: int
    name: str
    model: str
    description: Optional[str] = None

# --- Reading ---
class ReadingIn(BaseModel):
    temperature: float
    humidity: float
    timestamp: datetime

class ReadingOut(BaseModel):
    id: int
    temperature: float
    humidity: float
    timestamp: datetime
