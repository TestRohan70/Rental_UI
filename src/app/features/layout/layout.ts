import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PendingResidentsService } from '../../core/services/pending-residents.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  private readonly router = inject(Router);
  readonly pendingService = inject(PendingResidentsService);
  readonly loader = inject(LoaderService);

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Residents', icon: 'residents', route: '/residents' },
    { label: 'Rentals', icon: 'rentals', route: '/rentals' },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  ngOnInit(): void {
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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('showPendingPopup');
    this.pendingService.pendingResidents.set([]);
    this.router.navigate(['/login']);
  }
}
