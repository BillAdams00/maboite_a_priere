export type Visibility = 'PRIVATE' | 'PUBLIC';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
export type AdminStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

export interface PublicPrayerRequestItem {
  id: string;
  publicSlug: string;
  displayName: string;
  displayAsAnonymous: boolean;
  content: string;
  category: string | null;
  prayerCount: number;
  isAnswered: boolean;
  answeredAt: string | null;
  answeredNote: string | null;
  createdAt: string;
}

export interface MyPrayerRequestItem {
  id: string;
  publicSlug: string;
  manageToken: string;
  firstName: string;
  lastName: string;
  displayAsAnonymous: boolean;
  content: string;
  visibility: Visibility;
  status: RequestStatus;
  category: string | null;
  prayerCount: number;
  isAnswered: boolean;
  answeredAt: string | null;
  answeredNote: string | null;
  hasPendingAnsweredClaim?: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  totalCount?: number;
}

export interface PrayerActionResult {
  prayerCount: number;
  alreadyPrayed: boolean;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
