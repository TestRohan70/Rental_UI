import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BrandLogo } from '../../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../../shared/components/theme-toggle/theme-toggle';
import { LoaderService } from '../../../../core/services/loader.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models/login-response.model';
import { AppRoles } from '../../../../core/constants/app-roles.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, BrandLogo, ThemeToggle],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  readonly loader = inject(LoaderService);

  showPassword = false;
  rememberMe = false;
  errorMessage = signal('');

  loginModel: LoginRequest = {
    userName: '',
    password: ''
  };

  readonly particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 55,           // left 55% of screen only (left panel)
    dur: 6 + Math.random() * 8,
    delay: Math.random() * 6,
    size: Math.random() * 4 + 2,
    opacity: Math.random() * 0.35 + 0.1
  }));

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    this.errorMessage.set('');

    if (!this.loginModel.userName || !this.loginModel.password) {
      this.errorMessage.set('Please enter your username and password.');
      return;
    }

    this.loader.message.set('Signing in...');
    this.loader.subtitle.set('Please wait while we verify your credentials.');

    this.authService.login(this.loginModel).subscribe({
      next: (response) => {
        try {
          this.authService.saveSession(response);
        } catch {
          this.errorMessage.set('Sign-in succeeded but the session could not be saved. Please try again.');
          this.loader.hide();
          return;
        }

        if (!this.authService.isAuthenticated()) {
          this.errorMessage.set('Sign-in succeeded but no auth token was saved. Please clear cache and try again.');
          this.loader.hide();
          return;
        }

        this.loader.hide();

        if (this.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        const normalizedRole = response.role ? response.role.trim().toUpperCase() : '';

        if (normalizedRole === AppRoles.SocietyAdmin) {
          sessionStorage.setItem('showPendingPopup', 'true');
        }

        this.authService.redirectAfterLogin(response);
      },

      error: (error) => {
        this.loader.hide();

        if (error.status === 401) {
          this.errorMessage.set(
            error.error?.message || error.error?.Message || 'Invalid username or password. Please try again.'
          );
        } else if (error.status === 0) {
          this.errorMessage.set('Cannot connect to server. Please check your network.');
        } else {
          this.errorMessage.set(
            error.error?.message || error.error?.Message || 'An unexpected error occurred. Please try again later.'
          );
        }
      }
    });
  }
}
