// src/app/core/models.ts
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
  description?: string | null; // <- optional för att matcha API:t
}

export interface Reading {
  id: number;
  temperature: number;
  humidity: number;
  timestamp: string; // ISO
}

export interface LoginIn {
  username: string;
  password: string;
}

export interface JwtPair {
  access: string;
  refresh: string;
}

export interface RegisterIn {
  username: string; 
  email: string; 
  password: string;
}