from typing import List, Optional
from django.contrib.auth.models import User
from django.db.models import Q
from django.db import IntegrityError

from ninja import NinjaAPI, Router
from ninja.pagination import paginate, PageNumberPagination

from .schemas import (
    RegisterIn, UserOut,
    SensorIn, SensorOut,
    ReadingIn, ReadingOut
)
from .models import Sensor, Reading
from .auth import JWTAuth


api = NinjaAPI(title="Sensors API")

# --- Auth router (öppen) ---
auth_router = Router()

@auth_router.post("/register/", response={201: UserOut})
def register(request, payload: RegisterIn):
    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password
    )
    return 201, UserOut(id=user.id, email=user.email, username=user.username)

# --- Sensors (skyddat) ---
sensors_router = Router(auth=JWTAuth())

@sensors_router.get("/", response=List[SensorOut])
@paginate(PageNumberPagination)  # ?page=1&page_size=10
def list_sensors(request, q: Optional[str] = None):
    qs = Sensor.objects.filter(owner=request.auth)
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(model__icontains=q))
    return qs.order_by("id")

@sensors_router.post("/", response={201: SensorOut})
def create_sensor(request, payload: SensorIn):
    s = Sensor.objects.create(owner=request.auth, **payload.dict())
    return 201, s

@sensors_router.get("/{sensor_id}/", response=SensorOut)
def get_sensor(request, sensor_id: int):
    return Sensor.objects.get(id=sensor_id, owner=request.auth)

@sensors_router.put("/{sensor_id}/", response=SensorOut)
def update_sensor(request, sensor_id: int, payload: SensorIn):
    s = Sensor.objects.get(id=sensor_id, owner=request.auth)
    for k, v in payload.dict().items():
        setattr(s, k, v)
    s.save()
    return s

@sensors_router.delete("/{sensor_id}/", response={204: None})
def delete_sensor(request, sensor_id: int):
    Sensor.objects.get(id=sensor_id, owner=request.auth).delete()
    return 204, None

# --- Readings (skyddat) ---
readings_router = Router(auth=JWTAuth())

@readings_router.get("/{sensor_id}/readings/", response=List[ReadingOut])
@paginate(PageNumberPagination)  # ?page=1&page_size=100
def list_readings(
    request,
    sensor_id: int,
    timestamp_from: Optional[str] = None,
    timestamp_to: Optional[str] = None
):
    sensor = Sensor.objects.get(id=sensor_id, owner=request.auth)
    qs = sensor.readings.all()
    if timestamp_from:
        qs = qs.filter(timestamp__gte=timestamp_from)
    if timestamp_to:
        qs = qs.filter(timestamp__lte=timestamp_to)
    return qs.order_by("timestamp")

@readings_router.post("/{sensor_id}/readings/", response={201: ReadingOut, 400: dict})
def create_reading(request, sensor_id: int, payload: ReadingIn):
    sensor = Sensor.objects.get(id=sensor_id, owner=request.auth)
    try:
        r = Reading.objects.create(sensor=sensor, **payload.dict())
        return 201, r
    except IntegrityError:
        return 400, {"detail": "Reading with this timestamp already exists for this sensor"}

# --- Mount routers ---
api.add_router("/auth", auth_router)
api.add_router("/sensors", sensors_router)
api.add_router("/sensors", readings_router)