import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/login-response.model';

type RawLoginResponse = LoginResponse & {
  Token?: string;
  Role?: string;
  ProfileRole?: string;
  UserId?: number;
  UserName?: string;
  Wing?: string;
  FlatNo?: number;
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
    localStorage.setItem('userName', response.userName);

    if (response.profileRole) {
      localStorage.setItem('profileRole', response.profileRole);
    } else {
      localStorage.removeItem('profileRole');
    }

    if (response.wing) {
      localStorage.setItem('wing', response.wing);
    } else {
      localStorage.removeItem('wing');
    }

    if (response.flatNo != null && response.flatNo > 0) {
      localStorage.setItem('flatNo', String(response.flatNo));
    } else {
      localStorage.removeItem('flatNo');
    }
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('profileRole');
    localStorage.removeItem('wing');
    localStorage.removeItem('flatNo');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('showPendingPopup');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  getProfileRole(): string | null {
    return localStorage.getItem('profileRole');
  }

  getUserId(): number | null {
    const value = localStorage.getItem('userId');
    return value ? Number(value) : null;
  }

  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  getWing(): string | null {
    return localStorage.getItem('wing');
  }

  getFlatNo(): number | null {
    const value = localStorage.getItem('flatNo');
    return value ? Number(value) : null;
  }

  getUnitLabel(): string | null {
    const wing = this.getWing();
    const flatNo = this.getFlatNo();

    if (!wing || !flatNo) {
      return null;
    }

    return `Wing ${wing} · Flat ${flatNo}`;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && token.trim().length > 0;
  }

  isAdmin(): boolean {
    return this.getEffectiveRole() === 'Admin';
  }

  isPAdmin(): boolean {
    return this.getEffectiveRole() === 'pAdmin';
  }

  isResident(): boolean {
    return this.getEffectiveRole() === 'Resident';
  }

  isSecurityStaff(): boolean {
    return this.isResident() && this.getProfileRole() === 'Security';
  }

  isTenantOrOwner(): boolean {
    if (!this.isResident()) {
      return false;
    }

    const profileRole = this.getProfileRole();
    if (profileRole === 'Security') {
      return false;
    }

    if (profileRole === 'Tenant' || profileRole === 'Owner') {
      return true;
    }

    // Older sessions may not have profileRole; treat as tenant/owner unless security.
    return !profileRole;
  }

  redirectAfterLogin(response: Pick<LoginResponse, 'role' | 'profileRole'>): void {
    const role = this.normalizeRole(response.role);

    if (role === 'pAdmin') {
      void this.router.navigateByUrl('/padmin/society-configuration', { replaceUrl: true });
      return;
    }

    if (role === 'Admin') {
      void this.router.navigateByUrl('/admin/dashboard', { replaceUrl: true });
      return;
    }

    if (role === 'Resident') {
      if (response.profileRole === 'Security') {
        void this.router.navigateByUrl('/security/gate', { replaceUrl: true });
        return;
      }

      void this.router.navigateByUrl('/resident/dashboard', { replaceUrl: true });
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

    this.redirectAfterLogin({
      role,
      profileRole: this.getProfileRole() ?? undefined
    });
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private normalizeResponse(response: RawLoginResponse): LoginResponse {
    return {
      token: response.token ?? response.Token ?? '',
      role: this.normalizeRole(response.role ?? response.Role ?? ''),
      userId: response.userId ?? response.UserId ?? 0,
      userName: response.userName ?? response.UserName ?? '',
      profileRole: response.profileRole ?? response.ProfileRole,
      wing: response.wing ?? response.Wing,
      flatNo: response.flatNo ?? response.FlatNo
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

    const trimmed = role.trim();

    if (trimmed.toLowerCase() === 'padmin') {
      return 'pAdmin';
    }

    if (trimmed.toLowerCase() === 'admin') {
      return 'Admin';
    }

    if (trimmed.toLowerCase() === 'resident') {
      return 'Resident';
    }

    return trimmed;
  }
}
