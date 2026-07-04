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
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role);
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
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  isResident(): boolean {
    return this.getRole() === 'Resident';
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
    if (response.role === 'Admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (response.role === 'Resident') {
      if (response.profileRole === 'Security') {
        this.router.navigate(['/security/gate']);
        return;
      }

      this.router.navigate(['/resident/dashboard']);
      return;
    }

    this.router.navigate(['/login']);
  }

  redirectByRole(): void {
    const role = this.getRole();

    if (!this.isAuthenticated() || !role) {
      this.router.navigate(['/login']);
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
      role: response.role ?? response.Role ?? '',
      userId: response.userId ?? response.UserId ?? 0,
      userName: response.userName ?? response.UserName ?? '',
      profileRole: response.profileRole ?? response.ProfileRole,
      wing: response.wing ?? response.Wing,
      flatNo: response.flatNo ?? response.FlatNo
    };
  }
}
