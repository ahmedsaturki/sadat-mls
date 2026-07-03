// Client-safe password rules (no "server-only", no bcrypt).
// Mirrors the rules in src/lib/security/password.ts PasswordService.validate().
// Useful for client components that cannot import server-only modules.

export interface PasswordRuleConfig {
  minLength: number;
  maxLength: number;
  blockedPasswords: string[];
}

export const DEFAULT_PASSWORD_RULES: PasswordRuleConfig = {
  minLength: 8,
  maxLength: 128,
  blockedPasswords: [
    "password", "123456", "password123", "admin", "qwerty", "12345678",
    "letmein", "welcome", "monkey", "dragon", "master", "login",
    "abc123", "password1", "sunshine", "trustno1", "iloveyou", "batman",
  ],
};

export function getPasswordRuleErrors(
  password: string,
  config: PasswordRuleConfig = DEFAULT_PASSWORD_RULES
): string[] {
  const errors: string[] = [];

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
    return errors;
  }

  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  if (password.length > config.maxLength) {
    errors.push(`Password cannot exceed ${config.maxLength} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=[\]{};:'",.<>?/\\|`~]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  const lower = password.toLowerCase();
  if (config.blockedPasswords.some(blocked => {
    const blockedLower = blocked.toLowerCase();
    return lower === blockedLower || lower.includes(blockedLower);
  })) {
    errors.push("Password is too common");
  }

  return errors;
}

export function getFirstPasswordError(password: string, config?: PasswordRuleConfig): string | null {
  const errors = getPasswordRuleErrors(password, config);
  return errors.length > 0 ? errors[0] : null;
}
