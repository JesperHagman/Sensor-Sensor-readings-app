# ---------- Project / Compose ----------
PROJECT := sensorapp
export COMPOSE_PROJECT_NAME := $(PROJECT)

# If you use Docker Compose v2 (Docker Desktop), this is correct:
DC := docker compose
# If you still use v1, change to: DC := docker-compose

# Service names from docker-compose.yml
BACKEND := web
FRONTEND := app
DB := db

.PHONY: up down build rebuild restart logs ps env \
        migrate makemigrations seed test websh dbsh appsh

# ---------- Orchestration ----------
up: env
	$(DC) up -d --build
	@echo "✔ Stack up: Backend http://localhost:8000/api/docs  Frontend http://localhost:3000/"

down:
	$(DC) down

build:
	$(DC) build

rebuild:
	$(DC) build --no-cache
	$(DC) up -d

restart:
	$(DC) restart

logs:
	$(DC) logs -f --tail=200

ps:
	$(DC) ps

# ---------- Backend helpers ----------
migrate:
	$(DC) exec $(BACKEND) python manage.py migrate

makemigrations:
	$(DC) exec $(BACKEND) python manage.py makemigrations

seed:
	$(DC) exec $(BACKEND) python manage.py seed_data

test:
	@cid="$$( $(DC) ps -q $(BACKEND) )"; \
	if [ -n "$$cid" ]; then \
		echo "Running tests in running container: $(BACKEND) ($$cid)"; \
		$(DC) exec -T $(BACKEND) pytest -q; \
	else \
		echo "web is not running; running tests in a one-off container..."; \
		$(DC) run --rm $(BACKEND) pytest -q; \
	fi

websh:
	$(DC) exec $(BACKEND) bash

dbsh:
	$(DC) exec $(DB) bash

# ---------- Frontend helper ----------
appsh:
	$(DC) exec $(FRONTEND) sh

# ---------- Ensure backend/.env exists ----------
env:
	@if [ ! -f backend/.env ]; then \
	  echo "backend/.env missing — creating a template"; \
	  printf "%s\n" \
"POSTGRES_DB=sensors" \
"POSTGRES_USER=sensors" \
"POSTGRES_PASSWORD=sensors" \
"POSTGRES_HOST=db" \
"POSTGRES_PORT=5432" \
"DJANGO_SECRET_KEY=dev-secret-change-me" \
"DJANGO_DEBUG=1" \
"CORS_ORIGIN=http://localhost:3000" \
	  > backend/.env; \
	  echo "Wrote backend/.env"; \
	fi