import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
export const appConfig: ApplicationConfig={providers:[provideBrowserGlobalErrorListeners(),provideRouter(routes),provideHttpClient(withInterceptors([(req,next)=>{const t=localStorage.getItem('token');return next(t?req.clone({setHeaders:{Authorization:`Bearer ${t}`}}):req)}]))]};
