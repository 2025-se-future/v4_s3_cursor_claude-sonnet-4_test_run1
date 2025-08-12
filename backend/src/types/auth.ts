// Authentication type definitions
// Authentication-related TypeScript type definitions and interfaces

export interface AuthToken {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface GoogleTokenPayload {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified?: boolean;
}

export interface LoginCredentials {
  googleToken: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    name: string;
    profilePicture: string;
  };
  token?: string;
  error?: string;
}

export interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  profilePicture: string;
  createdAt: Date;
  updatedAt: Date;
}
