import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SocietySummary {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
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

export interface PmAccountSpcDtlItem {
  Name: string;
  Designation: string;
  Contact: string;
}

export type PmAccountSpcDtl = PmAccountSpcDtlItem[] | PmAccountSpcDtlItem;

export interface PmAccount {
  id?: number;
  socName: string;
  code?: string;
  email: string;
  phone: string;
  isActive: boolean;
  spcDtl?: PmAccountSpcDtlItem[] | PmAccountSpcDtlItem | any;
  createdDate?: string;
  createdBy?: string | number | null;
  modifiedDate?: string;
  modifiedBy?: string | number | null;
}

export interface PmAccountCreatePayload {
  socName: string;
  email: string;
  phone: string;
  isActive: boolean;
  spcDtl: PmAccountSpcDtlItem[];
}

export interface CreateSocietyAdminRequest {
  userName: string;
  email: string;
  password: string;
}

export interface CreatePmAdminAccountPayload {
  societyID: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
}

export interface PmAdminAccountItem {
  id?: number;
  societyID?: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  isActive?: boolean;
}

export interface CreateFloorPayload {
  societyId?: number;
  wingId: number;
  name: string;
  floorNumber: number;
}

export interface CreateFlatPayload {
  societyId?: number;
  wingId: number;
  floorId: number;
  code: string;
  typeName?: string;
}

@Injectable({ providedIn: 'root' })
export class SocietyConfigurationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/padmin`;
  private readonly pmAccountUrl = `${environment.apiUrl}/PmAccount`;

  currentSocietyId: number | null = null;

  buildPmAccountPayload(input: {
    socName: string;
    email: string;
    phone: string;
    spcs: { name: string; designation: string; contact: string }[];
  }): PmAccountCreatePayload {
    const spcDtl: PmAccountSpcDtlItem[] = (input.spcs || []).map((s) => ({
      Name: s.name ? s.name.trim() : '',
      Designation: s.designation ? s.designation.trim() : '',
      Contact: s.contact ? s.contact.trim() : ''
    }));

    return {
      socName: input.socName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      isActive: true,
      spcDtl
    };
  }

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
    return this.http.get<PmAccount[]>(this.pmAccountUrl, { params }).pipe(
      // Map the PmAccount DTO to the page's existing SocietySummary shape.
      // The UI still expects a name, code, email, phone, and status contract.
      map((accounts) =>
        (accounts || []).map((account: any) => ({
          id: account.id ?? account.ID ?? 0,
          code: account.code ?? account.Code ?? '',
          name: account.socName ?? account.name ?? account.Name ?? '',
          email: account.email ?? account.Email,
          phone: account.phone ?? account.Phone,
          location: undefined,
          wingCount: 0,
          floorCount: 0,
          flatCount: 0,
          isConfigured: account.isActive ?? account.IsActive ?? true
        }))
      )
    );
  }

  getSociety(id: number): Observable<SocietySummary> {
    return this.http.get<PmAccount>(`${this.pmAccountUrl}/${id}`).pipe(
      map((account: any) => ({
        id: account.id ?? account.ID ?? id,
        code: account.code ?? account.Code ?? '',
        name: account.socName ?? account.name ?? account.Name ?? '',
        email: account.email ?? account.Email,
        phone: account.phone ?? account.Phone,
        location: undefined,
        wingCount: 0,
        floorCount: 0,
        flatCount: 0,
        isConfigured: account.isActive ?? account.IsActive ?? true
      }))
    );
  }

  getAll(): Observable<PmAccount[]> {
    return this.http.get<PmAccount[]>(this.pmAccountUrl);
  }

  getById(id: number): Observable<PmAccount> {
    return this.http.get<PmAccount>(`${this.pmAccountUrl}/${id}`);
  }

  create(payload: PmAccountCreatePayload): Observable<PmAccount> {
    return this.http.post<PmAccount>(this.pmAccountUrl, payload);
  }

  createSociety(payload: PmAccountCreatePayload): Observable<PmAccount> {
    return this.create(payload);
  }

  update(id: number, payload: PmAccountCreatePayload): Observable<PmAccount> {
    return this.http.put<PmAccount>(`${this.pmAccountUrl}/${id}`, payload);
  }

  updateSociety(id: number, payload: PmAccountCreatePayload): Observable<PmAccount> {
    return this.update(id, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.pmAccountUrl}/${id}`);
  }

  deleteSociety(id: number): Observable<{ message: string }> {
    return this.delete(id);
  }

  getStructure(societyId: number): Observable<SocietyStructure> {
    return this.http.get<SocietyStructure>(`${this.baseUrl}/societies/${societyId}/structure`);
  }

  addMapping(societyId: number, payload: { wingId: number; floorId: number; flatId: number }): Observable<FlatItem> {
    return this.http.post<FlatItem>(`${this.baseUrl}/societies/${societyId}/mappings`, payload);
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

  private readonly pmAdminAccountUrl = `${environment.apiUrl}/PmAdminAccount`;

  createPmAdminAccount(payload: CreatePmAdminAccountPayload): Observable<any> {
    return this.http.post<any>(this.pmAdminAccountUrl, payload);
  }

  getPmAdminAccounts(societyId: number): Observable<PmAdminAccountItem[]> {
    const params = new HttpParams().set('societyID', String(societyId));
    return this.http.get<PmAdminAccountItem[]>(this.pmAdminAccountUrl, { params });
  }

  createFloor(payload: CreateFloorPayload): Observable<FloorItem> {
    return this.http.post<FloorItem>(`${this.baseUrl}/masters/floors`, payload);
  }

  createFlat(payload: CreateFlatPayload): Observable<FlatItem> {
    return this.http.post<FlatItem>(`${this.baseUrl}/masters/flats`, payload);
  }
}
