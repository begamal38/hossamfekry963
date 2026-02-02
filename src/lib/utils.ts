import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Wraps chemical equations in LTR isolation to prevent RTL text reordering.
 * This is a DISPLAY-ONLY fix - does not modify stored content.
 * 
 * Uses Unicode LTR Isolate markers:
 * - \u2066 (LEFT-TO-RIGHT ISOLATE) - starts LTR isolation
 * - \u2069 (POP DIRECTIONAL ISOLATE) - ends isolation
 * 
 * Detects patterns like: Zn + CuSO4 → ZnSO4 + Cu
 */
export function wrapChemicalEquations(text: string | null | undefined): string {
  if (!text) return '';
  
  // Pattern matches chemical equations with:
  // - Element symbols (uppercase letter + optional lowercase letters)
  // - Numbers (subscripts/coefficients)
  // - Parentheses/brackets for compound groups
  // - Operators: +, -, =, → (U+2192), ← (U+2190), ↔ (U+2194), >, <
  // - Spaces between components
  const CHEMICAL_EQUATION_PATTERN = /(?:[A-Za-z][a-z]?\d*|\([A-Za-z0-9]+\)\d*)+(?:\s*[\+\-=→←↔><]\s*(?:[A-Za-z][a-z]?\d*|\([A-Za-z0-9]+\)\d*)+)+/g;
  
  return text.replace(CHEMICAL_EQUATION_PATTERN, (match) => {
    // Wrap matched equation with LTR isolate markers
    return `\u2066${match}\u2069`;
  });
}
