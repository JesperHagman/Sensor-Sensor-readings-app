// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

// OBS: uppdaterade sökvägar till pages/
import { LoginComponent } from './pages/login/login.component';
import { SensorsListComponent } from './pages/sensors-list/sensors-list.component';
import { SensorDetailComponent } from './pages/sensor-detail/sensor-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: '',
    canActivate: [AuthGuard],
    runGuardsAndResolvers: 'always',
    children: [
      { path: '', redirectTo: 'sensors', pathMatch: 'full' },
      { path: 'sensors', component: SensorsListComponent },
      { path: 'sensors/:id', component: SensorDetailComponent },
    ],
  },

  { path: '**', redirectTo: '' },
];
