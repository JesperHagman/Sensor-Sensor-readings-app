// src/app/pages/sensors-list/sensors-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Sensor } from '../../core/models';

@Component({
  selector: 'app-sensors-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sensors-list.component.html',
  styleUrls: ['./sensors-list.component.scss']
})
export class SensorsListComponent implements OnInit {
  sensors: Sensor[] = [];
  loading = false;
  error: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.listSensors({ page: 1, page_size: 20 }).subscribe({
      next: (res) => { this.sensors = res.items; this.loading = false; },
      error: (e) => { this.error = 'Kunde inte hämta sensorer'; this.loading = false; console.error(e); }
    });
  }
}
