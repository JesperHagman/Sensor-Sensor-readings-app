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

/** ---- Auth models ---- */
export interface RegisterIn {
  username: string;
  email: string;
  password: string;
}

export interface UserOut {
  id: number;
  username: string;
  email: string;
}

export interface LoginIn {
  username: string;
  password: string;
}

export interface JwtPair {
  access: string;
  refresh: string;
}

/** Backendens register-svar (du returnerar access, refresh, user) */
export interface RegisterOut {
  access: string;
  refresh: string;
  user: UserOut;
}
