// src/app/core/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  JwtPair,
  Paginated,
  Sensor,
  Reading,
  RegisterIn,
  RegisterOut,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ---- Auth ----
  login(body: { username: string; password: string }): Observable<JwtPair> {
    return this.http.post<JwtPair>('/api/auth/token/', body);
  }

  register(body: RegisterIn): Observable<RegisterOut> {
    return this.http.post<RegisterOut>('/api/auth/register/', body);
  }

  // ---- Sensors ----
  listSensors(q: { page?: number; page_size?: number; q?: string } = {}): Observable<Paginated<Sensor>> {
    let params = new HttpParams();
    if (q.page) params = params.set('page', q.page);
    if (q.page_size) params = params.set('page_size', q.page_size);
    if (q.q) params = params.set('q', q.q);
    return this.http.get<Paginated<Sensor>>('/api/sensors/', { params });
  }

  getSensor(id: number): Observable<Sensor> {
    return this.http.get<Sensor>(`/api/sensors/${id}/`);
  }

  createSensor(body: { name: string; model: string; description?: string | null }): Observable<Sensor> {
    return this.http.post<Sensor>('/api/sensors/', body);
  }

  // ---- Readings ----
  listReadings(
    sensorId: number,
    q: { page?: number; page_size?: number; start?: string; end?: string } = {}
  ): Observable<Paginated<Reading>> {
    let params = new HttpParams();
    if (q.page) params = params.set('page', q.page);
    if (q.page_size) params = params.set('page_size', q.page_size);
    if (q.start) params = params.set('timestamp_from', q.start);
    if (q.end) params = params.set('timestamp_to', q.end);
    return this.http.get<Paginated<Reading>>(
      `/api/sensors/${sensorId}/readings/`,
      { params }
    );
  }

  createReading(
    sensorId: number,
    body: { temperature: number; humidity: number; timestamp: string }
  ): Observable<Reading> {
    return this.http.post<Reading>(`/api/sensors/${sensorId}/readings/`, body);
  }
}
