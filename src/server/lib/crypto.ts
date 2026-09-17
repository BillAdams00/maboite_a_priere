import crypto from 'node:crypto';
import { env } from '../env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits pour GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(): Buffer {
  return crypto.createHash('sha256').update(env.APP_SECRET).digest();
}

/**
 * Chiffre une chaîne de texte avec AES-256-GCM.
 * Retourne le contenu chiffré en hexadécimal et l'IV + tag auth concaténés.
 */
export function encryptText(plaintext: string): { ciphertext: string; iv: string } {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  // On concatène iv (12 bytes) + tag (16 bytes) en hexadécimal
  const ivAndTag = Buffer.concat([iv, tag]).toString('hex');

  return {
    ciphertext: encrypted,
    iv: ivAndTag,
  };
}

/**
 * Déchiffre une chaîne chiffrée avec AES-256-GCM.
 */
export function decryptText(ciphertext: string, ivAndTagHex: string): string {
  const key = getKey();
  const ivAndTag = Buffer.from(ivAndTagHex, 'hex');

  const iv = ivAndTag.subarray(0, IV_LENGTH);
  const tag = ivAndTag.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hachage anonymisé d'une adresse IP avec le PEPPER validé.
 * Ne conserve jamais l'adresse IP en clair ni de fallback codé en dur.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return crypto.createHash('sha256').update(`${ip}:${env.PEPPER}`).digest('hex');
}

/**
 * Hache un jeton sensible (ex: manageToken) avant stockage en base de données.
 * Empêche toute fuite en cas de compromission de la base.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(`${token}:${env.PEPPER}`).digest('hex');
}

/**
 * Génère un jeton cryptographique aléatoire sécurisé (URL-safe).
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Compare deux chaînes de manière constante en temps pour éviter les attaques temporelles.
 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Crée un jeton d'action rapide signé (ex: retrait express en 1 clic par e-mail).
 */
export function signExpressToken(requestId: string, action: string, expiresInHours = 48): string {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload = `${requestId}:${action}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', env.APP_SECRET).update(payload).digest('hex');
  return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64url');
}

/**
 * Vérifie un jeton d'action rapide signé.
 */
export function verifyExpressToken(token: string): { valid: boolean; requestId?: string; action?: string } {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const { payload, hmac } = JSON.parse(raw);
    const expectedHmac = crypto.createHmac('sha256', env.APP_SECRET).update(payload).digest('hex');
    if (!safeEqual(hmac, expectedHmac)) return { valid: false };

    const [requestId, action, expiresAtStr] = payload.split(':');
    const expiresAt = Number(expiresAtStr);
    if (Date.now() > expiresAt) return { valid: false };

    return { valid: true, requestId, action };
  } catch {
    return { valid: false };
  }
}
