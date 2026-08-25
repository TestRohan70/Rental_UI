import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { residentGuard } from './core/guards/resident.guard';
import { securityGuard } from './core/guards/security.guard';
import { tenantOwnerGuard } from './core/guards/tenant-owner.guard';
import { guestGuard } from './core/guards/guest.guard';
import { padminGuard } from './core/guards/padmin.guard';

const placeholder = (title: string, description: string) => ({
  loadComponent: () =>
    import('./shared/components/page-placeholder/page-placeholder').then(m => m.PagePlaceholder),
  data: { title, description }
});

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login').then(m => m.Login)
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/signup/signup').then(m => m.Signup)
  },
  {
    path: 'dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/layout/layout').then(m => m.Layout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'register-security',
        loadComponent: () =>
          import('./features/admin/register-security/admin-register-security').then(m => m.AdminRegisterSecurity)
      },
      {
        path: 'residents',
        ...placeholder('Residents', 'Manage society residents, approvals, and member records.')
      },
      {
        path: 'visitors',
        ...placeholder('Visitors', 'Track visitor entries, approvals, and gate logs.')
      },
      {
        path: 'maintenance',
        ...placeholder('Maintenance', 'Monitor maintenance requests and payment status.')
      },
      {
        path: 'parking-master',
        ...placeholder('Parking Master', 'Configure parking slots and allocation rules.')
      },
      {
        path: 'reports',
        ...placeholder('Reports', 'View analytics and society performance reports.')
      },
      {
        path: 'settings',
        ...placeholder('Settings', 'Configure system preferences and admin controls.')
      }
    ]
  },
  {
    path: 'resident',
    canActivate: [authGuard, residentGuard],
    loadComponent: () =>
      import('./features/resident/layout/resident-layout').then(m => m.ResidentLayout),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/resident/dashboard/resident-dashboard').then(m => m.ResidentDashboard)
      },
      {
        path: 'visitors',
        canActivate: [tenantOwnerGuard],
        loadComponent: () =>
          import('./features/resident/visitors/resident-visitors').then(m => m.ResidentVisitors)
      },
      {
        path: 'maintenance',
        ...placeholder('Maintenance', 'View current dues, payment history, and download receipts.')
      },
      {
        path: 'bookings',
        ...placeholder('Space Booking', 'Book clubhouse, terrace, and parking spaces.')
      },
      {
        path: 'community',
        ...placeholder('Community', 'Join group chats and community discussions.')
      },
      {
        path: 'service-requests',
        ...placeholder('Service Requests', 'Request housekeeping, watchman, and valet services.')
      },
      {
        path: 'notifications',
        ...placeholder('Notifications', 'System alerts, visitor updates, and maintenance reminders.')
      },
      {
        path: 'profile',
        ...placeholder('Profile', 'View and update your resident profile details.')
      }
    ]
  },
  {
    path: 'padmin',
    canActivate: [authGuard, padminGuard],
    loadComponent: () =>
      import('./features/padmin/layout/padmin-layout').then(m => m.PadminLayout),
    children: [
      {
        path: '',
        redirectTo: 'society-configuration',
        pathMatch: 'full'
      },
      {
        path: 'society-configuration',
        loadComponent: () =>
          import('./features/padmin/society-configuration/society-configuration').then(m => m.SocietyConfiguration)
      },
      {
        path: 'society-configuration/:societyId/add-admin',
        loadComponent: () =>
          import('./features/padmin/add-society-admin/add-society-admin').then(m => m.AddSocietyAdmin)
      }
    ]
  },
  {
    path: 'security',
    canActivate: [authGuard, securityGuard],
    loadComponent: () =>
      import('./features/security/layout/security-layout').then(m => m.SecurityLayout),
    children: [
      {
        path: '',
        redirectTo: 'gate',
        pathMatch: 'full'
      },
      {
        path: 'gate',
        loadComponent: () =>
          import('./features/security/gate/security-gate').then(m => m.SecurityGate)
      },
      {
        path: 'generate-alert',
        loadComponent: () =>
          import('./features/security/generate-alert/generate-alert').then(m => m.GenerateAlert)
      }
    ]
  },
  {
    path: '**',
    loadComponent: () =>
      import('./core/pages/role-redirect/role-redirect').then(m => m.RoleRedirect)
  }
];
