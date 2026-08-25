export interface LoginResponse {
  token: string;
  userId: number;
  userName: string;
  email?: string;
  roleId?: number;
  role: string;
  societyId?: number;
  residentId?: number;
}

export interface LoginRequest {
  userName: string;
  password: string;
}
