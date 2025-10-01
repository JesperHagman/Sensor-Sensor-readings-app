// src/app/pages/sensors-list/sensors-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Sensor } from '../../core/models';

@Component({
  selector: 'app-sensors-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './sensors-list.component.html',
  styleUrls: ['./sensors-list.component.scss']
})
export class SensorsListComponent implements OnInit {
  sensors: Sensor[] = [];
  loading = false;
  error: string | null = null;

  // Sök + paginering
  q = '';
  page = 1;
  pageSize = 20;
  totalCount = 0;

  // Skapa sensor
  addForm = this.fb.group({
    name: [''],
    model: [''],
    description: [''],
  });

  constructor(private api: ApiService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true; this.error = null;
    this.api.listSensors({ page: this.page, page_size: this.pageSize, q: this.q || undefined })
      .subscribe({
        next: (res) => {
          this.sensors = res.items;
          this.totalCount = res.count;
          this.loading = false;
        },
        error: (e) => {
          this.error = 'Kunde inte hämta sensorer';
          this.loading = false;
          console.error(e);
        }
      });
  }

  applySearch(): void {
    this.page = 1;
    this.load();
  }

  nextPage(): void {
    if (this.page * this.pageSize < this.totalCount) {
      this.page++;
      this.load();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  add(): void {
    if (this.addForm.invalid) return;
    this.api.createSensor(this.addForm.value as any).subscribe({
      next: () => {
        this.addForm.reset();
        // Hoppa till första sidan så ny sensor syns (om sorterade på id stigande)
        this.page = 1;
        this.load();
      },
      error: (e) => {
        this.error = e?.error?.detail || 'Kunde inte skapa sensor';
        console.error(e);
      }
    });
  }
}
