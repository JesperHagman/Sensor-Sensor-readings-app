# ---- Makefile (repo root) ----
SHELL := /bin/bash
PROJECT := sensorapp
DC := docker compose
BACKEND := web
FRONTEND := app
DB := db

export COMPOSE_PROJECT_NAME := $(PROJECT)

.PHONY: up down restart build rebuild logs ps migrate makemigrations seed test shell websh appsh dbsh collectstatic fmt lint env

# Build images (first time) and start all services in background
up: env
	$(DC) up -d --build
	@echo "✔ Stack is up. Backend: http://localhost:8000/api/docs  Frontend: http://localhost:3000/"

# Stop and remove containers (keeps volumes)
down:
	$(DC) down

# Recreate with rebuild
rebuild:
	$(DC) build --no-cache
	$(DC) up -d

build:
	$(DC) build

restart:
	$(DC) restart

logs:
	$(DC) logs -f --tail=200

ps:
	$(DC) ps

# ---- Django helpers ----
migrate:
	$(DC) exec $(BACKEND) python manage.py migrate

makemigrations:
	$(DC) exec $(BACKEND) python manage.py makemigrations

seed:
	$(DC) exec $(BACKEND) python manage.py seed_data

test:
	$(DC) exec $(BACKEND) pytest -q

websh:
	$(DC) exec $(BACKEND) bash

dbsh:
	$(DC) exec $(DB) bash

# ---- Frontend helper ----
appsh:
	$(DC) exec $(FRONTEND) sh

fmt:
	@echo "add your formatter commands here"

lint:
	@echo "add your linter commands here"

# Ensure backend/.env exists when using Postgres
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
