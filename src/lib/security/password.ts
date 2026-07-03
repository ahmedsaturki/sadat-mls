import "server-only";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export class PasswordService {
  static async hash(password: string): Promise<string> {
    // Enforce max length to prevent bcrypt DoS (bcrypt silently truncates at 72 bytes)
    const safePassword = password.slice(0, MAX_PASSWORD_LENGTH);
    return bcrypt.hash(safePassword, SALT_ROUNDS);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    // Enforce max length to match hash behavior
    const safePassword = password.slice(0, MAX_PASSWORD_LENGTH);
    return bcrypt.compare(safePassword, hash);
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!password || typeof password !== "string") {
      errors.push("Password is required");
      return { isValid: false, errors };
    }
    
    if (password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }
    
    if (password.length > MAX_PASSWORD_LENGTH) {
      errors.push(`Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`);
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    if (!hasUppercase) {
      errors.push("Password must contain at least one uppercase letter");
    }
    
    const hasLowercase = /[a-z]/.test(password);
    if (!hasLowercase) {
      errors.push("Password must contain at least one lowercase letter");
    }
    
    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
      errors.push("Password must contain at least one number");
    }
    
    // Fixed regex: properly escape special characters
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|`~]/.test(password);
    if (!hasSpecialChar) {
      errors.push("Password must contain at least one special character");
    }
    
    const commonPasswords = [
      "password", "123456", "password123", "admin", "qwerty", "12345678",
      "letmein", "welcome", "monkey", "dragon", "master", "login",
      "abc123", "password1", "sunshine", "trustno1", "iloveyou", "batman"
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("Password is too common");
    }
    
    return { isValid: errors.length === 0, errors };
  }
}
