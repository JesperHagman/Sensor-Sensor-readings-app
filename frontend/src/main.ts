// src/main.ts (or in AppComponent constructor)
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { IdleService } from './app/core/idle.service';

bootstrapApplication(AppComponent, appConfig).then((ref) => {
  const injector = ref.injector;
  const idle = injector.get(IdleService);
  idle.start();
});
