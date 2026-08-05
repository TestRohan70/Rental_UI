import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { LoaderService } from '../../../core/services/loader.service';
import { Resident } from '../../../core/models/resident.model';

@Component({
  selector: 'app-admin-register-security',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-register-security.html',
  styleUrl: './admin-register-security.css'
})
export class AdminRegisterSecurity implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);
  readonly loader = inject(LoaderService);

  readonly staffList = signal<Resident[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  touched: Record<string, boolean> = {};

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    const adminId = this.authService.getUserId();
    if (!adminId) {
      return;
    }

    this.loader.show();
    this.adminService.getGateStaff(adminId).subscribe({
      next: (staff) => {
        this.staffList.set(staff);
        this.loader.hide();
      },
      error: () => {
        this.errorMessage.set('Unable to load gate security staff.');
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
      case 'name':
        return this.form.name.trim() ? null : 'Name is required';
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
    return !this.getFieldError('name') &&
      !this.getFieldError('email') &&
      !this.getFieldError('password') &&
      !this.getFieldError('confirmPassword');
  }

  submit(): void {
    this.touched = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true
    };

    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.isFormValid()) {
      return;
    }

    const adminId = this.authService.getUserId();
    if (!adminId) {
      this.errorMessage.set('Session expired. Please sign in again.');
      return;
    }

    this.loader.show();
    this.adminService.registerGateStaff(adminId, {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password
    }).subscribe({
      next: () => {
        this.successMessage.set('Gate security registered successfully. They can sign in immediately.');
        this.form = { name: '', email: '', password: '', confirmPassword: '' };
        this.touched = {};
        this.loadStaff();
        this.loader.hide();
      },
      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ?? 'Unable to register gate security. Please try again.'
        );
        this.loader.hide();
      }
    });
  }

  statusLabel(status?: string): string {
    return status === 'Approved' ? 'Active' : status ?? 'Unknown';
  }
}
