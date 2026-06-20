import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ResidentService } from './services/resident.service';
import { RegisterRequest } from './signup/register-request';
import { BrandLogo } from '../../../../shared/components/brand-logo/brand-logo';
import { LoaderService } from '../../../../core/services/loader.service';

type FormStep = 1 | 2;

interface SignupForm extends Omit<RegisterRequest, 'flatNo'> {
  flatNo: number | null;
  confirmPassword: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, BrandLogo],
  templateUrl: './signup.html',
  styleUrls: ['../../styles/auth-theme.css', './signup.css']
})
export class Signup {
  private readonly residentService = inject(ResidentService);
  private readonly router = inject(Router);
  readonly loader = inject(LoaderService);

  readonly currentStep = signal<FormStep>(1);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal('');
  readonly emailServerError = signal('');

  showPassword = false;
  showConfirmPassword = false;
  acceptTerms = false;
  touched: Record<string, boolean> = {};

  wingOptions = ['A', 'B', 'C', 'D', 'E', 'F'];

  form: SignupForm = {
    name: '',
    email: '',
    wing: '',
    flatNo: null,
    password: '',
    confirmPassword: ''
  };

  get passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const pwd = this.form.password;
    if (!pwd) return null;

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  }

  get passwordStrengthLabel(): string {
    switch (this.passwordStrength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  }

  markTouched(field: string): void {
    this.touched[field] = true;
  }

  onEmailInput(): void {
    if (this.emailServerError()) {
      this.emailServerError.set('');
      this.errorMessage.set('');
    }
  }

  isFieldInvalid(field: keyof SignupForm): boolean {
    if (field === 'email' && this.emailServerError()) {
      return true;
    }

    if (!this.touched[field]) {
      return false;
    }

    return !!this.getFieldError(field);
  }

  getFieldError(field: keyof SignupForm): string | null {
    if (field === 'email' && this.emailServerError()) {
      return this.emailServerError();
    }

    switch (field) {
      case 'name':
        if (!this.form.name.trim()) return 'Full name is required.';
        if (this.form.name.trim().length < 2) return 'Name must be at least 2 characters.';
        return null;
      case 'email':
        if (!this.form.email.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) return 'Enter a valid email address.';
        return null;
      case 'wing':
        if (!this.form.wing) return 'Please select your wing.';
        return null;
      case 'flatNo':
        if (this.form.flatNo === null || this.form.flatNo === undefined) return 'Flat number is required.';
        if (this.form.flatNo < 1 || this.form.flatNo > 9999) return 'Enter a valid flat number.';
        return null;
      case 'password':
        if (!this.form.password) return 'Password is required.';
        if (this.form.password.length < 6) return 'Password must be at least 6 characters.';
        return null;
      case 'confirmPassword':
        if (!this.form.confirmPassword) return 'Please confirm your password.';
        if (this.form.confirmPassword !== this.form.password) return 'Passwords do not match.';
        return null;
      default:
        return null;
    }
  }

  isStep1Valid(): boolean {
    return !this.getFieldError('name')
      && !this.getFieldError('email')
      && !this.getFieldError('wing')
      && !this.getFieldError('flatNo');
  }

  isStep2Valid(): boolean {
    return !this.getFieldError('password')
      && !this.getFieldError('confirmPassword')
      && this.acceptTerms;
  }

  goToStep(step: FormStep): void {
    if (step === 2) {
      this.touched['name'] = true;
      this.touched['email'] = true;
      this.touched['wing'] = true;
      this.touched['flatNo'] = true;

      if (!this.isStep1Valid()) return;
    }

    this.currentStep.set(step);
    this.errorMessage.set('');
    this.emailServerError.set('');
  }

  nextStep(): void {
    this.goToStep(2);
  }

  prevStep(): void {
    this.currentStep.set(1);
    this.errorMessage.set('');
    this.emailServerError.set('');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.emailServerError.set('');
    this.touched = {
      name: true,
      email: true,
      wing: true,
      flatNo: true,
      password: true,
      confirmPassword: true
    };

    if (!this.isStep1Valid() || !this.isStep2Valid()) {
      if (!this.isStep1Valid()) {
        this.currentStep.set(1);
      }
      this.errorMessage.set('Please fix the highlighted fields before submitting.');
      return;
    }

    this.loader.message.set('Creating your account...');
    this.loader.subtitle.set('Please wait while we submit your registration.');

    const payload: RegisterRequest = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      wing: this.form.wing,
      flatNo: Number(this.form.flatNo),
      password: this.form.password
    };

    this.residentService.register(payload).subscribe({
      next: () => {
        this.isSuccess.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.handleRegistrationError(error);
      }
    });
  }

  private handleRegistrationError(error: HttpErrorResponse): void {
    const apiMessage = this.extractApiMessage(error);
    const isDuplicateEmail =
      error.status === 409 ||
      apiMessage.toLowerCase().includes('email already exist');

    if (isDuplicateEmail) {
      const duplicateMessage = 'Email already exists. Please try with another email.';
      this.emailServerError.set(duplicateMessage);
      this.errorMessage.set(duplicateMessage);
      this.currentStep.set(1);
      this.touched['email'] = true;
      return;
    }

    if (error.status === 0) {
      this.errorMessage.set('Cannot connect to server. Please check your network.');
      return;
    }

    if (apiMessage) {
      this.errorMessage.set(apiMessage);
      return;
    }

    this.errorMessage.set('Registration failed. Please try again later.');
  }

  private extractApiMessage(error: HttpErrorResponse): string {
    const body = error.error;

    if (typeof body === 'string') {
      const trimmed = body.trim();

      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed) as Record<string, unknown>;
          if (typeof parsed['message'] === 'string') {
            return parsed['message'];
          }
        } catch {
          return trimmed;
        }
      }

      return trimmed;
    }

    if (body && typeof body === 'object') {
      const record = body as Record<string, unknown>;
      if (typeof record['message'] === 'string') {
        return record['message'];
      }
      if (typeof record['title'] === 'string') {
        return record['title'];
      }
    }

    return '';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
