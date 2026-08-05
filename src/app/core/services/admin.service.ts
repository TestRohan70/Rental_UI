import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Resident } from '../models/resident.model';
import { normalizeResident } from '../utils/resident-display.util';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);

  getPendingResidents(): Observable<Resident[]> {
    return this.http.get<Resident[]>(`${environment.apiUrl}/Admin/pendingResidents`).pipe(
      map((residents) => residents.map((resident) => normalizeResident(resident)))
    );
  }

  approveResident(id: number): Observable<string> {
    return this.http.put(`${environment.apiUrl}/Admin/approve/${id}`, null, {
      responseType: 'text'
    });
  }

  rejectResident(id: number): Observable<string> {
    return this.http.put(`${environment.apiUrl}/Admin/reject/${id}`, null, {
      responseType: 'text'
    });
  }

  getGateStaff(adminId: number): Observable<Resident[]> {
    return this.http
      .get<Resident[]>(`${environment.apiUrl}/Admin/gate-staff`, {
        params: { adminId: adminId.toString() }
      })
      .pipe(map((residents) => residents.map((resident) => normalizeResident(resident))));
  }

  registerGateStaff(
    adminId: number,
    payload: { name: string; email: string; password: string }
  ): Observable<Resident> {
    return this.http
      .post<Resident>(`${environment.apiUrl}/Admin/gate-staff`, payload, {
        params: { adminId: adminId.toString() }
      })
      .pipe(map((resident) => normalizeResident(resident)));
  }
}
