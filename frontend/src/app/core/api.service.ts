// src/app/core/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JwtPair { access: string; refresh: string; }
export interface Paginated<T> { items: T[]; count: number; page: number; page_size: number; }
export interface Sensor { id: number; name: string; model: string; description?: string | null; }
export interface Reading { id: number; temperature: number; humidity: number; timestamp: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // ✅ Rätt endpoint
  login(body: { username: string; password: string }): Observable<JwtPair> {
    return this.http.post<JwtPair>('/api/auth/token/', body);
  }

  listSensors(q: { page?: number; page_size?: number } = {}): Observable<Paginated<Sensor>> {
    let params = new HttpParams();
    if (q.page) params = params.set('page', q.page);
    if (q.page_size) params = params.set('page_size', q.page_size);
    return this.http.get<Paginated<Sensor>>('/api/sensors/', { params });
  }

  getSensor(id: number): Observable<Sensor> {
    return this.http.get<Sensor>(`/api/sensors/${id}/`);
  }

  listReadings(sensorId: number, q: { page?: number; page_size?: number } = {}): Observable<Paginated<Reading>> {
    let params = new HttpParams();
    if (q.page) params = params.set('page', q.page);
    if (q.page_size) params = params.set('page_size', q.page_size);
    return this.http.get<Paginated<Reading>>(`/api/sensors/${sensorId}/readings/`, { params });
  }
}
