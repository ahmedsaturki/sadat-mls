interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  officeId?: string;
  exp?: number;
  iat?: number;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
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
