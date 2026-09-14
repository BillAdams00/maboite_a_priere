import { ApiClient } from '@maboiteapriere/api-client';
import { getAdminTokens, clearAdminTokens } from './secure-store';
import { Platform } from 'react-native';

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Pour l'émulateur Android, localhost pointe vers 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }
  return 'http://localhost:3000';
}

export const api = new ApiClient({
  baseUrl: getApiBaseUrl(),
  getAccessToken: async () => {
    const { accessToken } = await getAdminTokens();
    return accessToken;
  },
  onUnauthorized: async () => {
    await clearAdminTokens();
  },
});
