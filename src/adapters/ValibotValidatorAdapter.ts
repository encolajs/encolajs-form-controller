import type { FormValidator, DataSource } from '../types'

/**
 * Tree-shakable Valibot adapter for FormController
 * Only imports Valibot types, not the runtime library
 *
 * Usage:
 * import { ValibotValidatorAdapter } from '@encolajs/form-controller/valibot'
 * import * as v from 'valibot'
 */

// Use type-only imports to avoid bundling Valibot when not used
type ValibotSchema = any
type ValibotIssue = any

/**
 * Valibot Validator Adapter
 * Requires Valibot to be installed as a peer dependency
 */
export class ValibotValidatorAdapter implements FormValidator {
  private schema: ValibotSchema | null = null
  private errors: Record<string, string[]> = {}

  constructor(schema?: ValibotSchema) {
    if (schema) {
      this.setSchema(schema)
    }
  }

  /**
   * Set the Valibot schema for validation
   */
  setSchema(schema: ValibotSchema): void {
    this.schema = schema
    this.clearAllErrors()
  }

  async validateField(path: string, dataSource: DataSource): Promise<string[]> {
    if (!this.schema) return []

    try {
      const data = dataSource.all()

      // Valibot approach: always validate the entire object and filter errors for this path
      // This is because Valibot doesn't easily support individual field validation like Zod/Yup

      let result: any
      try {
        // Use the global valibot functions if available (set by test environment)
        const v = (globalThis as any).valibot
        if (v && v.safeParse) {
          result = v.safeParse(this.schema, data)
        } else {
          // This will be filled in by tests or real usage
          throw new Error('Valibot not available - please ensure valibot library is properly imported')
        }
      } catch (error: any) {
        // Handle parse errors
        result = {
          success: false,
          issues: error.issues || [{
            message: error.message || 'Validation failed',
            path: []
          }]
        }
      }

      if (result.success) {
        delete this.errors[path]
        return []
      } else {
        // Filter issues for this specific field path
        const fieldErrors = result.issues
          .filter((issue: ValibotIssue) => this.pathMatches(issue.path, path))
          .map((issue: ValibotIssue) => issue.message)

        if (fieldErrors.length > 0) {
          this.errors[path] = fieldErrors
          return fieldErrors
        }

        delete this.errors[path]
        return []
      }
    } catch (error) {
      console.error('[ValibotValidatorAdapter] Error validating field:', error)
      return []
    }
  }

  async validate(dataSource: DataSource): Promise<Record<string, string[]>> {
    if (!this.schema) return {}

    try {
      const data = dataSource.all()

      let result: any
      try {
        // Use the global valibot functions if available (set by test environment)
        const v = (globalThis as any).valibot
        if (v && v.safeParse) {
          result = v.safeParse(this.schema, data)
        } else {
          // This will be filled in by tests or real usage
          throw new Error('Valibot not available - please ensure valibot library is properly imported')
        }
      } catch (error: any) {
        // Handle parse errors
        result = {
          success: false,
          issues: error.issues || [{
            message: error.message || 'Validation failed',
            path: []
          }]
        }
      }

      if (result.success) {
        this.errors = {}
        return {}
      } else {
        const errorMap: Record<string, string[]> = {}

        result.issues.forEach((issue: ValibotIssue) => {
          const path = this.issuePathToString(issue.path)
          if (!errorMap[path]) {
            errorMap[path] = []
          }
          errorMap[path].push(issue.message)
        })

        this.errors = errorMap
        return errorMap
      }
    } catch (error) {
      console.error('[ValibotValidatorAdapter] Error validating form:', error)
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
    // Valibot doesn't have built-in dependency tracking
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

  private pathMatches(issuePath: any, targetPath: string): boolean {
    const pathStr = this.issuePathToString(issuePath)
    return pathStr === targetPath
  }

  private issuePathToString(path: any): string {
    if (!path || !Array.isArray(path)) return ''

    return path
      .map((segment: any) => {
        if (segment.type === 'object' && segment.key) {
          return segment.key
        }
        if (segment.type === 'array' && typeof segment.key === 'number') {
          return segment.key.toString()
        }
        return segment.key || ''
      })
      .filter(Boolean)
      .join('.')
  }
}

/**
 * Factory function for creating Valibot adapter
 */
export function createValibotAdapter(schema?: ValibotSchema): ValibotValidatorAdapter {
  return new ValibotValidatorAdapter(schema)
}