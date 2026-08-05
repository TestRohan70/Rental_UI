import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LoaderService } from '../../../core/services/loader.service';
import {
  CreateSocietyAlertRequest,
  SocietyAlert,
  SocietyAlertService,
  SocietyAlertType
} from '../../../core/services/society-alert.service';

@Component({
  selector: 'app-generate-alert',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generate-alert.html',
  styleUrl: './generate-alert.css'
})
export class GenerateAlert implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(SocietyAlertService);
  readonly loader = inject(LoaderService);

  readonly alertList = signal<SocietyAlert[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly alertTypes: SocietyAlertType[] = ['Emergency', 'General', 'Maintenance'];

  form = {
    title: '',
    message: '',
    alertType: 'General' as SocietyAlertType
  };

  touched: Record<string, boolean> = {};

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    const createdById = this.authService.getUserId();
    if (!createdById) {
      return;
    }

    this.loader.show();
    this.alertService.getAlerts(createdById).subscribe({
      next: (alerts) => {
        this.alertList.set(alerts);
        this.loader.hide();
      },
      error: () => {
        this.errorMessage.set('Unable to load society alerts.');
        this.loader.hide();
      }
    });
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  getFieldError(field: string): string | null {
    if (!this.touched[field]) {
      return null;
    }

    switch (field) {
      case 'title':
        return this.form.title.trim() ? null : 'Title is required';
      case 'message':
        return this.form.message.trim() ? null : 'Message is required';
      default:
        return null;
    }
  }

  isFieldInvalid(field: string): boolean {
    return !!this.getFieldError(field);
  }

  isFormValid(): boolean {
    return !this.getFieldError('title') && !this.getFieldError('message');
  }

  submit(): void {
    this.touched = { title: true, message: true };
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.isFormValid()) {
      return;
    }

    const createdById = this.authService.getUserId();
    if (!createdById) {
      this.errorMessage.set('Session expired. Please sign in again.');
      return;
    }

    const payload: CreateSocietyAlertRequest = {
      title: this.form.title.trim(),
      message: this.form.message.trim(),
      alertType: this.form.alertType
    };

    this.loader.show();
    this.alertService.createAlert(createdById, payload).subscribe({
      next: () => {
        this.successMessage.set('Society alert generated successfully.');
        this.form = { title: '', message: '', alertType: 'General' };
        this.touched = {};
        this.loadAlerts();
        this.loader.hide();
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ?? 'Unable to generate alert. Please try again.'
        );
        this.loader.hide();
      }
    });
  }

  alertTypeClass(type: string): string {
    switch (type) {
      case 'Emergency':
        return 'alert-type emergency';
      case 'Maintenance':
        return 'alert-type maintenance';
      default:
        return 'alert-type general';
    }
  }

  formatDate(value?: string): string {
    if (!value) {
      return 'Just now';
    }

    return new Date(value).toLocaleString();
  }
}
