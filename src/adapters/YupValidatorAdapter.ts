import type { FormValidator, DataSource } from '../types'

/**
 * Tree-shakable Yup adapter for FormController
 * Only imports Yup types, not the runtime library
 *
 * Usage:
 * import { YupValidatorAdapter } from '@encolajs/form-controller/yup'
 * import * as yup from 'yup'
 */

// Use type-only imports to avoid bundling Yup when not used
type YupSchema = any
type YupValidationError = any

/**
 * Yup Validator Adapter
 * Requires Yup to be installed as a peer dependency
 */
export class YupValidatorAdapter implements FormValidator {
  private schema: YupSchema | null = null
  private errors: Record<string, string[]> = {}

  constructor(schema?: YupSchema) {
    if (schema) {
      this.setSchema(schema)
    }
  }

  /**
   * Set the Yup schema for validation
   */
  setSchema(schema: YupSchema): void {
    this.schema = schema
    this.clearAllErrors()
  }

  async validateField(path: string, dataSource: DataSource): Promise<string[]> {
    if (!this.schema) return []

    try {
      const fieldValue = dataSource.get(path)
      const data = dataSource.all()

      // Get the schema for this specific field
      const fieldSchema = this.getFieldSchema(path)

      if (fieldSchema) {
        // Validate only the specific field value
        try {
          await fieldSchema.validate(fieldValue, { abortEarly: false })
          // If validation passes, clear errors for this field
          delete this.errors[path]
          return []
        } catch (error: any) {
          if (error.name === 'ValidationError') {
            // Handle field-specific validation error
            let fieldErrors = error.inner && error.inner.length > 0
              ? error.inner.map((err: YupValidationError) => err.message)
              : [error.message]

            // Remove duplicate error messages
            fieldErrors = [...new Set(fieldErrors)]

            this.errors[path] = fieldErrors
            return fieldErrors
          }
          delete this.errors[path]
          return []
        }
      } else {
        // Fallback: validate entire form and filter for this field
        try {
          await this.schema.validate(data, { abortEarly: false })
          // If validation passes, clear errors for this field
          delete this.errors[path]
          return []
        } catch (error: any) {
          if (error.name === 'ValidationError' && error.inner) {
            const fieldErrors = error.inner
              .filter((err: YupValidationError) => err.path === path)
              .map((err: YupValidationError) => err.message)

            if (fieldErrors.length > 0) {
              this.errors[path] = fieldErrors
              return fieldErrors
            }
          }

          delete this.errors[path]
          return []
        }
      }
    } catch (error: any) {
      console.error('[YupValidatorAdapter] Error validating field:', error)
      delete this.errors[path]
      return []
    }
  }

  async validate(dataSource: DataSource): Promise<Record<string, string[]>> {
    if (!this.schema) return {}

    try {
      const data = dataSource.all()

      await this.schema.validate(data, { abortEarly: false })
      this.errors = {}
      return {}
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.inner) {
        const errorMap: Record<string, string[]> = {}

        error.inner.forEach((err: YupValidationError) => {
          const path = err.path || 'root'
          if (!errorMap[path]) {
            errorMap[path] = []
          }
          // Avoid duplicate error messages
          if (!errorMap[path].includes(err.message)) {
            errorMap[path].push(err.message)
          }
        })

        this.errors = errorMap
        return errorMap
      }

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

  getDependentFields(_path: string): string[] {
    // Yup doesn't have built-in dependency tracking
    // Could be extended by analyzing schema dependencies
    return []
  }

  clearFieldErrors(path: string): void {
    delete this.errors[path]
  }

  clearAllErrors(): void {
    this.errors = {}
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

  private getFieldSchema(path: string): any {
    if (!this.schema) return null

    try {
      // Navigate through the schema to find the field schema
      const pathParts = path.split('.')
      let currentSchema = this.schema

      for (const part of pathParts) {
        if (currentSchema.fields && currentSchema.fields[part]) {
          currentSchema = currentSchema.fields[part]
        } else if (currentSchema._def && currentSchema._def.shape && currentSchema._def.shape[part]) {
          currentSchema = currentSchema._def.shape[part]
        } else if (currentSchema.describe && typeof currentSchema.describe === 'function') {
          // Use describe() to get schema details and extract field
          const description = currentSchema.describe()
          if (description.fields && description.fields[part]) {
            return description.fields[part]
          }
          return null
        } else {
          return null
        }
      }

      return currentSchema
    } catch {
      return null
    }
  }
}

/**
 * Factory function for creating Yup adapter
 */
export function createYupAdapter(schema?: YupSchema): YupValidatorAdapter {
  return new YupValidatorAdapter(schema)
}