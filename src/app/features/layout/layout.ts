import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  private readonly router = inject(Router);

  navItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Residents', icon: 'residents', route: '/residents' },
    { label: 'Rentals', icon: 'rentals', route: '/rentals' },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    this.router.navigate(['/login']);
  }
}
