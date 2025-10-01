#!/usr/bin/env bash
set -e

python manage.py migrate --noinput

# Optional: auto-seed if you want (toggle with env var)
if [ "$SEED_ON_START" = "1" ]; then
  python manage.py seed_data || true
fi

python manage.py runserver 0.0.0.0:8000
