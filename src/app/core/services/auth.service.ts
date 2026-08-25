import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/login-response.model';
import { AppRoles } from '../constants/app-roles.constants';

type RawLoginResponse = LoginResponse & {
  Token?: string;
  UserId?: number;
  UserName?: string;
  Email?: string;
  RoleId?: number;
  Role?: string;
  SocietyId?: number;
  ResidentId?: number;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<RawLoginResponse>(`${environment.apiUrl}/Auth/login`, data)
      .pipe(map((response) => this.normalizeResponse(response)));
  }

  saveSession(response: LoginResponse): void {
    const token = (response.token ?? '').trim();
    if (!token) {
      throw new Error('Login response did not include a token.');
    }

    const role = this.normalizeRole(response.role);
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', String(response.userId));
    localStorage.setItem('userName', response.userName ?? '');

    if (response.roleId != null) {
      localStorage.setItem('roleId', String(response.roleId));
    } else {
      localStorage.removeItem('roleId');
    }

    if (response.societyId != null) {
      localStorage.setItem('societyId', String(response.societyId));
    } else {
      localStorage.removeItem('societyId');
    }

    if (response.residentId != null) {
      localStorage.setItem('residentId', String(response.residentId));
    } else {
      localStorage.removeItem('residentId');
    }
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('roleId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('societyId');
    localStorage.removeItem('residentId');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('showPendingPopup');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getRoleId(): number | null {
    const value = localStorage.getItem('roleId');
    return value ? Number(value) : null;
  }

  getUserId(): number | null {
    const value = localStorage.getItem('userId');
    return value ? Number(value) : null;
  }

  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  getSocietyId(): number | null {
    const value = localStorage.getItem('societyId');
    return value ? Number(value) : null;
  }

  getResidentId(): number | null {
    const value = localStorage.getItem('residentId');
    return value ? Number(value) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && token.trim().length > 0;
  }

  isSuperAdmin(): boolean {
    return this.getEffectiveRole() === AppRoles.SuperAdmin;
  }

  isSocietyAdmin(): boolean {
    return this.getEffectiveRole() === AppRoles.SocietyAdmin;
  }

  isResident(): boolean {
    return this.getEffectiveRole() === AppRoles.Resident;
  }

  isSecurity(): boolean {
    return this.getEffectiveRole() === AppRoles.Security;
  }

  redirectAfterLogin(response: Pick<LoginResponse, 'role'>): void {
    const role = this.normalizeRole(response.role);

    if (role === AppRoles.SuperAdmin) {
      void this.router.navigateByUrl('/padmin/society-configuration', { replaceUrl: true });
      return;
    }

    if (role === AppRoles.SocietyAdmin) {
      void this.router.navigateByUrl('/admin/dashboard', { replaceUrl: true });
      return;
    }

    if (role === AppRoles.Resident) {
      void this.router.navigateByUrl('/resident/dashboard', { replaceUrl: true });
      return;
    }

    if (role === AppRoles.Security) {
      void this.router.navigateByUrl('/security/gate', { replaceUrl: true });
      return;
    }

    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  redirectByRole(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    const role = this.getEffectiveRole();
    if (!role) {
      void this.router.navigateByUrl('/login', { replaceUrl: true });
      return;
    }

    this.redirectAfterLogin({ role });
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private normalizeResponse(response: RawLoginResponse): LoginResponse {
    return {
      token: response.token ?? response.Token ?? '',
      role: this.normalizeRole(response.role ?? response.Role ?? ''),
      roleId: response.roleId ?? response.RoleId,
      userId: response.userId ?? response.UserId ?? 0,
      userName: response.userName ?? response.UserName ?? '',
      email: response.email ?? response.Email,
      societyId: response.societyId ?? response.SocietyId,
      residentId: response.residentId ?? response.ResidentId
    };
  }

  /** Session role from login response is authoritative; JWT is fallback for restored sessions. */
  private getEffectiveRole(): string {
    const fromStorage = this.getRole();
    if (fromStorage) {
      return this.normalizeRole(fromStorage);
    }

    const fromToken = this.getRoleFromToken();
    return this.normalizeRole(fromToken ?? '');
  }

  private getRoleFromToken(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return null;
      }

      const payload = JSON.parse(atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')));
      const raw =
        payload.role ??
        payload.Role ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      if (typeof raw === 'string') {
        return raw;
      }

      if (Array.isArray(raw) && raw.length > 0) {
        return typeof raw[0] === 'string' ? raw[0] : null;
      }

      return null;
    } catch {
      return null;
    }
  }

  private normalizeRole(role: string | null | undefined): string {
    if (!role) {
      return '';
    }

    return role.trim().toUpperCase();
  }
}
