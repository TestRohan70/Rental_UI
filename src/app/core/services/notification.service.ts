import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: number;
  userId: number;
  residentId?: number;
  title: string;
  message: string;
  isRead: boolean;
  createdDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal<number>(0);

  loadNotifications(): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${environment.apiUrl}/Notification`).pipe(
      tap((data) => {
        this.notifications.set(data);
        this.unreadCount.set(data.filter((n) => !n.isRead).length);
      })
    );
  }

  loadUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${environment.apiUrl}/Notification/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.unreadCount))
    );
  }

  markAsRead(id: number): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/Notification/${id}/read`, {}).pipe(
      tap(() => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        this.unreadCount.update((c) => Math.max(0, c - 1));
      })
    );
  }

  markAllAsRead(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${environment.apiUrl}/Notification/read-all`, {}).pipe(
      tap(() => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      })
    );
  }
}
