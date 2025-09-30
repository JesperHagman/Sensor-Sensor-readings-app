// src/app/features/sensor-detail/sensor-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService, Reading, Sensor } from '../../core/api.service';

@Component({
  standalone: true,
  selector: 'app-sensor-detail',
  imports: [CommonModule],
  template: `
  <div class="wrap" *ngIf="sensor">
    <h2>{{ sensor.name }} <small>({{ sensor.model }})</small></h2>
    <table>
      <thead>
        <tr><th>Time</th><th>Temp (°C)</th><th>Humidity (%)</th></tr>
      </thead>
      <tbody>
        <tr *ngFor="let r of readings">
          <td>{{ r.timestamp | date:'yyyy-MM-dd HH:mm' }}</td>
          <td>{{ r.temperature }}</td>
          <td>{{ r.humidity }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  `,
  styles: [`.wrap{max-width:900px;margin:24px auto}
  table{width:100%;border-collapse:collapse}
  th,td{border-bottom:1px solid #eee;padding:8px;text-align:left}`]
})
export class SensorDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  sensor?: Sensor;
  readings: Reading[] = [];

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getSensor(id).subscribe(s => this.sensor = s);
    this.api.listReadings(id, { page: 1, page_size: 100 }).subscribe(r => this.readings = r.items);
  }
}
