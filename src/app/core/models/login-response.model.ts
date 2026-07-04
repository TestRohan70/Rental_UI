export interface LoginResponse {
  token: string;
  role: string;
  userId: number;
  userName: string;
  profileRole?: string;
  wing?: string;
  flatNo?: number;
}

export interface LoginRequest {
  userName: string;
  password: string;
}
