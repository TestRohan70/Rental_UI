import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { BrandLogo } from '../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { createShellNav } from '../../../core/utils/shell-nav.util';

@Component({
  selector: 'app-padmin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, ThemeToggle],
  templateUrl: './padmin-layout.html',
  styleUrl: './padmin-layout.css'
})
export class PadminLayout {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly shell = createShellNav();

  readonly userName = this.authService.getUserName() ?? 'User';
  readonly userInitial = this.userName.charAt(0).toUpperCase();

  navItems = [
    { label: 'Society Configuration', icon: 'society', route: '/padmin/society-configuration' },
    { label: 'Wing Configuration', icon: 'wing', route: '/padmin/wing-configuration' }
  ];

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.shell.closeNav();
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.shell.closeNav();
  }
}
