import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SocietySummary {
  id: number;
  code: string;
  name: string;
  location?: string;
  wingCount: number;
  floorCount: number;
  flatCount: number;
  isConfigured: boolean;
}

export interface SocietyStructure {
  society: SocietySummary;
  wings: SocietyWingNode[];
}

export interface SocietyWingNode {
  wing: WingItem;
  floors: SocietyFloorNode[];
}

export interface SocietyFloorNode {
  floor: FloorItem;
  flats: FlatItem[];
}

export interface WingItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  floorCount?: number;
  flatCount?: number;
}

export interface FloorItem {
  id: number;
  code: string;
  name: string;
  floorNumber: number;
  isActive: boolean;
  flatCount?: number;
}

export interface FlatItem {
  id: number;
  code: string;
  typeId?: number;
  typeName?: string;
  isActive: boolean;
}

export interface GenerateStructureRequest {
  wingIds: number[];
  floorIds: number[];
  flatIds: number[];
  previewOnly: boolean;
}

export interface GenerateStructurePreview {
  totalWings: number;
  totalFloors: number;
  totalFlats: number;
  totalMappings: number;
  skippedDuplicates: number;
  preview: SocietyWingNode[];
}

export interface CreateSocietyAdminRequest {
  userName: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class SocietyConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/padmin`;

  getMasterWings(): Observable<WingItem[]> {
    return this.http.get<WingItem[]>(`${this.baseUrl}/masters/wings`);
  }

  getMasterFloors(wingId?: number): Observable<FloorItem[]> {
    let params = new HttpParams();
    if (wingId) {
      params = params.set('wingId', wingId);
    }
    return this.http.get<FloorItem[]>(`${this.baseUrl}/masters/floors`, { params });
  }

  getMasterFlats(): Observable<FlatItem[]> {
    return this.http.get<FlatItem[]>(`${this.baseUrl}/masters/flats`);
  }

  getSocieties(search?: string): Observable<SocietySummary[]> {
    let params = new HttpParams();
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<SocietySummary[]>(`${this.baseUrl}/societies`, { params });
  }

  getSociety(id: number): Observable<SocietySummary> {
    return this.http.get<SocietySummary>(`${this.baseUrl}/societies/${id}`);
  }

  createSociety(payload: { name: string; location?: string }): Observable<SocietySummary> {
    return this.http.post<SocietySummary>(`${this.baseUrl}/societies`, payload);
  }

  updateSociety(id: number, payload: { name: string; location?: string }): Observable<SocietySummary> {
    return this.http.put<SocietySummary>(`${this.baseUrl}/societies/${id}`, payload);
  }

  deleteSociety(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/societies/${id}`);
  }

  getStructure(societyId: number): Observable<SocietyStructure> {
    return this.http.get<SocietyStructure>(`${this.baseUrl}/societies/${societyId}/structure`);
  }

  addMapping(societyId: number, payload: { wingId: number; floorId: number; flatId: number }): Observable<FlatItem> {
    return this.http.post<FlatItem>(`${this.baseUrl}/societies/${societyId}/mappings`, payload);
  }

  generateStructure(societyId: number, payload: GenerateStructureRequest): Observable<GenerateStructurePreview> {
    return this.http.post<GenerateStructurePreview>(`${this.baseUrl}/societies/${societyId}/generate-structure`, payload);
  }

  deactivateWing(societyId: number, wingId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/societies/${societyId}/wings/${wingId}`);
  }

  deactivateFloor(societyId: number, wingId: number, floorId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/societies/${societyId}/wings/${wingId}/floors/${floorId}`);
  }

  deactivateFlat(societyId: number, wingId: number, floorId: number, flatId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.baseUrl}/societies/${societyId}/wings/${wingId}/floors/${floorId}/flats/${flatId}`
    );
  }

  createSocietyAdmin(societyId: number, payload: CreateSocietyAdminRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/societies/${societyId}/admin`, payload);
  }
}
