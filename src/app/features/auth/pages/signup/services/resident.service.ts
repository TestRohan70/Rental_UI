import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface SocietyLookupResponse {
  societyId: number;
  code: string;
  name: string;
}

export interface WingItem {
  id: number;
  code: string;
  name: string;
}

export interface FlatConfigItem {
  societyWingFlatConfigId: number;
  flatId: number;
  flatCode: string;
  floorId: number;
  floorName: string;
  wingId: number;
  wingName: string;
}

export interface SelfRegisterRequest {
  name: string;
  email: string;
  password: string;
  societyWingFlatConfigId: number;
  ownershipType: 'Owner' | 'Tenant';
}

@Injectable({
  providedIn: 'root'
})
export class ResidentService {
  private readonly http = inject(HttpClient);

  lookupSociety(code: string): Observable<SocietyLookupResponse> {
    return this.http.get<SocietyLookupResponse>(
      `${environment.apiUrl}/public/societies/lookup?code=${encodeURIComponent(code)}`
    );
  }

  getWings(societyId: number): Observable<WingItem[]> {
    return this.http.get<WingItem[]>(
      `${environment.apiUrl}/public/societies/${societyId}/wings`
    );
  }

  getFlats(societyId: number, wingId: number): Observable<FlatConfigItem[]> {
    return this.http.get<FlatConfigItem[]>(
      `${environment.apiUrl}/public/societies/${societyId}/wings/${wingId}/flats`
    );
  }

  selfRegister(data: SelfRegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/public/resident/signup`,
      data
    );
  }
}
