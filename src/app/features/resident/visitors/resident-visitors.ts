import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { LoaderService } from '../../../core/services/loader.service';
import { PlannedVisitorResponse, VisitorRequest } from '../../../core/models/visitor.model';
import { getVisitorPhotoUrl } from '../../../core/utils/visitor-photo.util';

@Component({
  selector: 'app-resident-visitors',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  readonly activeTab = signal<'planned' | 'pending' | 'history'>('planned');
  readonly createdPass = signal<PlannedVisitorResponse | null>(null);

  // Planned form state
  plannedForm = {
    visitorName: '',
    visitorPhone: '',
    purpose: '',
    expectedArrivalDateTime: ''
  };

  readonly pendingRequests = computed(() =>
    this.requests().filter((item) => item.statusCode === 'PENDING' || item.statusName === 'Pending')
  );

  readonly historyRequests = computed(() =>
    this.requests().filter((item) => item.statusCode !== 'PENDING' && item.statusName !== 'Pending')
  );

  readonly getVisitorPhotoUrl = getVisitorPhotoUrl;

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.errorMessage.set('');
    this.visitorService.getResidentRequests().subscribe({
      next: (data) => this.requests.set(data),
      error: () => this.errorMessage.set('Unable to load visitor requests.')
    });
  }

  createPlannedPass(): void {
    if (!this.plannedForm.visitorName.trim()) {
      this.errorMessage.set('Visitor name is required.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loader.message.set('Creating planned visitor pass...');
    this.loader.subtitle.set('Generating server-side OTP...');

    const payload = {
      visitorName: this.plannedForm.visitorName.trim(),
      visitorPhone: this.plannedForm.visitorPhone.trim() || undefined,
      purpose: this.plannedForm.purpose.trim() || undefined,
      expectedArrivalDateTime: this.plannedForm.expectedArrivalDateTime ? new Date(this.plannedForm.expectedArrivalDateTime).toISOString() : undefined
    };

    this.visitorService.createPlannedVisitor(payload).subscribe({
      next: (res) => {
        this.createdPass.set(res);
        this.successMessage.set('Visitor pass generated! Share the 6-digit OTP with your visitor.');
        this.resetPlannedForm();
        this.loadRequests();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to create planned visitor pass.';
        this.errorMessage.set(msg);
      }
    });
  }

  resetPlannedForm(): void {
    this.plannedForm = {
      visitorName: '',
      visitorPhone: '',
      purpose: '',
      expectedArrivalDateTime: ''
    };
  }

  closePassModal(): void {
    this.createdPass.set(null);
  }

  approve(request: VisitorRequest): void {
    this.processRequest(request.id, 'approve');
  }

  reject(request: VisitorRequest): void {
    this.processRequest(request.id, 'reject');
  }

  cancel(request: VisitorRequest): void {
    if (!confirm(`Are you sure you want to cancel the visitor pass for ${request.visitorName}?`)) {
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.loader.message.set('Cancelling visitor pass...');

    this.visitorService.cancel(request.id).subscribe({
      next: () => {
        this.successMessage.set('Visitor pass cancelled successfully.');
        this.loadRequests();
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Unable to cancel visitor request.';
        this.errorMessage.set(msg);
      }
    });
  }

  private processRequest(requestId: number, action: 'approve' | 'reject'): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.loader.message.set(action === 'approve' ? 'Approving visitor...' : 'Rejecting visitor...');
    this.loader.subtitle.set('Updating gate request status.');

    const request$ = action === 'approve'
      ? this.visitorService.approve(requestId)
      : this.visitorService.reject(requestId);

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
