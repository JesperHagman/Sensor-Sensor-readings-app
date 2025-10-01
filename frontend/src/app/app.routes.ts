// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { SensorsListComponent } from './pages/sensors-list/sensors-list.component';
import { SensorDetailComponent } from './pages/sensor-detail/sensor-detail.component';

export const routes: Routes = [
  // Publika
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Skyddat område
  {
    path: 'sensors',
    canActivate: [authGuard],
    children: [
      { path: '', component: SensorsListComponent },
      { path: ':id', component: SensorDetailComponent },
    ],
  },

  // Default: pekar mot skyddat område => om ej inloggad hamnar man på /login
  { path: '', redirectTo: 'sensors', pathMatch: 'full' },

  { path: '**', redirectTo: '' },
];
