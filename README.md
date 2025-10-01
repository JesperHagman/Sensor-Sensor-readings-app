# Sensor Readings App

A full-stack demo application for managing sensors and their readings.  
Built with **Django + Ninja API** (backend) and **Angular** (frontend).  
The app runs fully in **Docker** and includes tests, API docs, and seeded demo data.

---

## Features

### Backend (Django + Ninja API)
- JWT authentication (register, login, refresh).
- CRUD for **Sensors** (per-user ownership).
- CRUD for **Readings** with filtering, pagination, and duplicate protection.
- API docs available via [http://localhost:8000/api/docs](http://localhost:8000/api/docs).
- Tests using `pytest` (all passing).

### Frontend (Angular)
- Register and login/logout flow.
- List, search, and paginate sensors.
- Create new sensors.
- View sensor details:
  - Chart of temperature & humidity.
  - Filtering by date range.
  - Pagination.
  - Latest 20 readings in a table.
  - Add new readings.
- Responsive light theme with consistent UI styling.

### Dev Environment
- **Dockerized stack**: Postgres, Django backend, Angular frontend.
- `make` commands for common tasks.
- Seeded demo data.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows/Mac) or Docker Engine (Linux).
- `make` (already available on Mac/Linux; for Windows use Git Bash or WSL2).

---

## Getting Started

Clone this repo:

    git clone https://github.com/JesperHagman/Sensor-Sensor-readings-app.git
    cd sensor-sensor-readings-app

### Start the stack (with `make`)

    make up          # build + start db, backend, frontend
    make migrate     # run database migrations (entrypoint does this too)
    make seed        # optional: load demo user/sensors/readings
    make logs        # tail all service logs

### Start the stack (without `make`)

If you don’t have `make` available (Windows without Git Bash/WSL2):

    # create backend/.env if missing
    cat > backend/.env << 'EOF'
    POSTGRES_DB=sensors
    POSTGRES_USER=sensors
    POSTGRES_PASSWORD=sensors
    POSTGRES_HOST=db
    POSTGRES_PORT=5432
    DJANGO_SECRET_KEY=dev-secret-change-me
    DJANGO_DEBUG=1
    CORS_ORIGIN=http://localhost:3000
    EOF

    # build and start
    docker compose up -d --build

    # apply migrations
    docker compose exec web python manage.py migrate

    # seed demo data (optional)
    docker compose exec web python manage.py seed_data

## Running Locally (without Docker)

If you prefer to run the project directly on your machine instead of Docker:

1. **Backend (Django with SQLite)**
   - Create a virtual environment and install dependencies:  
     ```bash
     cd backend
     # On Mac/Linux you may need to use "python3" instead of "python"
     python -m venv venv
     source venv/bin/activate   # On Windows: venv\Scripts\activate
     pip install -r requirements.txt
     ```
   - For local development we use **SQLite**, so no extra database setup is required.  
     Your `settings.py` should already point to something like:
     ```python
     DATABASES = {
         "default": {
             "ENGINE": "django.db.backends.sqlite3",
             "NAME": BASE_DIR / "db.sqlite3",
         }
     }
     ```
   - Run database migrations:  
     ```bash
     # Use python or python3 depending on your OS
     python manage.py migrate
     ```
   - (Optional) Load seed data:  
     ```bash
     python manage.py seed_data
     ```
   - Start the backend server:  
     ```bash
     python manage.py runserver
     ```
   - Backend will be available at: [http://localhost:8000/api/docs](http://localhost:8000/api/docs)

2. **Frontend (Angular)**
   - Install dependencies:  
     ```bash
     cd frontend
     npm install
     ```
   - Start the Angular development server:  
     ```bash
     npm start
     ```
   - Frontend will be available at: [http://localhost:4200](http://localhost:4200) (proxies API calls to backend)

### Demo User (after seeding)

- **Username**: demo  
- **Password**: demo1234

### URLs

- Backend API docs: http://localhost:8000/api/docs  
- Frontend app: http://localhost:3000

### Useful Commands

    make migrate         # apply migrations
    make makemigrations  # create new migrations
    make seed            # load demo data
    make test            # run backend tests in Docker
    make logs            # tail logs
    make websh           # shell into the backend container
    make dbsh            # shell into the db container
    make down            # stop & remove containers (keeps volumes)
