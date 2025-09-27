import type { FormValidator } from '../types'

/**
 * No-operation validator that considers all fields and forms to be valid
 * Used as the default validator when no validation is needed
 */
export class NoopValidator implements FormValidator {
  async validateField(_path: string, _data: Record<string, unknown>): Promise<string[]> {
    // Always return no errors (valid)
    return []
  }

  async validate(_data: Record<string, unknown>): Promise<Record<string, string[]>> {
    // Always return no errors (valid form)
    return {}
  }

  getFieldErrors(_path: string): string[] {
    // No errors stored
    return []
  }

  getAllErrors(): Record<string, string[]> {
    // No errors stored
    return {}
  }

  isFieldValid(_path: string): boolean {
    // All fields are considered valid
    return true
  }

  isValid(): boolean {
    // Form is always considered valid
    return true
  }

  getDependentFields(_path: string): string[] {
    // No dependent fields
    return []
  }

  clearFieldErrors(_path: string): void {
    // No-op: no errors to clear
  }

  clearAllErrors(): void {
    // No-op: no errors to clear
  }

  setFieldErrors(_path: string, _errors: string[]): void {
    // No-op: errors are ignored in noop validator
  }

  setErrors(_errors: Record<string, string[]>): void {
    // No-op: errors are ignored in noop validator
  }
}