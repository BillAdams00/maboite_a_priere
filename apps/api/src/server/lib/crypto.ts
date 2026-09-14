import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(): Buffer {
  const secret = process.env.APP_SECRET || 'default-insecure-secret-key-32-chars-long!';
  return crypto.createHash('sha256').update(secret).digest();
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
 * Hachage anonymisé d'une adresse IP avec un pepper.
 * Ne conserve jamais l'adresse IP en clair.
 */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  const pepper = process.env.PEPPER || 'default-pepper-salt-key';
  return crypto.createHash('sha256').update(`${ip}:${pepper}`).digest('hex');
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
