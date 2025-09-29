# backend/sensors/management/commands/seed_data.py

import csv
from pathlib import Path
from typing import Optional

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.dateparse import parse_datetime

from sensors.models import Sensor, Reading


def _parse_ts(val: Optional[str]):
    """Robust to '+' → ' ' copy/paste och extra whitespace."""
    if not val:
        return None
    s = val.strip()
    # Ibland blir "+00:00" ett mellanslag via t.ex. Excel/export → reparera:
    if " " in s and s.endswith("00:00") and "+" not in s and "T" not in s:
        # exempel: "2024-08-01 00:00:00 00:00" → "2024-08-01 00:00:00+00:00"
        parts = s.rsplit(" ", 1)
        if len(parts) == 2 and parts[1].count(":") == 1:
            s = parts[0] + "+" + parts[1]
    # Stöd även "YYYY-MM-DD HH:MM:SS+00:00" (utan 'T') — parse_datetime klarar båda.
    return parse_datetime(s)


class Command(BaseCommand):
    help = "Seed DB med demo-användare, sensorer (från device_id) och readings från long-format CSV."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            type=str,
            help="Sökväg till CSV i long format (timestamp,device_id,temperature,humidity).",
        )

    def handle(self, *args, **options):
        # 0) Hitta CSV
        candidates = []
        if options.get("path"):
            candidates.append(Path(options["path"]))
        # Vanliga filnamn vi kollar efter i projektroten:
        candidates += [
            Path(settings.BASE_DIR) / "sensor_readings_long.csv",
            Path(settings.BASE_DIR) / "sensor_readings.csv",
            Path(settings.BASE_DIR) / "sensor_readings_wide.csv",  # om någon råkat döpa "fel"
        ]
        csv_path = next((p for p in candidates if p.exists()), None)

        if not csv_path:
            self.stdout.write(self.style.WARNING(
                "Hittade ingen CSV. Ange med --path eller lägg 'sensor_readings_long.csv' i projektroten."
            ))
            return

        self.stdout.write(f"Using CSV: {csv_path}")

        # 1) Säkerställ demo-user
        user, created = User.objects.get_or_create(
            username="demo", defaults={"email": "demo@example.com"}
        )
        if created:
            user.set_password("demo1234")
            user.save()
            self.stdout.write(self.style.SUCCESS("Created demo user (demo/demo1234)"))
        else:
            self.stdout.write("Demo user already exists")

        # 2) Läs in alla rows, samla device_ids för att skapa sensorer först
        device_ids = set()
        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            required = {"timestamp", "device_id", "temperature", "humidity"}
            missing = required.difference({c.strip() for c in reader.fieldnames or []})
            if missing:
                self.stdout.write(self.style.ERROR(
                    f"CSV saknar kolumner: {', '.join(sorted(missing))}"
                ))
                return

            for row in reader:
                did = (row.get("device_id") or "").strip()
                if did:
                    device_ids.add(did)

        # 3) Skapa/återanvänd sensorer för alla device_ids
        name_to_sensor = {}
        for did in sorted(device_ids):
            sensor, _ = Sensor.objects.get_or_create(
                owner=user,
                name=did,
                defaults={"model": "Imported"},
            )
            name_to_sensor[did] = sensor
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(name_to_sensor)} sensors exist"))

        # 4) Läs CSV igen och skapa readings idempotent
        created_count = 0
        skipped_dupes = 0
        bad_rows = 0

        # Kör i transaktion för lite snabbare import
        with transaction.atomic():
            with open(csv_path, newline="") as f:
                reader = csv.DictReader(f)
                for idx, row in enumerate(reader, start=2):  # start=2 pga header på rad 1
                    ts = _parse_ts(row.get("timestamp"))
                    did = (row.get("device_id") or "").strip()
                    t_raw = (row.get("temperature") or "").strip()
                    h_raw = (row.get("humidity") or "").strip()

                    if not (ts and did and t_raw and h_raw):
                        bad_rows += 1
                        continue

                    sensor = name_to_sensor.get(did)
                    if not sensor:
                        # Om nytt device_id dyker upp i mitten — skapa sensorn “on the fly”
                        sensor, _ = Sensor.objects.get_or_create(
                            owner=user, name=did, defaults={"model": "Imported"}
                        )
                        name_to_sensor[did] = sensor

                    try:
                        t_val = float(t_raw.replace(",", "."))  # stöd ev. svensk decimal
                        h_val = float(h_raw.replace(",", "."))
                    except ValueError:
                        bad_rows += 1
                        continue

                    obj, created_row = Reading.objects.get_or_create(
                        sensor=sensor,
                        timestamp=ts,
                        defaults={"temperature": t_val, "humidity": h_val},
                    )
                    if created_row:
                        created_count += 1
                    else:
                        skipped_dupes += 1

        # 5) Summering
        self.stdout.write(self.style.SUCCESS(
            f"Imported {created_count} readings "
            f"(skipped existing: {skipped_dupes}, bad rows: {bad_rows})"
        ))