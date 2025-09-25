// src/app/auth/auth.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface TokenResponse {
  accessToken: string;   // <-- coincide con tu API
  refreshToken: string;
  expiresInSeconds: number; // segundos
  user: { id: string; name: string; email: string; sucursalId: string; roles: string[] };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  private _user = signal<TokenResponse['user'] | null>(null);
  private _token = signal<string | null>(null);
  private _refresh = signal<string | null>(null);
  private _exp = signal<number | null>(null);

  user = computed(() => this._user());
  accessToken = computed(() => this._token());

  constructor() {
    const raw = localStorage.getItem('auth');
    if (raw) {
      try {
        const parsed: TokenResponse = JSON.parse(raw);
        this._user.set(parsed.user);
        this._token.set(parsed.accessToken);
        this._refresh.set(parsed.refreshToken);
        this._exp.set(Math.floor(Date.now()/1000) + (parsed.expiresInSeconds ?? 0));
        this.startAutoRefresh(); // <-- arrancar cuando hay sesión previa
      } catch {}
    }
  }

  isAuth() {
    const t = this._token();
    //console.log("isAuth - _token: ", t)
    if (!t) return false;
    return true; // opcional: valida exp si quieres
  }

  login(email: string, password: string) {
    return this.http.post<TokenResponse>(`${this.base}/auth/login`, { email, password });
  }
  
  persist(resp: TokenResponse) {
  localStorage.setItem('auth', JSON.stringify(resp));
  this._user.set(resp.user);
  this._token.set(resp.accessToken);
  this._refresh.set(resp.refreshToken);
  this._exp.set(Math.floor(Date.now()/1000) + resp.expiresInSeconds);
  localStorage.setItem('sucursal_id', resp.user.sucursalId);

  this.startAutoRefresh(); // <-- reprogramar
}

  clear() {
    localStorage.removeItem('auth');
    this._user.set(null);
    this._token.set(null);
    this._refresh.set(null);
    this._exp.set(null);
  }

  refresh() {
    const rt = this._refresh();
    if (!rt) throw new Error('No refresh token');
    return this.http.post<TokenResponse>(`${this.base}/auth/refresh`, { refreshToken: rt });
  }

  logout() {
    const rt = this._refresh();
    this.clear();
    if (rt) this.http.post(`${this.base}/auth/logout`, { refreshToken: rt }).subscribe();
  }

  updateProfile(body: { fullName: string; phoneNumber?: string }) {
  return this.http.put(`${this.base}/auth/me`, { FullName: body.fullName, PhoneNumber: body.phoneNumber ?? null });
  }

  changePassword(body: { currentPassword: string; newPassword: string }) {
    return this.http.post(`${this.base}/auth/change-password`, {
      CurrentPassword: body.currentPassword,
      NewPassword: body.newPassword
    });
  }

  // Para reflejar el nuevo nombre en la UI sin re-login:
  syncUserName(newName: string) {
    const raw = localStorage.getItem('auth'); if (!raw) return;
    const s = JSON.parse(raw); s.user.name = newName; localStorage.setItem('auth', JSON.stringify(s));
    this._user.set({ ...this._user()!, name: newName });
  }

  switchBranch(targetSucursalId: string) {
    return this.http.post<TokenResponse>(`${this.base}/auth/switch-branch`, { targetSucursalId });
  }

  // Timer de auto-refresh ~30s antes de expirar
  private _timer: any = null;
  startAutoRefresh() {
    if (!this._exp()) return;
    const ms = Math.max(5000, this._exp()! * 1000 - Date.now() - 30_000);
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this.refresh().subscribe({
        next: r => { this.persist(r); this.startAutoRefresh(); },
        error: _ => { /* opcional: logout o reintento */ }
      });
    }, ms);
  }  
}
