import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils.dateparse import parse_datetime
from django.conf import settings

from sensors.models import Sensor, Reading


class Command(BaseCommand):
    help = "Seed database with demo user, sensors, and readings from CSV"

    def handle(self, *args, **options):
        # --- 1. Skapa eller återanvänd demo user ---
        user, created = User.objects.get_or_create(
            username="demo",
            defaults={"email": "demo@example.com"}
        )
        if created:
            user.set_password("demo1234")
            user.save()
            self.stdout.write(self.style.SUCCESS("Created demo user (demo/demo1234)"))
        else:
            self.stdout.write("Demo user already exists")

        # --- 2. Skapa/uppdatera sensorer (idempotent) ---
        sensors_data = [
            ("device-001", "EnviroSense"),
            ("device-002", "ClimaTrack"),
            ("device-003", "AeroMonitor"),
            ("device-004", "HydroTherm"),
            ("device-005", "EcoStat"),
        ]

        sensors = {}
        for name, model in sensors_data:
            qs = Sensor.objects.filter(owner=user, name=name).order_by("id")
            if qs.exists():
                sensor = qs.first()
                # uppdatera model om den skiljer sig
                if sensor.model != model:
                    sensor.model = model
                    sensor.save(update_fields=["model"])
            else:
                sensor = Sensor.objects.create(owner=user, name=name, model=model)
            sensors[name] = sensor

        self.stdout.write(self.style.SUCCESS("Ensured 5 sensors exist (deduped if needed)"))

        # --- 3. Ladda CSV med readings ---
        csv_path = Path(settings.BASE_DIR) / "sensor_readings_wide.csv"
        if not csv_path.exists():
            self.stdout.write(self.style.WARNING(f"No CSV file found at {csv_path}"))
            return

        with open(csv_path, newline="") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # CSV antas ha kolumner: sensor, temperature, humidity, timestamp
                name = row["sensor"]
                sensor = sensors.get(name)
                if not sensor:
                    continue
                Reading.objects.get_or_create(
                    sensor=sensor,
                    timestamp=parse_datetime(row["timestamp"]),
                    defaults={
                        "temperature": float(row["temperature"]),
                        "humidity": float(row["humidity"]),
                    },
                )
                count += 1
            self.stdout.write(self.style.SUCCESS(f"Imported {count} readings"))