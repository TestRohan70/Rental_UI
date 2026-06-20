import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { RegisterRequest } from '../signup/register-request';
import { RegisterResponse } from '../signup/register-response';

@Injectable({
  providedIn: 'root'
})
export class ResidentService {
  private readonly http = inject(HttpClient);

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${environment.apiUrl}/Resident`, data);
  }
}
