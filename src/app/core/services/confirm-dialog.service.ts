import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmDialogState | null>(null);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        tone: 'default',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        ...options,
        resolve
      });
    });
  }

  accept(): void {
    const current = this.state();
    if (!current) {
      return;
    }
    current.resolve(true);
    this.state.set(null);
  }

  cancel(): void {
    const current = this.state();
    if (!current) {
      return;
    }
    current.resolve(false);
    this.state.set(null);
  }
}
