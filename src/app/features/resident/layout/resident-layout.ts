import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BrandLogo } from '../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { AuthService } from '../../../core/services/auth.service';
import { PendingVisitorApprovalService } from '../../../core/services/pending-visitor-approval.service';
import { LoaderService } from '../../../core/services/loader.service';
import { createShellNav } from '../../../core/utils/shell-nav.util';
import { getVisitorPhotoUrl } from '../../../core/utils/visitor-photo.util';

@Component({
  selector: 'app-resident-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, ThemeToggle],
  templateUrl: './resident-layout.html',
  styleUrl: './resident-layout.css'
})
export class ResidentLayout implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly pendingVisitorService = inject(PendingVisitorApprovalService);
  readonly loader = inject(LoaderService);
  readonly shell = createShellNav();

  readonly residentName = this.authService.getUserName();
  readonly getVisitorPhotoUrl = getVisitorPhotoUrl;
  private pollTimer: any = null;

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

  ngOnInit(): void {
    this.checkPendingVisitors(true);

    // Real-time polling so unplanned visitor requests trigger the popup instantly
    // this.pollTimer = setInterval(() => {
    //   this.checkPendingVisitors(false);
    // }, 4000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  checkPendingVisitors(initialLoad: boolean): void {
    const prevCount = this.pendingVisitorService.pendingCount();
    this.pendingVisitorService.loadPendingVisitors().subscribe(() => {
      const newCount = this.pendingVisitorService.pendingCount();
      if (newCount > 0 && (initialLoad || newCount > prevCount)) {
        this.pendingVisitorService.openApprovalPopup();
      }
    });
  }

  openNotifications(): void {
    if (this.pendingVisitorService.pendingCount() > 0) {
      this.pendingVisitorService.openApprovalPopup();
    } else {
      this.router.navigate(['/resident/notifications']);
    }
  }

  closePopup(): void {
    this.pendingVisitorService.closeApprovalPopup();
  }

  approveVisitor(id: number): void {
    this.pendingVisitorService.approveVisitor(id).subscribe();
  }

  rejectVisitor(id: number): void {
    this.pendingVisitorService.rejectVisitor(id).subscribe();
  }

  goToVisitorsPage(): void {
    this.closePopup();
    this.router.navigate(['/resident/visitors']);
  }

  logout(): void {
    this.authService.logout();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.shell.closeNav();
  }
}
