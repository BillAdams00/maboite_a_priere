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

export interface MyPrayerRequestDetail {
  id: string;
  publicSlug: string;
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

export interface AdminPrayerRequestItem {
  id: string;
  publicSlug: string;
  firstName: string;
  lastName: string;
  displayAsAnonymous: boolean;
  content: string;
  contentIv?: string | null;
  category: string | null;
  visibility: Visibility;
  status: RequestStatus;
  prayerCount: number;
  viewCount: number;
  isAnswered: boolean;
  answeredAt: string | null;
  answeredNote: string | null;
  moderationNote: string | null;
  createdAt: string;
  reportsCount?: number;
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
