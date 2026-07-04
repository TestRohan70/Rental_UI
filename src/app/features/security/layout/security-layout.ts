import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BrandLogo } from '../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-security-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, ThemeToggle],
  templateUrl: './security-layout.html',
  styleUrl: './security-layout.css'
})
export class SecurityLayout {
  readonly authService = inject(AuthService);

  readonly securityName = this.authService.getUserName();
}
