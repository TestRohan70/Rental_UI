import { Component, OnInit, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { PendingResidentsService } from '../../core/services/pending-residents.service';
import { BrandLogo } from '../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../shared/components/theme-toggle/theme-toggle';
import { LoaderService } from '../../core/services/loader.service';
import { createShellNav } from '../../core/utils/shell-nav.util';
import { getResidentLocationLabel, getResidentRoleClass, getResidentRoleLabel, getResidentUnitLabel } from '../../core/utils/resident-display.util';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, ThemeToggle],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly pendingService = inject(PendingResidentsService);
  readonly loader = inject(LoaderService);
  readonly shell = createShellNav();

  readonly adminName = this.authService.getUserName();
  readonly getResidentLocationLabel = getResidentLocationLabel;
  readonly getResidentRoleLabel = getResidentRoleLabel;
  readonly getResidentRoleClass = getResidentRoleClass;
  readonly getResidentUnitLabel = getResidentUnitLabel;

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Register Security', icon: 'security-staff', route: '/admin/register-security' },
    { label: 'Residents', icon: 'residents', route: '/admin/residents' },
    { label: 'Visitors', icon: 'visitors', route: '/admin/visitors' },
    { label: 'Maintenance', icon: 'maintenance', route: '/admin/maintenance' },
    { label: 'Parking Master', icon: 'parking', route: '/admin/parking-master' },
    { label: 'Reports', icon: 'reports', route: '/admin/reports' },
    { label: 'Settings', icon: 'settings', route: '/admin/settings' }
  ];

  ngOnInit(): void {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.shell.closeNav();
    });

    this.loader.message.set('Loading...');
    this.loader.subtitle.set('Please wait while we prepare your admin dashboard.');

    this.pendingService.loadPendingResidents().subscribe(() => {
      const shouldShowPopup = sessionStorage.getItem('showPendingPopup') === 'true';

      if (shouldShowPopup && this.pendingService.pendingCount() > 0) {
        this.pendingService.openApprovalPopup();
        sessionStorage.removeItem('showPendingPopup');
      }
    });
  }

  openNotifications(): void {
    if (this.pendingService.pendingCount() > 0) {
      this.pendingService.openApprovalPopup();
    }
  }

  closePopup(): void {
    this.pendingService.closeApprovalPopup();
  }

  approveResident(id: number): void {
    this.loader.message.set('Approving resident...');
    this.loader.subtitle.set('Please wait while we update the registration status.');
    this.pendingService.approveResident(id).subscribe();
  }

  rejectResident(id: number): void {
    this.loader.message.set('Rejecting resident...');
    this.loader.subtitle.set('Please wait while we update the registration status.');
    this.pendingService.rejectResident(id).subscribe();
  }

  logout(): void {
    this.pendingService.pendingResidents.set([]);
    this.authService.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.shell.closeNav();
  }
}
