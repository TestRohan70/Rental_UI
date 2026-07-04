import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-resident-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './resident-dashboard.html',
  styleUrl: './resident-dashboard.css'
})
export class ResidentDashboard {
  private readonly authService = inject(AuthService);

  readonly residentName = this.authService.getUserName() ?? 'Resident';

  currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}
