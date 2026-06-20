import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { AdminService } from './admin.service';
import { Resident } from '../models/resident.model';

export type ResidentAction = 'approve' | 'reject';

@Injectable({
  providedIn: 'root'
})
export class PendingResidentsService {
  private readonly adminService = inject(AdminService);

  readonly pendingResidents = signal<Resident[]>([]);
  readonly pendingCount = computed(() => this.pendingResidents().length);
  readonly showApprovalPopup = signal(false);
  readonly isLoading = signal(false);
  readonly processingId = signal<number | null>(null);
  readonly processingAction = signal<ResidentAction | null>(null);

  loadPendingResidents() {
    this.isLoading.set(true);

    return this.adminService.getPendingResidents().pipe(
      tap({
        next: (residents) => {
          this.pendingResidents.set(residents);
          this.isLoading.set(false);
        },
        error: () => {
          this.pendingResidents.set([]);
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

  isProcessing(id: number, action?: ResidentAction): boolean {
    if (this.processingId() !== id) {
      return false;
    }

    return action ? this.processingAction() === action : this.processingAction() !== null;
  }

  approveResident(id: number) {
    return this.processResident(id, 'approve', () => this.adminService.approveResident(id));
  }

  rejectResident(id: number) {
    return this.processResident(id, 'reject', () => this.adminService.rejectResident(id));
  }

  private processResident(
    id: number,
    action: ResidentAction,
    request: () => ReturnType<AdminService['approveResident']>
  ) {
    this.processingId.set(id);
    this.processingAction.set(action);

    return request().pipe(
      tap({
        next: () => {
          this.pendingResidents.update((residents) =>
            residents.filter((resident) => resident.id !== id)
          );
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
