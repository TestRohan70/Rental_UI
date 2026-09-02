import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreatePlannedVisitorRequest,
  Flat,
  Floor,
  PlannedVisitorResponse,
  ResidentLookup,
  VerifyOtpRequest,
  VisitorRequest,
  VisitorVisitResponse,
  Wing
} from '../models/visitor.model';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  private readonly http = inject(HttpClient);

  createPlannedVisitor(dto: CreatePlannedVisitorRequest): Observable<PlannedVisitorResponse> {
    return this.http.post<PlannedVisitorResponse>(`${environment.apiUrl}/Visitor/planned`, dto);
  }

  createUnplannedVisitor(formData: FormData): Observable<VisitorRequest> {
    return this.http.post<VisitorRequest>(`${environment.apiUrl}/Visitor/unplanned`, formData);
  }

  getResidentRequests(): Observable<VisitorRequest[]> {
    return this.http.get<VisitorRequest[]>(`${environment.apiUrl}/Visitor/resident`);
  }

  approve(requestId: number): Observable<VisitorRequest> {
    return this.http.post<VisitorRequest>(`${environment.apiUrl}/Visitor/${requestId}/approve`, {});
  }

  reject(requestId: number): Observable<VisitorRequest> {
    return this.http.post<VisitorRequest>(`${environment.apiUrl}/Visitor/${requestId}/reject`, {});
  }

  cancel(requestId: number): Observable<VisitorRequest> {
    return this.http.post<VisitorRequest>(`${environment.apiUrl}/Visitor/${requestId}/cancel`, {});
  }

  getGateRequests(): Observable<VisitorRequest[]> {
    return this.http.get<VisitorRequest[]>(`${environment.apiUrl}/Visitor/gate`);
  }

  verifyOtp(dto: VerifyOtpRequest): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${environment.apiUrl}/Visitor/verify-otp`, dto);
  }

  checkIn(requestId: number, gate?: string): Observable<VisitorVisitResponse> {
    return this.http.post<VisitorVisitResponse>(`${environment.apiUrl}/Visitor/${requestId}/check-in`, {
      visitorRequestId: requestId,
      gate: gate ?? 'Main Gate'
    });
  }

  checkOut(requestId: number): Observable<VisitorVisitResponse> {
    return this.http.post<VisitorVisitResponse>(`${environment.apiUrl}/Visitor/${requestId}/check-out`, {
      visitorRequestId: requestId
    });
  }

  getCurrentlyInside(): Observable<VisitorRequest[]> {
    return this.http.get<VisitorRequest[]>(`${environment.apiUrl}/Visitor/inside`);
  }

  getSocietyHistory(): Observable<VisitorRequest[]> {
    return this.http.get<VisitorRequest[]>(`${environment.apiUrl}/Visitor/society/history`);
  }

  getWings(): Observable<Wing[]> {
    return this.http.get<Wing[]>(`${environment.apiUrl}/Visitor/wings`);
  }

  getFloors(wingId: number): Observable<Floor[]> {
    return this.http.get<Floor[]>(`${environment.apiUrl}/Visitor/floors`, {
      params: { wingId: wingId.toString() }
    });
  }

  getFlats(wingId: number, floorId: number): Observable<Flat[]> {
    return this.http.get<Flat[]>(`${environment.apiUrl}/Visitor/flats`, {
      params: { wingId: wingId.toString(), floorId: floorId.toString() }
    });
  }

  lookupResidentByConfig(wingId: number, floorId: number, flatId: number): Observable<ResidentLookup> {
    return this.http.get<ResidentLookup>(`${environment.apiUrl}/Visitor/lookup`, {
      params: {
        wingId: wingId.toString(),
        floorId: floorId.toString(),
        flatId: flatId.toString()
      }
    });
  }

  lookupResident(wing: string, flatNo: number): Observable<ResidentLookup> {
    return this.http.get<ResidentLookup>(`${environment.apiUrl}/Visitor/lookup`, {
      params: { wing, flatNo: flatNo.toString() }
    });
  }
}
