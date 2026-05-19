export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  birthDate?: string;
  gender?: string;
  height?: number;
  weight?: number;
  country?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
