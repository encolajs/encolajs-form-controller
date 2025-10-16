import type { IFormValidator, DataSource } from '../types'

/**
 * Tree-shakable EncolaJS Validator adapter for FormController
 * Only imports EncolaJS Validator types, not the runtime library
 *
 * Usage:
 * import { EncolaValidatorAdapter } from '@encolajs/form-controller/encola'
 * import { ValidatorFactory } from '@encolajs/validator'
 */

// Use type-only imports to avoid bundling EncolaJS Validator when not used
type EncolaValidator = any
type EncolaValidatorFactory = any

/**
 * EncolaJS Validator Adapter
 * Requires @encolajs/validator to be installed as a peer dependency
 */
export class EncolaValidatorAdapter implements IFormValidator {
  private validator: EncolaValidator | null = null
  private errors: Record<string, string[]> = {}

  constructor(validator?: EncolaValidator) {
    if (validator) {
      this.setValidator(validator)
    }
  }

  setValidator(validator: EncolaValidator): void {
    this.validator = validator
    this.clearAllErrors()
  }

  async validateField(path: string, dataSource: DataSource): Promise<string[]> {
    if (!this.validator) return []

    try {
      const data = dataSource.all()

      // EncolaJS Validator has excellent support for single path validation
      const isValid = await this.validator.validatePath(path, data)

      if (isValid) {
        // If validation passes, clear errors for this field
        delete this.errors[path]
        return []
      } else {
        // Get errors for this specific path
        const fieldErrors = this.validator.getErrorsForPath(path)
        this.errors[path] = fieldErrors
        return fieldErrors
      }
    } catch (error: any) {
      console.error('[EncolaValidatorAdapter] Error validating field:', error)
      delete this.errors[path]
      return []
    }
  }

  async validate(dataSource: DataSource): Promise<Record<string, string[]>> {
    if (!this.validator) return {}

    try {
      const data = dataSource.all()

      const isValid = await this.validator.validate(data)

      if (isValid) {
        this.errors = {}
        return {}
      } else {
        // Get all validation errors
        const errorMap = this.validator.getErrors()
        this.errors = errorMap
        return errorMap
      }
    } catch (error: any) {
      console.error('[EncolaValidatorAdapter] Error validating form:', error)
      return {}
    }
  }

  getFieldErrors(path: string): string[] {
    return this.errors[path] || []
  }

  getAllErrors(): Record<string, string[]> {
    return { ...this.errors }
  }

  isFieldValid(path: string): boolean {
    return !this.errors[path] || this.errors[path].length === 0
  }

  isValid(): boolean {
    return Object.keys(this.errors).length === 0
  }

  getDependentFields(path: string): string[] {
    // EncolaJS Validator has built-in dependency tracking
    if (!this.validator) return []

    try {
      return this.validator.getDependentFields(path) || []
    } catch {
      return []
    }
  }

  clearFieldErrors(path: string): void {
    delete this.errors[path]
    // Also clear in the validator if it has this method
    if (this.validator && this.validator.clearErrorsForPath) {
      this.validator.clearErrorsForPath(path)
    }
  }

  clearAllErrors(): void {
    this.errors = {}
    // Also clear in the validator if it has this method
    if (this.validator && this.validator.reset) {
      this.validator.reset()
    }
  }

  setFieldErrors(path: string, errors: string[]): void {
    if (errors.length > 0) {
      this.errors[path] = errors
    } else {
      delete this.errors[path]
    }
  }

  setErrors(errors: Record<string, string[]>): void {
    this.errors = { ...errors }
  }
}

/**
 * Factory function for creating EncolaJS Validator adapter
 * Provides better ergonomics and tree-shaking
 */
export function useEncolaValidator(
  validator?: EncolaValidator
): EncolaValidatorAdapter {
  return new EncolaValidatorAdapter(validator)
}

/**
 * Helper function for creating EncolaJS Validator adapter from rules
 * This function requires the ValidatorFactory to be passed in to avoid bundling
 */
export function createEncolaValidatorFromRules(
  validatorFactory: EncolaValidatorFactory,
  rules: Record<string, string>,
  customMessages?: any
): EncolaValidatorAdapter {
  const validator = validatorFactory.make(rules, customMessages)
  return new EncolaValidatorAdapter(validator)
}
