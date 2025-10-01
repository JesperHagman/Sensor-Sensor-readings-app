// src/app/core/idle.service.ts
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { AuthService } from './auth.service';

const IDLE_MS = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class IdleService {
  private activitySub?: Subscription;
  private idleTimerSub?: Subscription;
  private lastActive = Date.now();

  constructor(private zone: NgZone, private auth: AuthService, private router: Router) {}

  start() {
    // Listen to common activity events
    this.zone.runOutsideAngular(() => {
      const activity$ = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll')
      );
      this.activitySub?.unsubscribe();
      this.activitySub = activity$.subscribe(() => this.markActive());
    });

    this.resetIdleTimer();
  }

  stop() {
    this.activitySub?.unsubscribe();
    this.idleTimerSub?.unsubscribe();
  }

  private markActive() {
    this.lastActive = Date.now();
    this.resetIdleTimer();
  }

  private resetIdleTimer() {
    this.idleTimerSub?.unsubscribe();
    // set a one-shot timer to fire at lastActive + IDLE_MS
    const remaining = Math.max(0, this.lastActive + IDLE_MS - Date.now());
    this.idleTimerSub = timer(remaining).subscribe(() => {
      // Idle timeout reached -> log out and go to login
      this.zone.run(() => {
        this.auth.logout(); // clears tokens + navigates to /login
      });
    });
  }

  /** Whether we consider the user idle right now */
  isIdle(): boolean {
    return Date.now() - this.lastActive >= IDLE_MS;
  }
}
