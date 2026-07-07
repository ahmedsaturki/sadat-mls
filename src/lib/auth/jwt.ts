import "server-only";

/**
 * WARNING: This module decodes JWT payloads WITHOUT verifying the cryptographic
 * signature. It is intended only for reading trusted tokens issued by Supabase
 * Auth (which handles signature verification server-side). Do NOT use this to
 * validate untrusted tokens — always verify via Supabase's auth.getUser() first.
 */

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  officeId?: string;
  exp?: number;
  iat?: number;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export class JwtService {
  static decode(token: string): JwtPayload | null {
    try {
      const decoded = decodeJwtPayload(token);
      if (!decoded || !decoded.userId || !decoded.email || !decoded.role) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  static isValid(token: string): boolean {
    const payload = this.decode(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  }

  static getUserFromToken(token: string): JwtPayload | null {
    if (!this.isValid(token)) return null;
    return this.decode(token);
  }
}
