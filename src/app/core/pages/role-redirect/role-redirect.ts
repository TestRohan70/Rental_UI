import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-role-redirect',
  standalone: true,
  template: ''
})
export class RoleRedirect implements OnInit {
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.auth.redirectByRole();
  }
}
