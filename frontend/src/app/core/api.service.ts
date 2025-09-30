// src/app/core/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Paginated<T> {
  items: T[];
  count: number;
  page: number;
  page_size: number;
}

export interface Sensor {
  id: number;
  name: string;
  model: string;
  description: string | null;
}

export interface Reading {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string; // ISO
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl; // ex '/api'

  // Auth (anpassa end-points till ditt backend)
  login(data: { username: string; password: string }) {
    return this.http.post<{ access: string; refresh?: string }>(`${this.base}/auth/login/`, data);
  }

  // Sensors
  listSensors(params?: { page?: number; page_size?: number }): Observable<Paginated<Sensor>> {
    return this.http.get<Paginated<Sensor>>(`${this.base}/sensors/`, { params: params as any });
  }

  getSensor(id: number): Observable<Sensor> {
    return this.http.get<Sensor>(`${this.base}/sensors/${id}/`);
  }

  // Readings
  listReadings(sensorId: number, params?: { page?: number; page_size?: number }): Observable<Paginated<Reading>> {
    return this.http.get<Paginated<Reading>>(`${this.base}/sensors/${sensorId}/readings/`, { params: params as any });
  }
}
