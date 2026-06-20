import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LoginRequest } from './login/login-request';
import { BrandLogo } from '../../../../shared/components/brand-logo/brand-logo';
import { LoaderService } from '../../../../core/services/loader.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, BrandLogo],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly loader = inject(LoaderService);

  showPassword = false;
  rememberMe = false;
  errorMessage = signal('');

  loginModel: LoginRequest = {
    userName: '',
    password: ''
  };

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

    this.authService.adminLogin(this.loginModel).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);

        if (this.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        sessionStorage.setItem('showPendingPopup', 'true');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        if (error.status === 401) {
          this.errorMessage.set('Invalid username or password. Please try again.');
        } else if (error.status === 0) {
          this.errorMessage.set('Cannot connect to server. Please check your network.');
        } else {
          this.errorMessage.set('An unexpected error occurred. Please try again later.');
        }
      }
    });
  }
}
