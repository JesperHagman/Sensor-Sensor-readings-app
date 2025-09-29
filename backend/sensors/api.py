from ninja import NinjaAPI, Router
from django.contrib.auth.models import User
from .schemas import RegisterIn, UserOut

api = NinjaAPI(title="Sensors API")

auth_router = Router()

@auth_router.post("/register/", response=UserOut)
def register(request, payload: RegisterIn):
    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
    )
    return UserOut(id=user.id, email=user.email, username=user.username)

# koppla in router
api.add_router("/auth", auth_router)
