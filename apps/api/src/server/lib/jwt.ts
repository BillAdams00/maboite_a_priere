import { SignJWT, jwtVerify } from 'jose';
import { env } from '../env.js';

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

export async function createAccessToken(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      role: payload.role as AdminJwtPayload['role'],
    };
  } catch {
    return null;
  }
}
