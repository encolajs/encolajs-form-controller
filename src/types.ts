import type { signal, computed } from 'alien-signals'

// Extract types from alien-signals functions
// signal() returns a function that both gets and sets values
export type Signal<T> = ReturnType<typeof signal<T>>
// computed() returns a function that only gets values
export type ISignal<T> = ReturnType<typeof computed<T>>

/**
 * Options for setting field values
 */
export interface FormSetValueOptions {
  /** Whether to trigger validation after setting the value */
  validate?: boolean
  /** Whether to mark the field as touched */
  touch?: boolean
  /** Whether to mark the field as dirty */
  dirty?: boolean
}

/**
 * Data source interface for managing form data
 * Provides abstraction over different data storage mechanisms
 */
export interface DataSource {
  /** Get value by path */
  get(path: string): unknown

  /** Set value by path */
  set(path: string, value: unknown): void

  /** Get all data */
  all(): Record<string, unknown>

  /** Add item to array at path */
  arrayPush(arrayPath: string, value: unknown): void

  /** Insert item into array at specific index */
  arrayInsert(arrayPath: string, index: number, value: unknown): void

  /** Remove item from array at index */
  arrayRemove(arrayPath: string, index: number): void

  /** Move item within array */
  arrayMove(arrayPath: string, fromIndex: number, toIndex: number): void

  /** Check if path exists */
  has(path: string): boolean

  /** Remove value at path */
  remove(path: string): void

  /** Create a deep clone of the current data source */
  clone(): DataSource
}

/**
 * Form validator interface for pluggable validation systems
 */
export interface FormValidator {
  /** Validate a specific field */
  validateField(path: string, dataSource: DataSource): Promise<string[]>

  /** Validate entire form */
  validate(dataSource: DataSource): Promise<Record<string, string[]>>

  /** Get current field errors */
  getFieldErrors(path: string): string[]

  /** Get all current errors */
  getAllErrors(): Record<string, string[]>

  /** Check if field is valid */
  isFieldValid(path: string): boolean

  /** Check if entire form is valid */
  isValid(): boolean

  /** Get fields that depend on the given field */
  getDependentFields(path: string): string[]

  /** Clear errors for specific field */
  clearFieldErrors(path: string): void

  /** Clear all errors */
  clearAllErrors(): void

  /** Set errors for specific field */
  setFieldErrors(path: string, errors: string[]): void

  /** Set multiple field errors */
  setErrors(errors: Record<string, string[]>): void
}

/**
 * Field controller interface providing reactive field state and operations
 */
export interface IFieldController {
  /** Reactive field value (computed from DataSource) */
  readonly value: ISignal<unknown>

  /** Whether field has been modified */
  readonly isDirty: Signal<boolean>

  /** Whether field has been interacted with */
  readonly isTouched: Signal<boolean>

  /** Whether field is currently being validated */
  readonly isValidating: Signal<boolean>

  /** Whether field is valid */
  readonly isValid: ISignal<boolean>

  /** Current field validation errors */
  readonly errors: ISignal<string[]>

  /** Set field value */
  setValue(value: unknown, options?: FormSetValueOptions): Promise<void>

  /** Get field value */
  getValue(): unknown

  /** Validate this field */
  validate(): Promise<boolean>

  /** Set field errors */
  setErrors(errors: string[]): void

  /** Reset field state */
  reset(): void
}

/**
 * Main form controller interface
 */
export interface IFormController {
  /** Whether form is currently being submitted */
  readonly isSubmitting: Signal<boolean>

  /** Whether form is currently being validated */
  readonly isValidating: Signal<boolean>

  /** Whether any field has been modified */
  readonly isDirty: Signal<boolean>

  /** Whether any field has been interacted with */
  readonly isTouched: Signal<boolean>

  /** Whether entire form is valid */
  readonly isValid: ISignal<boolean>

  /** Get field controller for specific path */
  field(path: string): IFieldController

  /** Get all form values */
  getValues(): Record<string, unknown>

  /** Validate entire form */
  validate(): Promise<boolean>

  /** Submit form */
  submit(): Promise<boolean>

  /** Reset form to initial state */
  reset(): void

  /** Cleanup form resources */
  destroy(): void

  /** Add item to array field */
  arrayAdd(arrayPath: string, item: unknown, index?: number): void

  /** Remove item from array field */
  arrayRemove(arrayPath: string, index: number): void

  /** Move item within array field */
  arrayMove(arrayPath: string, fromIndex: number, toIndex: number): void

  /** Set form-level errors */
  setErrors(errors: Record<string, string[]>): void
}

/**
 * Form controller configuration options
 */
export interface FormControllerOptions {
  /** Initial form data */
  initialData?: Record<string, unknown>

  /** Custom data source */
  dataSource?: DataSource

  /** Custom validator */
  validator?: FormValidator

  /** Whether to validate on change */
  validateOnChange?: boolean

  /** Whether to validate on blur */
  validateOnBlur?: boolean

  /** Custom submit handler */
  onSubmit?: (data: Record<string, unknown>) => Promise<boolean> | boolean
}

/**
 * Path utility type for type-safe path access
 */
export type Path<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${Path<T[K]>}`
          : `${K}`
        : never
    }[keyof T]
  : never