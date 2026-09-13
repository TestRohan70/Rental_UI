import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WingItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateWingRequest {
  code: string;
  name: string;
  isActive: boolean;
}

export interface UpdateWingRequest {
  code: string;
  name: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class WingConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/padmin/wings`;

  getWings(search?: string, isActive?: boolean): Observable<WingItem[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
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
