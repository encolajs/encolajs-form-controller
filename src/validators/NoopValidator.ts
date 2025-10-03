import type { FormValidator, DataSource } from '../types'

/**
 * No-operation validator that considers all fields and forms to be valid
 * Used as the default validator when no validation is needed
 */
export class NoopValidator implements FormValidator {
  async validateField(
    _path: string,
    _dataSource: DataSource
  ): Promise<string[]> {
    return []
  }

  async validate(_dataSource: DataSource): Promise<Record<string, string[]>> {
    return {}
  }

  getFieldErrors(_path: string): string[] {
    return []
  }

  getAllErrors(): Record<string, string[]> {
    return {}
  }

  isFieldValid(_path: string): boolean {
    return true
  }

  isValid(): boolean {
    return true
  }

  getDependentFields(_path: string): string[] {
    return []
  }

  clearFieldErrors(_path: string): void {}

  clearAllErrors(): void {}

  setFieldErrors(_path: string, _errors: string[]): void {}

  setErrors(_errors: Record<string, string[]>): void {}
}
