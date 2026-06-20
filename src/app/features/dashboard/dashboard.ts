import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PendingResidentsService } from '../../core/services/pending-residents.service';
import { LoaderService } from '../../core/services/loader.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  readonly pendingService = inject(PendingResidentsService);
  readonly loader = inject(LoaderService);

  currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  openApprovalPopup(): void {
    if (this.pendingService.pendingCount() > 0) {
      this.pendingService.openApprovalPopup();
    }
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
}
