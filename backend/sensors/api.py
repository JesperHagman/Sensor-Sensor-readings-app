from typing import List, Optional, Any, Dict
from django.contrib.auth.models import User
from django.db.models import Q
from django.db import IntegrityError
from django.utils.dateparse import parse_datetime

from ninja import NinjaAPI, Router

from .schemas import (
    RegisterIn, UserOut,
    SensorIn, SensorOut,
    ReadingIn, ReadingOut
)
from .models import Sensor, Reading
from .auth import JWTAuth

api = NinjaAPI(title="Sensors API")

# ------------------------
# Hjälpfunktioner
# ------------------------

def _parse_ts(val: Optional[str]):
    """
    Gör datum-parsning tolerant mot att '+' ibland tappas i querystring och blir mellanslag.
    Ex: '2024-01-01T00:00:00+00:00' kan komma som '2024-01-01T00:00:00 00:00'.
    """
    if not val:
        return None
    s = val
    if " " in s and s.endswith("00:00") and "+" not in s and "T" in s:
        s = s.replace(" ", "+", 1)
    return parse_datetime(s)

def _paginate(qs, page: int, page_size: int) -> tuple[list, int, int, int]:
    page = max(1, int(page or 1))
    page_size = max(1, int(page_size or 10))
    total = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    return list(qs[start:end]), total, page, page_size

def _serialize_list(items, Schema) -> list[Dict[str, Any]]:
    # Konvertera Django-objekt -> Pydantic-schema -> dict
    return [Schema.model_validate(obj, from_attributes=True).model_dump() for obj in items]


# ------------------------
# Auth (öppen)
# ------------------------

auth_router = Router()

@auth_router.post("/register/", response={201: UserOut})
def register(request, payload: RegisterIn):
    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password
    )
    return 201, UserOut(id=user.id, email=user.email, username=user.username)


# ------------------------
# Sensors (JWT-skyddat)
# ------------------------

sensors_router = Router(auth=JWTAuth())

@sensors_router.get("/", response=dict)
def list_sensors(request, q: Optional[str] = None, page: int = 1, page_size: int = 10):
    qs = Sensor.objects.filter(owner=request.auth)
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(model__icontains=q))
    qs = qs.order_by("id")
    items, total, page, page_size = _paginate(qs, page, page_size)
    return {
        "items": _serialize_list(items, SensorOut),
        "count": total,
        "page": page,
        "page_size": page_size,
    }

@sensors_router.post("/", response={201: SensorOut})
def create_sensor(request, payload: SensorIn):
    s = Sensor.objects.create(owner=request.auth, **payload.model_dump())
    return 201, s

@sensors_router.get("/{sensor_id}/", response=SensorOut)
def get_sensor(request, sensor_id: int):
    return Sensor.objects.get(id=sensor_id, owner=request.auth)

@sensors_router.put("/{sensor_id}/", response=SensorOut)
def update_sensor(request, sensor_id: int, payload: SensorIn):
    s = Sensor.objects.get(id=sensor_id, owner=request.auth)
    for k, v in payload.model_dump().items():
        setattr(s, k, v)
    s.save()
    return s

@sensors_router.delete("/{sensor_id}/", response={204: None})
def delete_sensor(request, sensor_id: int):
    Sensor.objects.get(id=sensor_id, owner=request.auth).delete()
    return 204, None


# ------------------------
# Readings (JWT-skyddat)
# ------------------------

readings_router = Router(auth=JWTAuth())

@readings_router.get("/{sensor_id}/readings/", response=dict)
def list_readings(
    request,
    sensor_id: int,
    timestamp_from: Optional[str] = None,
    timestamp_to: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
):
    sensor = Sensor.objects.get(id=sensor_id, owner=request.auth)
    qs = sensor.readings.all()

    dt_from = _parse_ts(timestamp_from)
    dt_to = _parse_ts(timestamp_to)
    if dt_from:
        qs = qs.filter(timestamp__gte=dt_from)
    if dt_to:
        qs = qs.filter(timestamp__lte=dt_to)

    qs = qs.order_by("timestamp")
    items, total, page, page_size = _paginate(qs, page, page_size)
    return {
        "items": _serialize_list(items, ReadingOut),
        "count": total,
        "page": page,
        "page_size": page_size,
    }

@readings_router.post("/{sensor_id}/readings/", response={201: ReadingOut, 400: dict})
def create_reading(request, sensor_id: int, payload: ReadingIn):
    sensor = Sensor.objects.get(id=sensor_id, owner=request.auth)
    try:
        r = Reading.objects.create(sensor=sensor, **payload.model_dump())
        return 201, r
    except IntegrityError:
        return 400, {"detail": "Reading with this timestamp already exists for this sensor"}


# ------------------------
# Mount routers
# ------------------------

api.add_router("/auth", auth_router)
api.add_router("/sensors", sensors_router)
api.add_router("/sensors", readings_router)