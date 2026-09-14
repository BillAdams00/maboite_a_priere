import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-jwt-key-minimum-32-chars-ok!'
);

export interface AdminJwtPayload {
  adminId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';
}

export async function createAccessToken(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      adminId: payload.adminId as string,
      email: payload.email as string,
      role: payload.role as AdminJwtPayload['role'],
    };
  } catch {
    return null;
  }
}
