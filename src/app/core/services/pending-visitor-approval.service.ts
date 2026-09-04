import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { VisitorService } from './visitor.service';
import { VisitorRequest } from '../models/visitor.model';
import { LoaderService } from './loader.service';

export type VisitorAction = 'approve' | 'reject';

@Injectable({
  providedIn: 'root'
})
export class PendingVisitorApprovalService {
  private readonly visitorService = inject(VisitorService);
  private readonly loader = inject(LoaderService);

  readonly pendingRequests = signal<VisitorRequest[]>([]);
  readonly pendingCount = computed(() => this.pendingRequests().length);
  readonly showApprovalPopup = signal(false);
  readonly isLoading = signal(false);
  readonly processingId = signal<number | null>(null);
  readonly processingAction = signal<VisitorAction | null>(null);

  loadPendingVisitors() {
    this.isLoading.set(true);

    return this.visitorService.getResidentRequests().pipe(
      tap({
        next: (requests) => {
          const pending = requests.filter(
            (r) => r.statusCode === 'PENDING' || r.statusName?.toLowerCase() === 'pending'
          );
          this.pendingRequests.set(pending);
          this.isLoading.set(false);
        },
        error: () => {
          this.pendingRequests.set([]);
          this.isLoading.set(false);
        }
      })
    );
  }

  openApprovalPopup(): void {
    this.showApprovalPopup.set(true);
  }

  closeApprovalPopup(): void {
    this.showApprovalPopup.set(false);
  }

  isProcessing(id: number, action?: VisitorAction): boolean {
    if (this.processingId() !== id) {
      return false;
    }
    return action ? this.processingAction() === action : this.processingAction() !== null;
  }

  approveVisitor(id: number) {
    this.processingId.set(id);
    this.processingAction.set('approve');
    this.loader.message.set('Approving visitor...');
    this.loader.subtitle.set('Updating gate request status.');

    return this.visitorService.approve(id).pipe(
      tap({
        next: () => {
          this.pendingRequests.update((list) => list.filter((item) => item.id !== id));
          this.processingId.set(null);
          this.processingAction.set(null);
          if (this.pendingCount() === 0) {
            this.closeApprovalPopup();
          }
        },
        error: () => {
          this.processingId.set(null);
          this.processingAction.set(null);
        }
      })
    );
  }

  rejectVisitor(id: number) {
    this.processingId.set(id);
    this.processingAction.set('reject');
    this.loader.message.set('Rejecting visitor...');
    this.loader.subtitle.set('Updating gate request status.');

    return this.visitorService.reject(id).pipe(
      tap({
        next: () => {
          this.pendingRequests.update((list) => list.filter((item) => item.id !== id));
          this.processingId.set(null);
          this.processingAction.set(null);
          if (this.pendingCount() === 0) {
            this.closeApprovalPopup();
          }
        },
        error: () => {
          this.processingId.set(null);
          this.processingAction.set(null);
        }
      })
    );
  }
}
