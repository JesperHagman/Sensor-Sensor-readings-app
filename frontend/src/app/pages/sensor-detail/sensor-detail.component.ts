// src/app/features/sensor-detail/sensor-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

  // readings list
  pageData?: Paginated<Reading>;
  readings: Reading[] = [];
  loading = false;
  error?: string;

  // pagination
  page = 1;
  pageSize = 100;

  // chart
  private sub?: Subscription;
  private chart?: Chart;
  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;

  // date filter (datetime-local)
  filterForm = this.fb.group({
    start: [''],
    end: [''],
  });

  // add reading
  addForm = this.fb.group({
    temperature: ['', Validators.required],
    humidity: ['', Validators.required],
    timestamp: ['', Validators.required], // datetime-local
  });

  // --- EDIT SENSOR (Update) ---
  editing = false;
  editForm = this.fb.group({
    name: ['', Validators.required],
    model: ['', Validators.required],
    description: [''],
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid sensor id in URL.';
      return;
    }
    this.loadSensor(id);
    this.fetchReadings(id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.destroyChart();
  }

  // ---------- Sensor CRUD ----------

  private loadSensor(id: number) {
    this.api.getSensor(id).subscribe({
      next: (s) => {
        this.sensor = s;
        // prefill edit form
        this.editForm.patchValue({
          name: s.name,
          model: s.model,
          description: s.description ?? '',
        });
      },
      error: () => (this.error = 'Failed to fetch sensor'),
    });
  }

  startEdit() {
    if (!this.sensor) return;
    this.editing = true;
    this.editForm.reset({
      name: this.sensor.name,
      model: this.sensor.model,
      description: this.sensor.description ?? '',
    });
  }

  cancelEdit() {
    this.editing = false;
  }

  saveSensor() {
    if (!this.sensor || this.editForm.invalid) return;
    const body = {
      name: this.editForm.value.name!,
      model: this.editForm.value.model!,
      description: (this.editForm.value.description ?? '') as string,
    };
    this.api.updateSensor(this.sensor.id, body).subscribe({
      next: (updated) => {
        this.sensor = updated;
        this.editing = false;
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Failed to update sensor';
        console.error(e);
      },
    });
  }

  deleteSensor() {
    if (!this.sensor) return;
    const ok = confirm(`Delete sensor "${this.sensor.name}"? This also deletes its readings.`);
    if (!ok) return;

    this.api.deleteSensor(this.sensor.id).subscribe({
      next: () => this.router.navigate(['/sensors']),
      error: (e) => {
        this.error = e?.error?.detail || 'Failed to delete sensor';
        console.error(e);
      },
    });
  }

  // ---------- Readings (list + filter + add) ----------

  private toIsoOrUndefined(v?: string | null): string | undefined {
    if (!v) return undefined;
    try {
      // datetime-local => local time; convert to ISO UTC
      return new Date(v).toISOString();
    } catch {
      return undefined;
    }
  }

  fetchReadings(id?: number) {
    const sensorId = id ?? Number(this.route.snapshot.paramMap.get('id'));
    if (!sensorId) return;

    this.loading = true;
    this.error = undefined;

    const { start, end } = this.filterForm.value;
    const startIso = this.toIsoOrUndefined(start || null);
    const endIso = this.toIsoOrUndefined(end || null);

    this.sub?.unsubscribe();
    this.sub = this.api
      .listReadings(sensorId, {
        page: this.page,
        page_size: this.pageSize,
        start: startIso,
        end: endIso,
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
          this.error = err?.error?.detail || 'Failed to fetch readings';
        },
      });
  }

  applyFilter() {
    this.page = 1;
    this.fetchReadings();
  }

  nextPage() {
    if (!this.pageData) return;
    if (this.page * this.pageSize < this.pageData.count) {
      this.page++;
      this.fetchReadings();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.fetchReadings();
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
        this.fetchReadings(id); // reload current page
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Failed to create reading';
        console.error(e);
      }
    });
  }

  // ---------- Chart ----------

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

    // Prepare data
    const dates = this.readings.map(r => new Date(r.timestamp));
    const labels = dates.map(d => d.toLocaleDateString()); 
    const temp = this.readings.map(r => r.temperature);
    const hum = this.readings.map(r => r.humidity);

    // Small helpers for tooltip formatting
    const fmtTime = (d: Date) =>
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fmtDate = (d: Date) => d.toLocaleDateString();

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
          x: {
            // show only the date on the axis
            ticks: {
              autoSkip: true,
              maxTicksLimit: 8,
              callback: (value, index) => fmtDate(dates[index]),
            },
          },
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            enabled: true,
            callbacks: {
              // Title: Date + Time in tooltip
              title: (items) => {
                const i = items[0].dataIndex;
                const d = dates[i];
                return `${fmtDate(d)} ${fmtTime(d)}`;
              },
              // Label: dataset label + value
              label: (ctx) => {
                const v = ctx.parsed.y;
                return `${ctx.dataset.label}: ${v}`;
              },
            },
          },
        },
      },
    });
  }

  // Latest 20 from current page
  get latest20(): Reading[] {
    return this.readings.slice(-20).reverse();
  }
}
