
export type AuthView = 'login' | 'register';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthError {
  message: string;
}

export enum BridgeStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CONNECTING = 'connecting'
}
