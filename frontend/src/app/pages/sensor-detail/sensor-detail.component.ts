import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subscription, forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';

interface Sensor {
  id: number;
  name: string;
  model: string;
  description?: string | null;
}

interface Reading {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string; // ISO
}

interface Page<T> {
  items: T[];
  count: number;
  page: number;
  page_size: number;
}

@Component({
  selector: 'app-sensor-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sensor-detail.component.html',
  styleUrls: ['./sensor-detail.component.scss'],
})
export class SensorDetailComponent implements OnInit, OnDestroy {
  sensor?: Sensor;
  readings: Reading[] = [];
  loading = true;
  error?: string;

  private sub?: Subscription;
  private chart?: Chart;

  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Ogiltigt sensor-id i URL:en.';
      this.loading = false;
      return;
    }

    // hämta sensor + läsningar samtidigt (utan paginering först)
    const sensor$ = this.http.get<Sensor>(`/api/sensors/${id}/`);
    const readings$ = this.http.get<Page<Reading>>(
      `/api/sensors/${id}/readings/`,
      { params: new HttpParams().set('page_size', 200) } // ta t.ex. 200 mätpunkter
    );

    this.sub = forkJoin({ sensor: sensor$, readings: readings$ }).subscribe({
      next: ({ sensor, readings }) => {
        this.sensor = sensor;
        // sortera stigande tid för snyggare linje
        this.readings = [...readings.items].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        this.loading = false;
        setTimeout(() => this.renderChart(), 0);
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Kunde inte hämta data.';
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.destroyChart();
  }

  private destroyChart() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private renderChart() {
    if (!this.lineChartRef || !this.readings.length) return;
    this.destroyChart();

    const labels = this.readings.map(r =>
      new Date(r.timestamp).toLocaleString()
    );

    const temp = this.readings.map(r => r.temperature);
    const hum = this.readings.map(r => r.humidity);

    this.chart = new Chart(this.lineChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temp,
            yAxisID: 'y1',
            pointRadius: 0,
            tension: 0.2,
          },
          {
            label: 'Humidity (%)',
            data: hum,
            yAxisID: 'y2',
            pointRadius: 0,
            tension: 0.2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y1: {
            type: 'linear',
            position: 'left',
          },
          y2: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
          },
          x: {
            ticks: { autoSkip: true, maxTicksLimit: 8 },
          },
        },
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true },
        },
      },
    });
  }

  // Visa de senaste 20 raderna i tabellen under grafen
  get latest20(): Reading[] {
    return this.readings.slice(-20).reverse();
  }
}
