import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SocietyConfigurationService, SocietySummary } from '../../../core/services/society-configuration.service';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'app-add-society-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-society-admin.html',
  styleUrl: './add-society-admin.css'
})
export class AddSocietyAdmin implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(SocietyConfigurationService);
  readonly loader = inject(LoaderService);

  societyId: number | null = null;
  readonly society = signal<SocietySummary | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  showPassword = false;
  showConfirmPassword = false;
  saving = false;

  form = {
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  touched: Record<string, boolean> = {};

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['societyId'];
    if (!idParam) {
      this.backToConfiguration();
      return;
    }

    this.societyId = Number(idParam);
    if (isNaN(this.societyId) || this.societyId <= 0) {
      this.backToConfiguration();
      return;
    }

    this.loadSocietyDetails();
  }

  loadSocietyDetails(): void {
    if (!this.societyId) return;

    this.loader.show();
    this.service.getSociety(this.societyId).subscribe({
      next: (data) => {
        this.society.set(data);
        this.loader.hide();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Unable to load society details.');
        this.loader.hide();
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  getFieldError(field: string): string | null {
    if (!this.touched[field]) {
      return null;
    }

    switch (field) {
      case 'userName':
        return this.form.userName.trim() ? null : 'Username is required';
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email.trim())
          ? null
          : 'Enter a valid email address';
      case 'password':
        return this.form.password.length >= 8 ? null : 'Password must be at least 8 characters';
      case 'confirmPassword':
        return this.form.confirmPassword === this.form.password ? null : 'Passwords do not match';
      default:
        return null;
    }
  }

  isFieldInvalid(field: string): boolean {
    return !!this.getFieldError(field);
  }

  isFormValid(): boolean {
    return !this.getFieldError('userName') &&
      !this.getFieldError('email') &&
      !this.getFieldError('password') &&
      !this.getFieldError('confirmPassword');
  }

  submit(): void {
    this.touched = {
      userName: true,
      email: true,
      password: true,
      confirmPassword: true
    };

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.isFormValid() || !this.societyId) {
      return;
    }

    this.saving = true;
    this.loader.message.set('Creating Society Admin...');
    this.loader.subtitle.set('Please wait while we assign the administrator to this society.');

    this.service.createSocietyAdmin(this.societyId, {
      userName: this.form.userName.trim(),
      email: this.form.email.trim(),
      password: this.form.password
    }).subscribe({
      next: (res) => {
        this.loader.hide();
        this.saving = false;
        this.successMessage.set(res?.message ?? 'Society Admin created and assigned successfully.');
        setTimeout(() => this.backToConfiguration(), 1200);
      },
      error: (error) => {
        this.loader.hide();
        this.saving = false;
        if (error.status === 409) {
          this.errorMessage.set(error?.error?.message ?? 'This society already has an assigned active Society Admin.');
        } else {
          this.errorMessage.set(error?.error?.message ?? 'Unable to create Society Admin. Please try again.');
        }
      }
    });
  }

  backToConfiguration(): void {
    if (this.societyId) {
      void this.router.navigate(['/padmin/society-configuration'], { queryParams: { id: this.societyId } });
    } else {
      void this.router.navigate(['/padmin/society-configuration']);
    }
  }
}
