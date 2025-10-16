import type { signal, computed } from 'alien-signals'

// Extract types from alien-signals functions
// signal() returns a function that both gets and sets values
export type ISignal<T> = ReturnType<typeof signal<T>>
// computed() returns a function that only gets values
export type IComputed<T> = ReturnType<typeof computed<T>>

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

  /** Add item to the end of an array at path */
  arrayAppend(arrayPath: string, value: unknown): void

  /** Add item to the beginning of an array at path */
  arrayPrepend(arrayPath: string, value: unknown): void

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
export interface IFormValidator {
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
 * Field state interface providing reactive field state and change tracking
 */
export interface IFieldState {
  /** Field path */
  readonly path: string

  /** Reactive field value (computed from DataSource) */
  readonly value: IComputed<unknown>

  /** Whether field has been modified */
  readonly isDirty: ISignal<boolean>

  /** Whether field has been interacted with */
  readonly isTouched: ISignal<boolean>

  /** Whether field is currently being validated */
  readonly isValidating: ISignal<boolean>

  /** Whether field has been validated at least once */
  readonly wasValidated: ISignal<boolean>

  /** Whether field is valid */
  readonly isValid: IComputed<boolean>

  /** Current field validation errors */
  readonly errors: IComputed<string[]>

  /**
   * Subscribe to value changes for this field
   * Returns an incrementing number each time the field value is updated
   */
  valueUpdated(): number

  /**
   * Trigger a value update notification for this field
   * @internal - Should only be called by FormController
   */
  triggerValueUpdate(): void
}

/**
 * Main form controller interface
 */
export interface IFormController {
  /** Whether form is currently being submitted */
  readonly isSubmitting: ISignal<boolean>

  /** Whether form is currently being validated */
  readonly isValidating: ISignal<boolean>

  /** Whether any field has been modified */
  readonly isDirty: IComputed<boolean>

  /** Whether any field has been interacted with */
  readonly isTouched: IComputed<boolean>

  /** Whether entire form is valid */
  readonly isValid: IComputed<boolean>

  /** Get field state for specific path */
  field(path: string): IFieldState

  /** Get field value by path */
  getValue(path: string): unknown

  /** Set field value by path */
  setValue(
    path: string,
    value: unknown,
    options?: FormSetValueOptions
  ): Promise<void>

  /** Validate specific field */
  validateField(path: string): Promise<boolean>

  /** Get current form errors */
  getErrors(): Record<string, string[]>

  /** Get all form values */
  getValues(): Record<string, unknown>

  /** Validate entire form */
  validate(): Promise<boolean>

  /** Reset form to initial state */
  reset(): void

  /** Cleanup form resources */
  destroy(): void

  /** Push item to end of array field */
  arrayAppend(
    arrayPath: string,
    item: unknown,
    validate: boolean
  ): Promise<void>

  /** Push item to end of array field */
  arrayPrepend(
    arrayPath: string,
    item: unknown,
    validate: boolean
  ): Promise<void>

  /** Insert item into array field at specific index */
  arrayInsert(
    arrayPath: string,
    index: number,
    item: unknown,
    validate: boolean
  ): Promise<void>

  /** Remove item from array field */
  arrayRemove(
    arrayPath: string,
    index: number,
    validate: boolean
  ): Promise<void>

  /** Move item within array field */
  arrayMove(
    arrayPath: string,
    fromIndex: number,
    toIndex: number,
    validate: boolean
  ): Promise<void>

  /** Set form-level errors */
  setErrors(errors: Record<string, string[]>): void
}
