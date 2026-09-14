import type {
  CreatePrayerRequestInput,
  PrayerRequestFeedQuery,
  ManagePrayerRequestInput,
  CreateReportInput,
  PublicPrayerRequestItem,
  PaginatedResponse,
  PrayerActionResult,
  AuthSessionResponse,
  RefreshTokenResponse,
  ApiErrorResponse,
} from '@maboiteapriere/shared';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken?: () => Promise<string | null> | string | null;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.getAccessToken = config.getAccessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    if (this.getAccessToken) {
      const token = await this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    if (!response.ok) {
      let errorBody: ApiErrorResponse | null = null;
      try {
        errorBody = (await response.json()) as ApiErrorResponse;
      } catch {
        // Ignorer si pas du JSON
      }

      throw new ApiError(
        response.status,
        errorBody?.error || `Erreur serveur (${response.status})`,
        errorBody?.code,
        errorBody?.details
      );
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }

  // --- Health ---
  async health(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/v1/health');
  }

  // --- Public Feed & Prayers ---
  async getPublicFeed(query?: PrayerRequestFeedQuery): Promise<PaginatedResponse<PublicPrayerRequestItem>> {
    const params = new URLSearchParams();
    if (query?.cursor) params.append('cursor', query.cursor);
    if (query?.category) params.append('category', query.category);
    if (query?.sort) params.append('sort', query.sort);
    if (query?.limit) params.append('limit', String(query.limit));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/v1/prayer-requests${queryString}`);
  }

  async createPrayerRequest(
    input: CreatePrayerRequestInput
  ): Promise<{ id: string; publicSlug: string; manageToken: string }> {
    return this.request('/api/v1/prayer-requests', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async pray(slug: string, visitorId: string): Promise<PrayerActionResult> {
    return this.request(`/api/v1/prayer-requests/${slug}/prayers`, {
      method: 'POST',
      body: JSON.stringify({ visitorId }),
    });
  }

  async report(slug: string, input: CreateReportInput): Promise<void> {
    return this.request(`/api/v1/prayer-requests/${slug}/reports`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // --- Mes Sujets (Gestion locale) ---
  async manageMyRequest(
    id: string,
    manageToken: string,
    input: ManagePrayerRequestInput
  ): Promise<{ success: boolean; message: string }> {
    return this.request(
      `/api/v1/my-requests/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      {
        'X-Manage-Token': manageToken,
      }
    );
  }

  async updateMyPushToken(id: string, manageToken: string, pushToken: string): Promise<void> {
    return this.request(
      `/api/v1/prayer-requests/${id}/push-token`,
      {
        method: 'PATCH',
        body: JSON.stringify({ expoPushToken: pushToken }),
      },
      {
        'X-Manage-Token': manageToken,
      }
    );
  }

  // --- Admin Auth ---
  async adminLogin(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/v1/auth/mobile/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async adminExchange(magicLinkToken: string, deviceLabel?: string): Promise<AuthSessionResponse> {
    return this.request('/api/v1/auth/mobile/exchange', {
      method: 'POST',
      body: JSON.stringify({ magicLinkToken, deviceLabel }),
    });
  }

  async adminRefresh(refreshToken: string): Promise<RefreshTokenResponse> {
    return this.request('/api/v1/auth/mobile/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }
}
