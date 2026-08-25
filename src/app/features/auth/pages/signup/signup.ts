import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ResidentService,
  SocietyLookupResponse,
  WingItem,
  FlatConfigItem,
  SelfRegisterRequest
} from './services/resident.service';
import { BrandLogo } from '../../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../../shared/components/theme-toggle/theme-toggle';
import { LoaderService } from '../../../../core/services/loader.service';

type FormStep = 1 | 2 | 3;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, BrandLogo, ThemeToggle],
  templateUrl: './signup.html',
  styleUrls: ['../../styles/auth-theme.css', './signup.css']
})
export class Signup implements OnInit {
  private readonly residentService = inject(ResidentService);
  private readonly router = inject(Router);
  readonly loader = inject(LoaderService);

  readonly currentStep = signal<FormStep>(1);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal('');
  readonly emailServerError = signal('');

  // Step 1 State: Society Code Lookup
  societyCode = '';
  foundSociety = signal<SocietyLookupResponse | null>(null);

  // Step 2 State: Wing & Flat Selection
  wingsList = signal<WingItem[]>([]);
  flatsList = signal<FlatConfigItem[]>([]);

  selectedWingId: number | null = null;
  selectedConfigId: number | null = null;
  ownershipType: 'Owner' | 'Tenant' = 'Owner';

  // Step 3 State: User Details & Password
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  showPassword = false;
  showConfirmPassword = false;

  touched: Record<string, boolean> = {};

  ngOnInit(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }

  // --- Step 1 Actions ---
  onLookupSociety(): void {
    this.errorMessage.set('');
    this.touched['societyCode'] = true;

    const code = this.societyCode.trim();
    if (!code) {
      this.errorMessage.set('Please enter a Society Code.');
      return;
    }

    this.loader.show();
    this.residentService.lookupSociety(code).subscribe({
      next: (soc) => {
        this.foundSociety.set(soc);
        this.loader.hide();
        this.loadWings(soc.societyId);
      },
      error: (err: HttpErrorResponse) => {
        this.loader.hide();
        this.foundSociety.set(null);
        if (err.status === 404) {
          this.errorMessage.set('Invalid society code. Please verify and try again.');
        } else {
          this.errorMessage.set(err.error?.message || 'Unable to lookup society. Please try again.');
        }
      }
    });
  }

  loadWings(societyId: number): void {
    this.loader.show();
    this.residentService.getWings(societyId).subscribe({
      next: (wings) => {
        this.wingsList.set(wings);
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.errorMessage.set('Unable to load wings for this society.');
      }
    });
  }

  // --- Step 2 Actions ---
  onWingChange(): void {
    this.selectedConfigId = null;
    this.flatsList.set([]);

    const soc = this.foundSociety();
    if (!soc || !this.selectedWingId) {
      return;
    }

    this.loader.show();
    this.residentService.getFlats(soc.societyId, this.selectedWingId).subscribe({
      next: (flats) => {
        this.flatsList.set(flats);
        this.loader.hide();
      },
      error: () => {
        this.loader.hide();
        this.errorMessage.set('Unable to load flats for this wing.');
      }
    });
  }

  // --- Password Strength ---
  get passwordStrength(): 'weak' | 'medium' | 'strong' | null {
    const pwd = this.password;
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

  getFieldError(field: string): string | null {
    switch (field) {
      case 'societyCode':
        if (!this.societyCode.trim()) return 'Society Code is required.';
        return null;
      case 'selectedWingId':
        if (!this.selectedWingId) return 'Please select a wing.';
        return null;
      case 'selectedConfigId':
        if (!this.selectedConfigId) return 'Please select a flat.';
        return null;
      case 'name':
        if (!this.name.trim()) return 'Full name is required.';
        if (this.name.trim().length < 2) return 'Name must be at least 2 characters.';
        return null;
      case 'email':
        if (this.emailServerError()) return this.emailServerError();
        if (!this.email.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) return 'Enter a valid email address.';
        return null;
      case 'password':
        if (!this.password) return 'Password is required.';
        if (this.password.length < 6) return 'Password must be at least 6 characters.';
        return null;
      case 'confirmPassword':
        if (!this.confirmPassword) return 'Please confirm your password.';
        if (this.confirmPassword !== this.password) return 'Passwords do not match.';
        return null;
      default:
        return null;
    }
  }

  isFieldInvalid(field: string): boolean {
    if (field === 'email' && this.emailServerError()) {
      return true;
    }
    if (!this.touched[field]) {
      return false;
    }
    return !!this.getFieldError(field);
  }

  // --- Step Navigation ---
  goToStep(step: FormStep): void {
    this.errorMessage.set('');
    this.emailServerError.set('');

    if (step === 2) {
      if (!this.foundSociety()) {
        this.errorMessage.set('Please lookup and verify your Society Code first.');
        return;
      }
    }

    if (step === 3) {
      this.touched['selectedWingId'] = true;
      this.touched['selectedConfigId'] = true;

      if (!this.selectedWingId || !this.selectedConfigId) {
        this.errorMessage.set('Please select both a Wing and a Flat to continue.');
        return;
      }
    }

    this.currentStep.set(step);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  nextStep(): void {
    const current = this.currentStep();
    if (current === 1) {
      if (!this.foundSociety()) {
        this.onLookupSociety();
        return;
      }
      this.goToStep(2);
    } else if (current === 2) {
      this.goToStep(3);
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.goToStep((current - 1) as FormStep);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // --- Submit ---
  onSubmit(): void {
    this.errorMessage.set('');
    this.emailServerError.set('');

    this.touched = {
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      selectedWingId: true,
      selectedConfigId: true
    };

    if (!this.foundSociety() || !this.selectedConfigId) {
      this.errorMessage.set('Invalid society or flat selection.');
      return;
    }

    if (this.getFieldError('name') || this.getFieldError('email') ||
        this.getFieldError('password') || this.getFieldError('confirmPassword') || !this.acceptTerms) {
      this.errorMessage.set('Please complete all required fields and accept terms.');
      return;
    }

    this.loader.show();

    const payload: SelfRegisterRequest = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      societyWingFlatConfigId: this.selectedConfigId,
      ownershipType: this.ownershipType
    };

    this.residentService.selfRegister(payload).subscribe({
      next: () => {
        this.loader.hide();
        this.isSuccess.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.loader.hide();
        this.handleRegistrationError(error);
      }
    });
  }

  private handleRegistrationError(error: HttpErrorResponse): void {
    const apiMessage = error.error?.message || error.error || '';

    if (error.status === 409) {
      const msg = typeof apiMessage === 'string' && apiMessage ? apiMessage : 'Email or flat ownership conflict exists.';
      if (msg.toLowerCase().includes('email')) {
        this.emailServerError.set(msg);
        this.errorMessage.set(msg);
        this.currentStep.set(3);
        this.touched['email'] = true;
      } else {
        this.errorMessage.set(msg);
        this.currentStep.set(2);
      }
      return;
    }

    if (error.status === 0) {
      this.errorMessage.set('Cannot connect to server. Please check your network.');
      return;
    }

    if (typeof apiMessage === 'string' && apiMessage) {
      this.errorMessage.set(apiMessage);
      return;
    }

    this.errorMessage.set('Registration failed. Please try again later.');
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
