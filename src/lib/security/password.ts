import "server-only";
import bcrypt from "bcryptjs";
import { getPasswordRuleErrors, DEFAULT_PASSWORD_RULES } from "./password-rules";

const SALT_ROUNDS = 12;

export class PasswordService {
  static async hash(password: string): Promise<string> {
    // Enforce max length to prevent bcrypt DoS (bcrypt silently truncates at 72 bytes)
    const safePassword = password.slice(0, DEFAULT_PASSWORD_RULES.maxLength);
    return bcrypt.hash(safePassword, SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    // Enforce max length to match hash behavior
    const safePassword = password.slice(0, DEFAULT_PASSWORD_RULES.maxLength);
    return bcrypt.compare(safePassword, hash);
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors = getPasswordRuleErrors(password, DEFAULT_PASSWORD_RULES);
    return { isValid: errors.length === 0, errors };
  }
}
