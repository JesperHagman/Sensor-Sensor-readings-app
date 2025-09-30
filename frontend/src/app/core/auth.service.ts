import { Injectable } from '@angular/core';
import { Api } from './api.service';
import { LoginIn, RegisterIn, TokenOut, UserOut } from './models';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }
  set token(v: string | null) {
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
  }
  get isLoggedIn(): boolean { return !!this.token; }

  async register(payload: RegisterIn): Promise<UserOut> {
    const { data } = await Api.instance().post<UserOut>(`${environment.auth.register}`, payload);
    return data;
  }

  async login(payload: LoginIn): Promise<void> {
    // OBS: justera path/body efter din backend
    const { data } = await Api.instance().post<TokenOut>(`${environment.auth.login}`, payload);
    this.token = data.access;
  }

  logout() { this.token = null; }
}
