import type { ZodIssue } from "zod";

type ValidationDict = Record<string, string>;

/**
 * Maps a ZodIssue to an i18n validation message.
 * Uses issue code + path + properties to determine the correct key.
 * Falls back to the raw Zod message if no mapping is found.
 */
export function getValidationMessage(issue: ZodIssue, dict: ValidationDict): string {
  const lastPath = issue.path[issue.path.length - 1] as string | undefined;

  switch (issue.code) {
    case "too_small": {
      if (issue.type === "string" && issue.minimum === 1) {
        if (lastPath === "title") return dict.titleRequired;
        if (lastPath === "token") return dict.tokenRequired;
        if (lastPath === "password" || lastPath === "newPassword" || lastPath === "currentPassword") {
          return dict.passwordRequired;
        }
        return dict.required;
      }
      if (issue.type === "string" && issue.minimum === 2) {
        return dict.nameMinLength;
      }
      if (issue.type === "number" && issue.minimum === 0) {
        if (lastPath === "bedrooms") return dict.bedroomsMin;
        if (lastPath === "bathrooms") return dict.bathroomsMin;
        if (lastPath === "floors") return dict.floorsMin;
        return dict.required;
      }
      if (issue.type === "number" && issue.minimum === 1) {
        if (lastPath === "price") return dict.pricePositive;
        if (lastPath === "area") return dict.areaPositive;
        return dict.pricePositive;
      }
      break;
    }
    case "too_big": {
      if (lastPath === "title") return dict.titleMaxLength;
      if (lastPath === "fullName" || lastPath === "name") return dict.nameMaxLength;
      if (lastPath === "password" || lastPath === "newPassword") return dict.passwordMaxLength;
      return dict.nameMaxLength;
    }
    case "invalid_string": {
      if (issue.validation === "email") return dict.emailInvalid;
      if (issue.validation === "uuid") return dict.invalidUuid;
      if (issue.validation === "url") return dict.invalidUrl;
      if (issue.validation === "regex") {
        if (lastPath === "password" || lastPath === "newPassword") return dict.passwordPattern;
        if (lastPath === "slug") return dict.slugPattern;
        return dict.invalidInput;
      }
      break;
    }
    case "invalid_enum_value": {
      return dict.invalidStatus;
    }
    case "custom": {
      if (issue.message.includes("Password must include")) return dict.passwordPattern;
      if (issue.message.includes("Passwords do not match")) return dict.passwordMismatch;
      if (issue.message.includes("must accept")) return dict.termsRequired;
      if (issue.message.includes("Phone must be")) return dict.phoneLength;
      if (issue.message.includes("Slug can only")) return dict.slugPattern;
      return issue.message;
    }
  }

  // Fallback: infer from path name
  if (lastPath === "email") return dict.emailInvalid;
  if (lastPath === "password" || lastPath === "newPassword") return dict.passwordMinLength;
  if (lastPath === "name" || lastPath === "fullName") return dict.nameMinLength;

  return dict.invalidInput || issue.message;
}

/**
 * Maps an array of ZodIssues to a Record<string, string> of field -> message.
 */
export function mapZodIssues(issues: ZodIssue[], dict: ValidationDict): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join("_");
    errors[key] = getValidationMessage(issue, dict);
  }
  return errors;
}
