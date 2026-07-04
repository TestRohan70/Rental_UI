import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResidentLookup, VisitorRequest } from '../models/visitor.model';

@Injectable({
  providedIn: 'root'
})
export class VisitorService {
  private readonly http = inject(HttpClient);

  createRequest(formData: FormData): Observable<VisitorRequest> {
    return this.http.post<VisitorRequest>(`${environment.apiUrl}/Visitor`, formData);
  }

  getGateRequests(securityId: number): Observable<VisitorRequest[]> {
    return this.http.get<VisitorRequest[]>(`${environment.apiUrl}/Visitor/gate/${securityId}`);
  }

  getResidentRequests(residentId: number): Observable<VisitorRequest[]> {
    return this.http.get<VisitorRequest[]>(`${environment.apiUrl}/Visitor/resident/${residentId}`);
  }

  lookupResident(wing: string, flatNo: number): Observable<ResidentLookup> {
    return this.http.get<ResidentLookup>(`${environment.apiUrl}/Visitor/lookup`, {
      params: { wing, flatNo: flatNo.toString() }
    });
  }

  approve(requestId: number, residentId: number): Observable<VisitorRequest> {
    return this.http.put<VisitorRequest>(
      `${environment.apiUrl}/Visitor/${requestId}/approve`,
      null,
      { params: { residentId: residentId.toString() } }
    );
  }

  reject(requestId: number, residentId: number): Observable<VisitorRequest> {
    return this.http.put<VisitorRequest>(
      `${environment.apiUrl}/Visitor/${requestId}/reject`,
      null,
      { params: { residentId: residentId.toString() } }
    );
  }

  acknowledge(requestId: number, securityId: number): Observable<VisitorRequest> {
    return this.http.put<VisitorRequest>(
      `${environment.apiUrl}/Visitor/${requestId}/acknowledge`,
      null,
      { params: { securityId: securityId.toString() } }
    );
  }
}
