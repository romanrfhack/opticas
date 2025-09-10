import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  const sucursalId = localStorage.getItem('sucursal_id'); // <- simulamos contexto
  console.log('Interceptando request:', req);
  console.log('Token:', token);
  console.log('Sucursal ID:', sucursalId);

  let headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (sucursalId) headers['X-Sucursal-Id'] = sucursalId; // <- el back la leerá del JWT o de este header

  const authReq = Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req;
  return next(authReq);
};
