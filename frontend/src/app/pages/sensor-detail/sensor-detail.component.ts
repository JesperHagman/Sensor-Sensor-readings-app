// src/app/features/sensor-detail/sensor-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';

import { ApiService } from '../../core/api.service';
import { Sensor, Reading, Paginated } from '../../core/models';

@Component({
  selector: 'app-sensor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './sensor-detail.component.html',
  styleUrls: ['./sensor-detail.component.scss'],
})
export class SensorDetailComponent implements OnInit, OnDestroy {
  sensor?: Sensor;
  pageData?: Paginated<Reading>;
  readings: Reading[] = [];
  loading = false;
  error?: string;

  page = 1;
  pageSize = 100;

  private sub?: Subscription;
  private chart?: Chart;

  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;

  // datumfilter (datetime-local)
  form = this.fb.group({
    start: [''],
    end: [''],
  });

  // lägg till reading
  addForm = this.fb.group({
    temperature: [''],
    humidity: [''],
    timestamp: [''], // datetime-local
  });

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Ogiltigt sensor-id i URL:en.';
      return;
    }
    this.loadSensor(id);
    this.fetch(id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.destroyChart();
  }

  private loadSensor(id: number) {
    this.api.getSensor(id).subscribe({
      next: (s) => (this.sensor = s),
      error: () => (this.error = 'Kunde inte hämta sensor'),
    });
  }

  fetch(id?: number) {
    const sensorId = id ?? Number(this.route.snapshot.paramMap.get('id'));
    if (!sensorId) return;

    this.loading = true;
    this.error = undefined;

    const { start, end } = this.form.value;

    this.sub?.unsubscribe();
    this.sub = this.api
      .listReadings(sensorId, {
        page: this.page,
        page_size: this.pageSize,
        start: start || undefined,
        end: end || undefined,
      })
      .subscribe({
        next: (res) => {
          this.pageData = res;
          this.readings = [...res.items].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          this.loading = false;
          setTimeout(() => this.renderChart(), 0);
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.detail || 'Kunde inte hämta avläsningar';
        },
      });
  }

  applyFilter() {
    this.page = 1;
    this.fetch();
  }

  nextPage() {
    if (!this.pageData) return;
    if (this.page * this.pageSize < this.pageData.count) {
      this.page++;
      this.fetch();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.fetch();
    }
  }

  get totalPages(): number {
    return this.pageData ? Math.ceil(this.pageData.count / this.pageSize) : 0;
  }

  addReading() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const v = this.addForm.value;
    const iso = v.timestamp ? new Date(v.timestamp as string).toISOString() : '';
    this.api.createReading(id, {
      temperature: Number(v.temperature),
      humidity: Number(v.humidity),
      timestamp: iso,
    }).subscribe({
      next: () => {
        this.addForm.reset();
        // Ladda om aktuell sida
        this.fetch(id);
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Kunde inte skapa avläsning';
        console.error(e);
      }
    });
  }

  private destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private renderChart() {
    if (!this.lineChartRef || !this.readings.length) {
      this.destroyChart();
      return;
    }
    this.destroyChart();

    const labels = this.readings.map(r => new Date(r.timestamp).toLocaleString());
    const temp = this.readings.map(r => r.temperature);
    const hum = this.readings.map(r => r.humidity);

    this.chart = new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Temperature (°C)', data: temp, yAxisID: 'y1', pointRadius: 0, tension: 0.2 },
          { label: 'Humidity (%)', data: hum, yAxisID: 'y2', pointRadius: 0, tension: 0.2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y1: { type: 'linear', position: 'left' },
          y2: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } },
          x: { ticks: { autoSkip: true, maxTicksLimit: 8 } },
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
      },
    });
  }

  // Visa de senaste 20 (från just denna sida)
  get latest20(): Reading[] {
    return this.readings.slice(-20).reverse();
  }
}
