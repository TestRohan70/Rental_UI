import { Injectable, signal } from '@angular/core';

export interface LoaderOptions {
  message?: string;
  subtitle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  readonly isVisible = signal(false);
  readonly message = signal('Loading...');
  readonly subtitle = signal('Please wait while Premisus 360 prepares everything for you.');

  private activeRequests = 0;
  private manualLocks = 0;

  show(options?: LoaderOptions): void {
    if (options?.message) {
      this.message.set(options.message);
    }

    if (options?.subtitle) {
      this.subtitle.set(options.subtitle);
    }

    this.manualLocks++;
    this.isVisible.set(true);
  }

  hide(): void {
    this.manualLocks = Math.max(0, this.manualLocks - 1);
    this.updateVisibility();
  }

  showRequest(): void {
    this.activeRequests++;
    this.isVisible.set(true);
  }

  hideRequest(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    this.updateVisibility();
  }

  reset(): void {
    this.activeRequests = 0;
    this.manualLocks = 0;
    this.isVisible.set(false);
    this.message.set('Loading...');
    this.subtitle.set('Please wait while Premisus 360 prepares everything for you.');
  }

  private updateVisibility(): void {
    const visible = this.activeRequests > 0 || this.manualLocks > 0;
    this.isVisible.set(visible);

    if (!visible) {
      this.message.set('Loading...');
      this.subtitle.set('Please wait while Premisus 360 prepares everything for you.');
    }
  }
}
