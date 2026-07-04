import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { LoaderService } from '../../../core/services/loader.service';
import { VisitorRequest } from '../../../core/models/visitor.model';
import { getVisitorPhotoUrl } from '../../../core/utils/visitor-photo.util';

@Component({
  selector: 'app-resident-visitors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resident-visitors.html',
  styleUrl: './resident-visitors.css'
})
export class ResidentVisitors implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly visitorService = inject(VisitorService);
  readonly loader = inject(LoaderService);

  readonly requests = signal<VisitorRequest[]>([]);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly pendingRequests = computed(() =>
    this.requests().filter((item) => item.status?.toLowerCase() === 'pending')
  );

  readonly historyRequests = computed(() =>
    this.requests().filter((item) => item.status?.toLowerCase() !== 'pending')
  );

  readonly getVisitorPhotoUrl = getVisitorPhotoUrl;
  readonly unitLabel = this.authService.getUnitLabel();

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    const residentId = this.authService.getUserId();
    if (!residentId) {
      return;
    }

    this.visitorService.getResidentRequests(residentId).subscribe({
      next: (data) => this.requests.set(data),
      error: () => this.errorMessage.set('Unable to load visitor requests.')
    });
  }

  approve(request: VisitorRequest): void {
    this.processRequest(request.id, 'approve');
  }

  reject(request: VisitorRequest): void {
    this.processRequest(request.id, 'reject');
  }

  private processRequest(requestId: number, action: 'approve' | 'reject'): void {
    const residentId = this.authService.getUserId();
    if (!residentId) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loader.message.set(action === 'approve' ? 'Approving visitor...' : 'Rejecting visitor...');
    this.loader.subtitle.set('Updating gate request status.');

    const request$ = action === 'approve'
      ? this.visitorService.approve(requestId, residentId)
      : this.visitorService.reject(requestId, residentId);

    request$.subscribe({
      next: () => {
        this.successMessage.set(
          action === 'approve'
            ? 'Visitor approved. Security will acknowledge entry at the gate.'
            : 'Visitor request rejected.'
        );
        this.loadRequests();
      },
      error: (error) => {
        const message = error?.error?.message ?? 'Unable to update visitor request.';
        this.errorMessage.set(message);
      }
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Acknowledged': return 'status-acknowledged';
      default: return '';
    }
  }
}
