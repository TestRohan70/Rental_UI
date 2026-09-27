import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WingItem {
  id: number;
  societyID?: number;
  societyId?: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateWingRequest {
  societyID: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface UpdateWingRequest {
  societyID?: number;
  code: string;
  name: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class WingConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/padmin/wings`;

  getWings(societyId?: number | string | null, search?: string, isActive?: boolean): Observable<WingItem[]> {
    let params = new HttpParams();
    let actualSocietyId: number | null = null;
    let actualSearch = search;
    let actualIsActive = isActive;

    if (typeof societyId === 'string' && isNaN(Number(societyId))) {
      // Overload check if called previously with (search, isActive)
      actualSearch = societyId;
      if (typeof search === 'boolean') {
        actualIsActive = search;
      }
    } else if (societyId !== undefined && societyId !== null) {
      const num = Number(societyId);
      if (!isNaN(num) && num > 0) {
        actualSocietyId = num;
      }
    }

    if (actualSocietyId !== null) {
      params = params.set('societyId', String(actualSocietyId));
    }
    if (actualSearch?.trim()) {
      params = params.set('search', actualSearch.trim());
    }
    if (actualIsActive !== undefined) {
      params = params.set('isActive', String(actualIsActive));
    }
    return this.http.get<WingItem[]>(this.baseUrl, { params });
  }

  getWing(id: number): Observable<WingItem> {
    return this.http.get<WingItem>(`${this.baseUrl}/${id}`);
  }

  createWing(payload: CreateWingRequest): Observable<WingItem> {
    return this.http.post<WingItem>(this.baseUrl, payload);
  }

  updateWing(id: number, payload: UpdateWingRequest): Observable<WingItem> {
    return this.http.put<WingItem>(`${this.baseUrl}/${id}`, payload);
  }

  deleteWing(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}

