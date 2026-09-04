import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-resident-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resident-notifications.html',
  styleUrl: './resident-notifications.css'
})
export class ResidentNotifications implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.notificationService.loadNotifications().subscribe();
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }

    if (notification.title.toLowerCase().includes('visitor')) {
      this.router.navigate(['/resident/visitors']);
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }
}
