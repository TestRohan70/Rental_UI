import { Component, OnInit, OnDestroy, inject, HostListener, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BrandLogo } from '../../../shared/components/brand-logo/brand-logo';
import { ThemeToggle } from '../../../shared/components/theme-toggle/theme-toggle';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { createShellNav } from '../../../core/utils/shell-nav.util';

@Component({
  selector: 'app-security-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, BrandLogo, ThemeToggle],
  templateUrl: './security-layout.html',
  styleUrl: './security-layout.css'
})
export class SecurityLayout implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  readonly shell = createShellNav();

  readonly securityName = this.authService.getUserName();
  readonly showSecurityPopup = signal(false);
  readonly latestAlert = signal<AppNotification | null>(null);
  private pollTimer: any = null;

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.shell.closeNav();
    });
  }

  ngOnInit(): void {
    this.checkNotifications(true);

    // this.pollTimer = setInterval(() => {
    //   this.checkNotifications(false);
    // }, 4000);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  checkNotifications(initialLoad: boolean): void {
    const prevCount = this.notificationService.unreadCount();
    this.notificationService.loadNotifications().subscribe((list) => {
      const newUnread = list.filter((n) => !n.isRead);
      if (newUnread.length > 0) {
        const latest = newUnread[0];
        if (initialLoad || newUnread.length > prevCount) {
          this.latestAlert.set(latest);
          this.showSecurityPopup.set(true);
        }
      }
    });
  }

  openNotifications(): void {
    const unread = this.notificationService.notifications().filter((n) => !n.isRead);
    if (unread.length > 0) {
      this.latestAlert.set(unread[0]);
      this.showSecurityPopup.set(true);
    }
  }

  closePopup(): void {
    const alert = this.latestAlert();
    if (alert) {
      this.notificationService.markAsRead(alert.id).subscribe();
    }
    this.showSecurityPopup.set(false);
  }

  goToGate(): void {
    this.closePopup();
    this.router.navigate(['/security/gate']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.shell.closeNav();
  }
}
