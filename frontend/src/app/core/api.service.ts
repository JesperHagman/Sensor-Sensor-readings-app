// src/app/core/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtPair, Paginated, Sensor, Reading, RegisterIn } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

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

listReadings(
  sensorId: number,
  q: { page?: number; page_size?: number; start?: string; end?: string } = {}
) {
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

    register(body: RegisterIn) {
    return this.http.post('/api/auth/register/', body);
  }

}
