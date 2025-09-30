// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { LoginComponent } from './features/login/login.component';
import { SensorsListComponent } from './features/sensors-list/sensors-list.component';
import { SensorDetailComponent } from './features/sensor-detail/sensor-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'sensors', pathMatch: 'full' },
      { path: 'sensors', component: SensorsListComponent },
      { path: 'sensors/:id', component: SensorDetailComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
