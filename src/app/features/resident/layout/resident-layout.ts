import { Component, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BrandLogo } from '../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { AuthService } from '../../../core/services/auth.service';
import { createShellNav } from '../../../core/utils/shell-nav.util';

@Component({
  selector: 'app-resident-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, ThemeToggle],
  templateUrl: './resident-layout.html',
  styleUrl: './resident-layout.css'
})
export class ResidentLayout {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly shell = createShellNav();

  readonly residentName = this.authService.getUserName();

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/resident/dashboard' },
    { label: 'Visitors', icon: 'visitors', route: '/resident/visitors' },
    { label: 'Maintenance', icon: 'maintenance', route: '/resident/maintenance' },
    { label: 'Space Booking', icon: 'bookings', route: '/resident/bookings' },
    { label: 'Community Chat', icon: 'community', route: '/resident/community' },
    { label: 'Service Requests', icon: 'services', route: '/resident/service-requests' },
    { label: 'Notifications', icon: 'notifications', route: '/resident/notifications' },
    { label: 'Profile', icon: 'profile', route: '/resident/profile' }
  ];

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.shell.closeNav();
    });
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.shell.closeNav();
  }
}
