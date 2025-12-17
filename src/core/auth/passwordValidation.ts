/**
 * TibbyTalk - Password Validation
 * Ported from VeilForms auth module
 */

import type {PasswordRequirements, PasswordValidationResult} from '../../types';

/**
 * Password requirements - matches VeilForms standards
 */
export const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // keeping it reasonable
};

/**
 * Validate password strength against requirements
 *
 * @param password - The password to validate
 * @returns Validation result with errors if invalid
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    );
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecial &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get human-readable password requirements
 */
export function getPasswordRequirementsText(): string[] {
  const requirements: string[] = [];

  requirements.push(
    `At least ${PASSWORD_REQUIREMENTS.minLength} characters long`,
  );

  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push('At least one uppercase letter (A-Z)');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push('At least one lowercase letter (a-z)');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber) {
    requirements.push('At least one number (0-9)');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial) {
    requirements.push('At least one special character (!@#$%^&*...)');
  }

  return requirements;
}
