/**
 * Enhanced security utilities for input validation and sanitization.
 */
import { z, ZodSchema } from "zod";
import { logger } from "@/lib/logger";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

export class SecurityValidator {
  private static readonly INPUT_LENGTH_LIMITS = {
    username: 50,
    password: 128,
    email: 254,
    name: 100,
    text: 1000,
    phone: 20,
    address: 500,
    notes: 2000,
    html: 1000,
  };

  /**
   * Validate input data against Zod schema with security checks
   * Performs length validation, SQL injection prevention, and sanitization
   */
  static validate<T>(
    schema: ZodSchema<T>,
    input: unknown,
    options?: { 
      strictLength?: boolean;
      sanitize?: boolean;
      fieldName?: string;
    }
  ): ValidationResult<T> {
    try {
      const validated = schema.parse(input);
      
      if (options?.sanitize) {
        const sanitized = this.sanitizeData(validated as Record<string, unknown>);
        return {
          success: true,
          data: sanitized as T,
        };
      }

      return {
        success: true,
        data: validated,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(issue.message);
        }
        logger.warn(`Validation errors for ${options?.fieldName || "input"}:`, errors);
        
        return {
          success: false,
          errors,
        };
      }

      logger.error(`Unexpected validation error for ${options?.fieldName || "input"}:`, { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        errors: {
          general: ["Invalid input format"],
        },
      };
    }
  }

  /**
   * Sanitize string input to prevent XSS and injection attacks
   */
  static sanitizeString(input: string, fieldType: "html" | "text" | "email" | "name" = "text"): string {
    if (!input || typeof input !== "string") return input;

    let sanitized = input.trim();

    switch (fieldType) {
      case "html":
        sanitized = sanitized
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+="[^\"]*"/gi, "")
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
          .replace(/<object[^>]*>.*?<\/object>/gi, "");
        break;
      case "email":
        sanitized = sanitized.toLowerCase();
        break;
      default:
        sanitized = sanitized.replace(/\s+/g, " ");
    }

    // Basic length validation
    const maxLength = this.INPUT_LENGTH_LIMITS[fieldType] || 1000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize object data recursively
   */
  private static sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data === "string") return this.sanitizeString(data);
    if (typeof data === "object") {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeData(item));
      }
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        result[key] = this.sanitizeData(value);
      }
      return result;
    }
    return data;
  }

  /**
   * Validate field length limits
   */
  static validateLength(fieldName: string, value: string, maxLength?: number): boolean {
    const limit = maxLength || this.INPUT_LENGTH_LIMITS[fieldName as keyof typeof this.INPUT_LENGTH_LIMITS] || 1000;
    return value.length <= limit;
  }

  /**
   * Check for potential SQL injection patterns
   */
  static containsSqlInjection(input: string): boolean {
    // Improved SQL patterns: most DML/DDL statements appear as `UPDATE <ident> SET ...`,
    // `INSERT INTO <ident> ...`, `DELETE FROM <ident> ...`. The original regex list was
    // missing the identifier slot, allowing `UPDATE users SET password='x'` to evade
    // detection. Update tightens each shape to require an identifier between keyword and
    // the secondary token.
    const sqlPatterns = [
      /union\s+all\s+select/i,
      /execute\s+immediate/i,
      /\bdrop\s+(table|database|schema|index)\b/i,
      /\binsert\s+into\s+\w/i,
      /\bdelete\s+from\s+\w/i,
      /\bupdate\s+\w+\s+set\s+\w/i,
      /\balter\s+(table|database|schema|index)\b/i,
      /\bcreate\s+(view|table|index|database)\b/i,
      /\btruncate\s+(table|schema)\b/i,
      /\bxp_cmdshell\b/i,
      /\bsp_/i,
      /\/\*[\s\S]*?\*\//i,
      /;\s*(select|insert|update|delete|alter)\b/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for XSS patterns
   */
  static containsXss(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
      /onmouseover\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /vbscript:/i,
      /expression\(/i,
      /<meta[^>]*refresh/i,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Comprehensive input validation with all checks
   */
  static validateInput(
    fieldName: string,
    value: unknown,
    options?: {
      required?: boolean;
      type?: "string" | "number" | "boolean" | "object";
      maxLength?: number;
      minLength?: number;
      pattern?: RegExp;
    }
  ): { isValid: boolean; error?: string } {
    if (options?.required && (value === null || value === undefined || value === "")) {
      return { isValid: false, error: `${fieldName} is required` };
    }

    if (value === null || value === undefined) return { isValid: true };

    if (options?.type === "string" && typeof value !== "string") {
      return { isValid: false, error: `${fieldName} must be a string` };
    }

    if (typeof value === "string") {
      if (options?.minLength && value.length < options.minLength) {
        return { isValid: false, error: `${fieldName} must be at least ${options.minLength} characters` };
      }

      if (options?.maxLength && value.length > options.maxLength) {
        return { isValid: false, error: `${fieldName} must not exceed ${options.maxLength} characters` };
      }

      if (this.containsSqlInjection(value)) {
        return { isValid: false, error: `Invalid characters detected in ${fieldName}` };
      }

      if (this.containsXss(value)) {
        return { isValid: false, error: `Security violation: Invalid characters in ${fieldName}` };
      }
    }

    if (options?.pattern && typeof value === "string" && !options.pattern.test(value)) {
      return { isValid: false, error: `${fieldName} format is invalid` };
    }

    return { isValid: true };
  }
}

export const securityValidator = SecurityValidator;
