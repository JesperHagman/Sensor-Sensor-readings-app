from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

# --- Auth ---
class RegisterIn(BaseModel):
    email: str
    username: str
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str

# --- Sensor ---
class SensorIn(BaseModel):
    name: str
    model: str
    description: Optional[str] = None

class SensorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
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
    model_config = ConfigDict(from_attributes=True)
    id: int
    temperature: float
    humidity: float
    timestamp: datetime
