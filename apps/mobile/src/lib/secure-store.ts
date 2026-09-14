import * as SecureStore from 'expo-secure-store';

const KEY_VISITOR_ID = 'maboiteapriere_visitor_id';
const KEY_MY_REQUESTS = 'maboiteapriere_my_requests';
const KEY_ADMIN_ACCESS_TOKEN = 'maboiteapriere_admin_access_token';
const KEY_ADMIN_REFRESH_TOKEN = 'maboiteapriere_admin_refresh_token';

export interface StoredRequestReference {
  id: string;
  manageToken: string;
  publicSlug: string;
  createdAt: string;
}

// Génération simple d'un identifiant pseudo-UUID v4 sans dépendance supplémentaire
function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Récupère le visitorId de l'appareil (créé une seule fois, équivalent du cookie web)
 */
export async function getOrCreateVisitorId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(KEY_VISITOR_ID);
    if (existing) return existing;

    const newId = generateUuid();
    await SecureStore.setItemAsync(KEY_VISITOR_ID, newId);
    return newId;
  } catch {
    // Fallback mémoire si indisponible
    return generateUuid();
  }
}

/**
 * Récupère la liste locale des sujets déposés depuis cet appareil (§5.6)
 */
export async function getMyRequests(): Promise<StoredRequestReference[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY_MY_REQUESTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Enregistre un nouveau sujet déposé dans la liste locale chiffrée
 */
export async function saveMyRequest(ref: StoredRequestReference): Promise<void> {
  const current = await getMyRequests();
  const exists = current.some(item => item.id === ref.id);
  if (!exists) {
    const updated = [ref, ...current];
    await SecureStore.setItemAsync(KEY_MY_REQUESTS, JSON.stringify(updated));
  }
}

/**
 * Retire un sujet de la liste locale (après suppression)
 */
export async function removeMyRequest(id: string): Promise<void> {
  const current = await getMyRequests();
  const updated = current.filter(item => item.id !== id);
  await SecureStore.setItemAsync(KEY_MY_REQUESTS, JSON.stringify(updated));
}

// --- Admin Tokens ---

export async function getAdminTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  try {
    const accessToken = await SecureStore.getItemAsync(KEY_ADMIN_ACCESS_TOKEN);
    const refreshToken = await SecureStore.getItemAsync(KEY_ADMIN_REFRESH_TOKEN);
    return { accessToken, refreshToken };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

export async function saveAdminTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_ADMIN_ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(KEY_ADMIN_REFRESH_TOKEN, refreshToken);
}

export async function clearAdminTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_ADMIN_ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(KEY_ADMIN_REFRESH_TOKEN);
}
