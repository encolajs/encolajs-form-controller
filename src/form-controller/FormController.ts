import { signal, computed } from 'alien-signals'
import type {
  DataSource,
  FormValidator,
  IFieldState,
  IFormController,
  FormSetValueOptions,
  Signal,
  ISignal
} from '../types'
import { PlainObjectDataSource } from '@/data-sources'
import { NoopValidator } from '@/validators'
import {
  insertFieldState,
  removeFieldState,
  swapFieldStates
} from '../utils/arrayFieldStateUtils'

function createFieldState(formController: FormController, path: string): IFieldState {
  // Individual field state signals
  const isDirty = signal(false)
  const isTouched = signal(false)
  const isValidating = signal(false)
  const wasValidated = signal(false)

  // Computed value from data source
  const value = computed(() => {
    formController.dataChanged() // Subscribe to data changes
    return formController.getValue(path)
  }) as ISignal<unknown>

  // Computed field errors from form controller
  const errors = computed(() => {
    formController.errorsChanged() // Subscribe to errors changes
    return formController.getErrors()[path] || []
  }) as ISignal<string[]>

  // Computed field validity
  const isValid = computed(() => errors().length === 0) as ISignal<boolean>

  return {
    path,
    value,
    isDirty,
    isTouched,
    isValidating,
    wasValidated,
    errors,
    isValid
  }
}


export class FormController implements IFormController {
  // Form-level reactive state
  readonly isSubmitting: Signal<boolean>
  readonly isValidating: Signal<boolean>
  readonly isDirty: Signal<boolean>
  readonly isTouched: Signal<boolean>
  readonly isValid: ISignal<boolean>

  // Internal state
  private dataSource: DataSource
  private initialDataSource: DataSource
  private validator: FormValidator
  private fieldStates: Map<string, IFieldState> = new Map()
  readonly dataChanged: Signal<number>
  readonly errorsChanged: Signal<number>
  private errors: Record<string, string[]> = {}

  constructor(dataSource: DataSource, validator?: FormValidator) {
    this.dataSource = dataSource
    this.initialDataSource = dataSource.clone() // Keep initial state for reset
    this.validator = validator || new NoopValidator()

    // Initialize reactive signals
    this.isSubmitting = signal(false)
    this.isValidating = signal(false)
    this.isDirty = signal(false)
    this.isTouched = signal(false)

    // Incrementor signals for triggering reactivity
    this.dataChanged = signal(0)
    this.errorsChanged = signal(0)

    // Computed form validity
    this.isValid = computed(() => {
      this.errorsChanged() // Subscribe to errors changes
      return Object.keys(this.errors).length === 0
    }) as ISignal<boolean>
  }

  field(path: string): IFieldState {
    // Cache field states to maintain signal consistency
    if (!this.fieldStates.has(path)) {
      const fieldState = createFieldState(this, path)
      this.fieldStates.set(path, fieldState)
    }

    return this.fieldStates.get(path)!
  }

  getValue(path: string): unknown {
    return this.dataSource.get(path)
  }

  async setValue(path: string, value: unknown, options: FormSetValueOptions = {}): Promise<void> {
    const {
      validate,
      touch = true,
      dirty = true
    } = options

    // Update the data source
    this.dataSource.set(path, value)

    // Trigger data source reactivity
    this.triggerDataUpdate()

    // Update form-level state
    if (dirty) {
      this.isDirty(true)
    }

    if (touch) {
      this.isTouched(true)
    }

    // Update field state if field exists
    const fieldState = this.fieldStates.get(path)
    if (fieldState) {
      if (dirty) {
        fieldState.isDirty(true)
      }

      if (touch) {
        fieldState.isTouched(true)
      }
    }

    // Determine if validation should be triggered
    // Priority: explicit validate option > dirty=true triggers validation
    const shouldValidate = validate !== undefined ? validate : dirty

    if (shouldValidate) {
      await this.validateField(path)
    }
  }

  async validateField(path: string): Promise<boolean> {
    const fieldState = this.fieldStates.get(path)
    if (fieldState) {
      fieldState.isValidating(true)
    }

    try {
      const errors = await this.validator.validateField(path, this.dataSource)

      // Update form-level errors
      this.setFieldErrors(path, errors)

      return errors.length === 0
    } catch (error) {
      console.error(`[FormController] Error validating field ${path}:`, error)
      return false
    } finally {
      if (fieldState) {
        fieldState.isValidating(false)
        fieldState.wasValidated(true)
      }
    }
  }

  getErrors(): Record<string, string[]> {
    return this.errors
  }

  getValues(): Record<string, unknown> {
    return this.dataSource.all()
  }

  async validate(): Promise<boolean> {
    this.isValidating(true)

    try {
      const errors = await this.validator.validate(this.dataSource)

      this.errors = errors
      this.errorsChanged(this.errorsChanged() + 1)

      return Object.keys(errors).length === 0
    } catch (error) {
      console.error('[FormController] Error validating form:', error)
      return false
    } finally {
      this.isValidating(false)
    }
  }

  async submit(): Promise<boolean> {
    this.isSubmitting(true)

    try {
      // Validate form first
      const isValid = await this.validate()

      if (!isValid) {
        return false
      }

      // Form is valid, submission logic would go here
      // In a real implementation, this might call a submit handler
      return true
    } catch (error) {
      console.error('[FormController] Error submitting form:', error)
      return false
    } finally {
      this.isSubmitting(false)
    }
  }

  reset(): void {
    // Restore data from initial state
    const initialData = this.initialDataSource.all()
    this.dataSource = new PlainObjectDataSource(initialData)

    // Reset form-level state
    this.isDirty(false)
    this.isTouched(false)
    this.errors = {}
    this.errorsChanged(this.errorsChanged() + 1)

    // Reset all field states
    this.fieldStates.forEach(fieldState => {
      fieldState.isDirty(false)
      fieldState.isTouched(false)
      fieldState.isValidating(false)
      fieldState.wasValidated(false)
    })

    // Trigger data update
    this.triggerDataUpdate()
  }

  destroy(): void {
    // Clean up field states
    this.fieldStates.clear()

    // Clear any ongoing operations
    this.isSubmitting(false)
    this.isValidating(false)
  }

  // Array operations
  async arrayAdd(arrayPath: string, item: unknown, index?: number): Promise<void> {
    if (index !== undefined) {
      this.dataSource.arrayInsert(arrayPath, index, item)
      await insertFieldState(
        this.fieldStates,
        (path) => this.field(path),
        (path) => this.validateField(path),
        arrayPath,
        index
      )
    } else {
      this.dataSource.arrayPush(arrayPath, item)
    }

    this.isDirty(true)
    this.triggerDataUpdate()
  }

  async arrayRemove(arrayPath: string, index: number): Promise<void> {
    this.dataSource.arrayRemove(arrayPath, index)
    const currentArrayLength = (this.dataSource.get(arrayPath) as unknown[])?.length || 0
    await removeFieldState(
      this.fieldStates,
      (path) => this.field(path),
      (path) => this.validateField(path),
      arrayPath,
      index,
      currentArrayLength
    )
    this.isDirty(true)
    this.triggerDataUpdate()
  }

  async arrayMove(arrayPath: string, fromIndex: number, toIndex: number): Promise<void> {
    this.dataSource.arrayMove(arrayPath, fromIndex, toIndex)
    const currentArrayLength = (this.dataSource.get(arrayPath) as unknown[])?.length || 0
    await swapFieldStates(
      this.fieldStates,
      (path) => this.field(path),
      (path) => this.validateField(path),
      arrayPath,
      fromIndex,
      toIndex,
      currentArrayLength
    )
    this.isDirty(true)
    this.triggerDataUpdate()
  }

  setErrors(errors: Record<string, string[]>): void {
    // Get current errors and merge with new ones
    const updatedErrors = { ...this.errors }

    // Update/remove errors for specified fields
    Object.keys(errors).forEach(path => {
      if (errors[path].length > 0) {
        updatedErrors[path] = errors[path]
      } else {
        delete updatedErrors[path]
      }
    })

    this.errors = updatedErrors
    this.errorsChanged(this.errorsChanged() + 1)

    // Mark affected fields as touched
    Object.keys(errors).forEach(path => {
      const fieldState = this.fieldStates.get(path)
      if (fieldState) {
        fieldState.isTouched(true)
      }
    })

    this.setTouched(true)
  }

  // Internal helper methods


  /**
   * Set errors for a specific field
   */
  setFieldErrors(path: string, errors: string[]): void {
    const currentErrors = { ...this.errors }

    if (errors.length > 0) {
      currentErrors[path] = errors
    } else {
      delete currentErrors[path]
    }

    this.errors = currentErrors
    this.errorsChanged(this.errorsChanged() + 1)
  }

  /**
   * Set dirty state
   */
  setDirty(dirty: boolean): void {
    this.isDirty(dirty)
  }

  /**
   * Set touched state
   */
  setTouched(touched: boolean): void {
    this.isTouched(touched)
  }

  /**
   * Trigger data update (to notify computed values)
   */
  triggerDataUpdate(): void {
    this.dataChanged(this.dataChanged() + 1)
  }


}