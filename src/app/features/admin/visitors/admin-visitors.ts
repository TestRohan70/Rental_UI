import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitorService } from '../../../core/services/visitor.service';
import { VisitorRequest } from '../../../core/models/visitor.model';
import { getVisitorPhotoUrl } from '../../../core/utils/visitor-photo.util';

@Component({
  selector: 'app-admin-visitors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-visitors.html',
  styleUrl: './admin-visitors.css'
})
export class AdminVisitors implements OnInit {
  private readonly visitorService = inject(VisitorService);

  readonly historyRequests = signal<VisitorRequest[]>([]);
  readonly insideVisitors = signal<VisitorRequest[]>([]);
  readonly errorMessage = signal('');
  readonly activeTab = signal<'history' | 'inside'>('history');

  readonly getVisitorPhotoUrl = getVisitorPhotoUrl;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.errorMessage.set('');
    this.visitorService.getSocietyHistory().subscribe({
      next: (data) => this.historyRequests.set(data),
      error: () => this.errorMessage.set('Unable to load society visitor logs.')
    });

    this.visitorService.getCurrentlyInside().subscribe({
      next: (data) => this.insideVisitors.set(data),
      error: () => this.errorMessage.set('Unable to load active visitors.')
    });
  }

  statusClass(statusCode?: string): string {
    switch (statusCode?.toUpperCase()) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'CHECKED_IN': return 'status-checkedin';
      case 'CHECKED_OUT': return 'status-checkedout';
      case 'CANCELLED': return 'status-cancelled';
      case 'EXPIRED': return 'status-expired';
      default: return 'status-default';
    }
  }
}
