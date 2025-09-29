from django.db import models
from django.conf import settings

class Sensor(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sensors"
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    model = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} ({self.model})"


class Reading(models.Model):
    sensor = models.ForeignKey(
        Sensor,
        on_delete=models.CASCADE,
        related_name="readings"
    )
    temperature = models.FloatField()
    humidity = models.FloatField()
    timestamp = models.DateTimeField()

    class Meta:
        unique_together = (("sensor", "timestamp"),)
        indexes = [models.Index(fields=["sensor", "timestamp"])]

    def __str__(self):
        return f"{self.sensor.name} @ {self.timestamp}"
