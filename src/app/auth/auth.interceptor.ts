// src/app/auth/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';

// Si tienes un AuthService con accessToken(), úsalo. Si no, lee de localStorage:
function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('auth');
    //console.log("getAccessToken - raw: ", raw )
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    //console.log("getAccessToken - parsed: ", parsed)
    return parsed?.accessToken ?? null; // <-- "access" coincide con tu API .NET
  } catch { return null; }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getAccessToken();
  //console.log('authInterceptor - Token: ', token)
  if (!token) return next(req);

  // Resolver URL base del API
  let base: URL | null = null;
  try { base = new URL(environment.apiBaseUrl); } catch { /* no-op */ }
  console.log('authInterceptor - base', base)

  const isAbsolute = /^https?:\/\//i.test(req.url);
  console.log("authInterceptor - isAbsolute", isAbsolute)

  let shouldAttach = false;
  if (isAbsolute && base) {
    // Si la request es absoluta, adjunta solo si host/puerto coinciden y el path empieza por el path base
    const u = new URL(req.url);
    shouldAttach = (u.host === base.host && u.protocol === base.protocol &&
                    u.pathname.startsWith(base.pathname));
  } else {
    // Si es relativa, adjunta si empieza con "/api" (ajústalo a tu prefijo)
    shouldAttach = req.url.startsWith('/api');
  }

  if (shouldAttach && !req.headers.has('Authorization')) {    
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
