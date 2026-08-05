import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type SocietyAlertType = 'Emergency' | 'General' | 'Maintenance';

export interface SocietyAlert {
  id: number;
  title: string;
  message: string;
  alertType: SocietyAlertType;
  createdBySecurityId: number;
  createdDate?: string;
  createdBySecurity?: {
    name?: string;
  };
}

export interface CreateSocietyAlertRequest {
  title: string;
  message: string;
  alertType: SocietyAlertType;
}

@Injectable({ providedIn: 'root' })
export class SocietyAlertService {
  private readonly http = inject(HttpClient);

  getAlerts(createdById: number): Observable<SocietyAlert[]> {
    return this.http.get<SocietyAlert[]>(`${environment.apiUrl}/Security/alerts`, {
      params: { createdById: createdById.toString() }
    });
  }

  createAlert(createdById: number, payload: CreateSocietyAlertRequest): Observable<SocietyAlert> {
    return this.http.post<SocietyAlert>(`${environment.apiUrl}/Security/alerts`, payload, {
      params: { createdById: createdById.toString() }
    });
  }
}
