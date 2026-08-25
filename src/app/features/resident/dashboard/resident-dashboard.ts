import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { VisitorRequest } from '../../../core/models/visitor.model';

@Component({
  selector: 'app-resident-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './resident-dashboard.html',
  styleUrl: './resident-dashboard.css'
})
export class ResidentDashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly visitorService = inject(VisitorService);

  readonly residentName = this.authService.getUserName() ?? 'Resident';
  readonly unitLabel: string | null = null;

  readonly requests = signal<VisitorRequest[]>([]);
  readonly loadError = signal(false);

  readonly pendingApprovals = computed(() =>
    this.requests().filter((item) => item.status?.toLowerCase() === 'pending')
  );

  readonly activeVisitors = computed(() =>
    this.requests().filter((item) => {
      const status = item.status?.toLowerCase();
      return status === 'approved' || status === 'acknowledged';
    })
  );

  readonly pendingCount = computed(() => this.pendingApprovals().length);
  readonly activeCount = computed(() => this.activeVisitors().length);

  currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  ngOnInit(): void {
    this.loadVisitorStats();
  }

  loadVisitorStats(): void {
    const residentId = this.authService.getResidentId() ?? this.authService.getUserId();
    if (!residentId) {
      return;
    }

    this.loadError.set(false);
    this.visitorService.getResidentRequests(residentId).subscribe({
      next: (data) => this.requests.set(data),
      error: () => this.loadError.set(true)
    });
  }

  displayCount(value: number): string {
    return String(value);
  }
}
