export interface User {
  id: string;
  email: string;
  fullname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}
