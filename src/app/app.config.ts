import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_RIPPLE_GLOBAL_OPTIONS } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    // Sigue con Zone.js, pero con coalescing para menos trabajo de CD
    provideZoneChangeDetection({ eventCoalescing: true, runCoalescing: true }),
    // Animaciones diferidas (cargan cuando se necesitan)
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Desactiva ripple globalmente (menos trabajo y animaciones)
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: true } },
  ],
};
