import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function for checking non-empty values
export function isNonEmpty(v?: string | null): boolean {
  return (v ?? '').toString().trim().length > 0;
}

// Validation functions for Greek formats
export function validateTelephone(telephone: string): { isValid: boolean; error?: string } {
  if (!telephone.trim()) {
    return { isValid: true };
  }

  const phoneRegex = /^(\+30)?[0-9]{10}$/;
  if (!phoneRegex.test(telephone.replace(/\s+/g, ''))) {
    return {
      isValid: false,
      error: 'Το τηλέφωνο πρέπει να είναι 10 ψηφία (π.χ. 6912345678 ή +306912345678)'
    };
  }

  return { isValid: true };
}

export function validateAFM(afm: string): { isValid: boolean; error?: string } {
  if (!afm.trim()) {
    return { isValid: true };
  }

  const afmRegex = /^[0-9]{9}$/;
  if (!afmRegex.test(afm.replace(/\s+/g, ''))) {
    return {
      isValid: false,
      error: 'Το ΑΦΜ πρέπει να είναι ακριβώς 9 ψηφία'
    };
  }

  return { isValid: true };
}
