// src/app/features/sensors-list/sensors-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Sensor } from '../../core/api.service';

@Component({
  standalone: true,
  selector: 'app-sensors-list',
  imports: [CommonModule, RouterLink],
  template: `
  <div class="wrap">
    <h2>Sensors</h2>
    <ul>
      <li *ngFor="let s of sensors">
        <a [routerLink]="['/sensors', s.id]">{{ s.name }} — {{ s.model }}</a>
      </li>
    </ul>
  </div>
  `,
  styles: [`.wrap{max-width:800px;margin:24px auto}`]
})
export class SensorsListComponent implements OnInit {
  private api = inject(ApiService);
  sensors: Sensor[] = [];

  ngOnInit() {
    this.api.listSensors({ page: 1, page_size: 50 }).subscribe(res => {
      this.sensors = res.items;
    });
  }
}
