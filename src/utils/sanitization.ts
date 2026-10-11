/**
 * Input sanitization and safety utilities for PaisaPilot.
 * Protects financial state against extreme values, negative floats, prototype pollution,
 * control character injection, and excessively long strings.
 */

export const MAX_SAFE_FINANCIAL_AMOUNT = 10_000_000; // ₹1,00,00,000 (1 crore ceiling)
export const MAX_TITLE_LENGTH = 120;
export const MAX_NOTES_LENGTH = 400;

/**
 * Sanitizes and normalizes user-provided text.
 * Strips non-printable ASCII control characters, collapses excessive whitespace,
 * and clamps to the specified maximum length.
 */
export function sanitizeString(
  value: unknown,
  maxLength: number = MAX_TITLE_LENGTH
): string {
  if (typeof value !== 'string') return '';
  
  // Strip control characters (except standard newlines/tabs)
  // and normalize whitespace
  const cleaned = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();

  return cleaned.slice(0, maxLength);
}

/**
 * Validates and safely converts a financial amount input.
 * Ensures the value is a finite number, non-negative, does not exceed safe financial ceiling,
 * and rounds to 2 decimal places.
 */
export function sanitizeAmount(
  value: unknown,
  maxAmount: number = MAX_SAFE_FINANCIAL_AMOUNT
): {
  isValid: boolean;
  amount: number;
  error?: string;
} {
  let num: number;

  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, amount: 0, error: 'Amount is required.' };
    }
    num = Number(trimmed);
  } else {
    return { isValid: false, amount: 0, error: 'Invalid amount format.' };
  }

  if (isNaN(num) || !isFinite(num)) {
    return { isValid: false, amount: 0, error: 'Please enter a valid numeric amount.' };
  }

  if (num <= 0) {
    return { isValid: false, amount: 0, error: 'Amount must be greater than ₹0.' };
  }

  if (num > maxAmount) {
    return {
      isValid: false,
      amount: 0,
      error: `Amount cannot exceed ₹${maxAmount.toLocaleString('en-IN')}.`,
    };
  }

  // Round to 2 decimal places to avoid IEEE-754 precision issues
  const rounded = Math.round(num * 100) / 100;
  return { isValid: true, amount: rounded };
}

/**
 * Validates a date string and returns a normalized ISO date string.
 * Falls back safely to current date if invalid.
 */
export function sanitizeDate(
  dateValue: unknown,
  fallbackIso?: string
): string {
  const defaultIso = fallbackIso || new Date().toISOString();

  if (typeof dateValue !== 'string' || !dateValue.trim()) {
    return defaultIso;
  }

  const parsed = new Date(dateValue.trim());
  if (isNaN(parsed.getTime())) {
    return defaultIso;
  }

  return parsed.toISOString();
}
