import type { FormValidator, DataSource } from '../../src/types'

export class MockFormValidator implements FormValidator {
  private fieldErrors: Record<string, string[]> = {}
  private formErrors: Record<string, string[]> = {}
  private asyncDelays: Record<string, number> = {}

  async validateField(path: string, dataSource: DataSource): Promise<string[]> {
    const delay = this.asyncDelays[path] || 0

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    // We can access the data if needed: const data = dataSource.all()
    return this.fieldErrors[path] || []
  }

  async validate(dataSource: DataSource): Promise<Record<string, string[]>> {
    const maxDelay = Math.max(...Object.values(this.asyncDelays))

    if (maxDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, maxDelay))
    }

    // We can access the data if needed: const data = dataSource.all()
    return { ...this.formErrors }
  }

  getFieldErrors(path: string): string[] {
    return this.fieldErrors[path] || []
  }

  getAllErrors(): Record<string, string[]> {
    return { ...this.fieldErrors }
  }

  isFieldValid(path: string): boolean {
    return !this.fieldErrors[path] || this.fieldErrors[path].length === 0
  }

  isValid(): boolean {
    return Object.keys(this.fieldErrors).length === 0
  }

  getDependentFields(path: string): string[] {
    // Mock implementation - could be enhanced for testing dependent validations
    return []
  }

  clearFieldErrors(path: string): void {
    delete this.fieldErrors[path]
    delete this.formErrors[path]
  }

  clearAllErrors(): void {
    this.fieldErrors = {}
    this.formErrors = {}
  }

  setFieldErrors(path: string, errors: string[]): void {
    if (errors.length > 0) {
      this.fieldErrors[path] = errors
      this.formErrors[path] = errors
    } else {
      delete this.fieldErrors[path]
      delete this.formErrors[path]
    }
  }

  setErrors(errors: Record<string, string[]>): void {
    this.fieldErrors = { ...errors }
    this.formErrors = { ...errors }
  }

  // Test helper methods
  mockFieldValidation(path: string, errors: string[]): void {
    this.fieldErrors[path] = errors
  }

  mockFormValidation(errors: Record<string, string[]>): void {
    this.formErrors = errors
    this.fieldErrors = { ...errors }
  }

  mockAsyncValidation(path: string, errors: string[], delay: number): void {
    this.fieldErrors[path] = errors
    this.asyncDelays[path] = delay
  }

  clearMocks(): void {
    this.fieldErrors = {}
    this.formErrors = {}
    this.asyncDelays = {}
  }

  reset(): void {
    this.fieldErrors = {}
    this.formErrors = {}
    this.asyncDelays = {}
  }
}
