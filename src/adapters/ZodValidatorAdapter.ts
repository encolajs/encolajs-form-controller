import type { FormValidator, DataSource } from '../types'

/**
 * Tree-shakable Zod adapter for FormController
 * Only imports Zod types, not the runtime library
 *
 * Usage:
 * import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
 * import { z } from 'zod'
 */

// Use type-only imports to avoid bundling Zod when not used
type ZodSchema = any
type ZodError = any
type ZodIssue = any

/**
 * Zod Validator Adapter
 * Requires Zod to be installed as a peer dependency
 */
export class ZodValidatorAdapter implements FormValidator {
  private schema: ZodSchema | null = null
  private errors: Record<string, string[]> = {}

  constructor(schema?: ZodSchema) {
    if (schema) {
      this.setSchema(schema)
    }
  }

  /**
   * Set the Zod schema for validation
   */
  setSchema(schema: ZodSchema): void {
    this.schema = schema
    this.clearAllErrors()
  }

  async validateField(path: string, dataSource: DataSource): Promise<string[]> {
    if (!this.schema) return []

    try {
      // For field-specific validation, we need to extract the schema for the specific path
      const fieldSchema = this.getFieldSchema(path)

      if (fieldSchema) {
        // Validate only the specific field value
        const fieldValue = dataSource.get(path)
        fieldSchema.parse(fieldValue)

        // If validation passes, clear errors for this field
        delete this.errors[path]
        return []
      } else {
        // Fallback: validate entire form and filter for this field
        try {
          // Get all form data for validation
          const data = dataSource.all()

          this.schema.parse(data)
          // If validation passes, clear errors for this field
          delete this.errors[path]
          return []
        } catch (error: ZodError) {
          if (error?.issues) {
            const fieldErrors = error.issues
              .filter((issue: ZodIssue) => this.pathMatches(issue.path, path))
              .map((issue: ZodIssue) => issue.message)

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
      // Handle Zod validation errors from field-specific validation
      if (error?.issues) {
        // For field-specific validation, create an error for this path
        const fieldErrors = error.issues.map((issue: ZodIssue) => issue.message)
        this.errors[path] = fieldErrors
        return fieldErrors
      } else if (error?.message) {
        // Single error message
        const fieldErrors = [error.message]
        this.errors[path] = fieldErrors
        return fieldErrors
      }

      delete this.errors[path]
      return []
    }
  }

  async validate(dataSource: DataSource): Promise<Record<string, string[]>> {
    if (!this.schema) return {}

    try {
      const data = dataSource.all()
      this.schema.parse(data)
      this.errors = {}
      return {}
    } catch (error: any) {
      if (error?.issues) {
        const errorMap: Record<string, string[]> = {}

        error.issues.forEach((issue: ZodIssue) => {
          const path = issue.path.join('.')
          if (!errorMap[path]) {
            errorMap[path] = []
          }
          errorMap[path].push(issue.message)
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
    // Zod doesn't have built-in dependency tracking
    // Could be extended with custom logic
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

  private pathMatches(
    zodPath: (string | number)[],
    targetPath: string
  ): boolean {
    const zodPathStr = zodPath.join('.')
    return zodPathStr === targetPath
  }

  private getFieldSchema(path: string): any {
    if (!this.schema) return null

    try {
      const pathParts = path.split('.')
      let currentSchema = this.schema

      for (const part of pathParts) {
        if (currentSchema?._def?.shape?.[part]) {
          currentSchema = currentSchema._def.shape[part]
        } else if (currentSchema?.shape?.[part]) {
          currentSchema = currentSchema.shape[part]
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
 * Factory function for creating Zod adapter
 */
export function createZodAdapter(schema?: ZodSchema): ZodValidatorAdapter {
  return new ZodValidatorAdapter(schema)
}
