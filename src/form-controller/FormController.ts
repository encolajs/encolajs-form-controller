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
  readonly isDirty: ISignal<boolean>
  readonly isTouched: ISignal<boolean>
  readonly isValid: ISignal<boolean>

  // Internal state
  private dataSource: DataSource
  private initialDataSource: DataSource
  private validator: FormValidator
  private fieldStates: Map<string, IFieldState> = new Map()
  readonly dataChanged: Signal<number>
  readonly errorsChanged: Signal<number>
  private readonly fieldStatesSize: Signal<number>
  private errors: Record<string, string[]> = {}

  constructor(dataSource: DataSource, validator?: FormValidator) {
    this.dataSource = dataSource
    this.initialDataSource = dataSource.clone() // Keep initial state for reset
    this.validator = validator || new NoopValidator()

    // Initialize reactive signals
    this.isSubmitting = signal(false)
    this.isValidating = signal(false)

    // Incrementor signals for triggering reactivity
    this.dataChanged = signal(0)
    this.errorsChanged = signal(0)
    this.fieldStatesSize = signal(0)

    // Computed form-level state from field states
    this.isDirty = computed(() => {
      this.fieldStatesSize() // Subscribe to field states map changes
      return Array.from(this.fieldStates.values()).some(field => field.isDirty())
    }) as ISignal<boolean>

    this.isTouched = computed(() => {
      this.fieldStatesSize() // Subscribe to field states map changes
      return Array.from(this.fieldStates.values()).some(field => field.isTouched())
    }) as ISignal<boolean>

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
      this.fieldStatesSize(this.fieldStates.size)
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

    // Form-level state is now computed from field states

    // Ensure field state exists and update it
    const fieldState = this.field(path) // This creates the field state if it doesn't exist
    if (dirty) {
      fieldState.isDirty(true)
    }

    if (touch) {
      fieldState.isTouched(true)
    }


    // Determine if validation should be triggered
    // Priority: explicit validate option > dirty=true triggers validation
    const shouldValidate = fieldState.wasValidated() || (validate !== undefined ? validate : dirty)

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

      // Ensure fields exist for each error
      Object.keys(errors).forEach((path) => this.field(path))

      // Mark all existing field states as wasValidated since form validation validates everything
      this.fieldStates.forEach(fieldState => {
        fieldState.wasValidated(true)
      })


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

    // Mark array field as dirty
    const arrayField = this.field(arrayPath)
    arrayField.isDirty(true)

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
      currentArrayLength,
      (arrayPath, removeIndex, arrayLength) => this.cleanupArrayErrors(arrayPath, removeIndex, arrayLength)
    )

    // Mark array field as dirty
    const arrayField = this.field(arrayPath)
    arrayField.isDirty(true)

    this.triggerDataUpdate()
  }

  async arrayMove(arrayPath: string, fromIndex: number, toIndex: number): Promise<void> {
    // Clean up all errors for this array to force fresh validation
    this.cleanupArrayMoveErrors(arrayPath)

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

    // Mark array field as dirty
    const arrayField = this.field(arrayPath)
    arrayField.isDirty(true)

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

    // Form isTouched is now computed from field states
  }

  // Internal helper methods

  /**
   * Clean up errors when removing array items
   */
  private cleanupArrayErrors(arrayPath: string, removeIndex: number, arrayLength: number): void {
    const arrayPathPrefix = `${arrayPath}.`
    const updatedErrors: Record<string, string[]> = {}

    Object.keys(this.errors).forEach(errorPath => {
      if (errorPath.startsWith(arrayPathPrefix)) {
        const relativePath = errorPath.substring(arrayPathPrefix.length)
        const firstDotIndex = relativePath.indexOf('.')

        if (firstDotIndex > 0) {
          const indexStr = relativePath.substring(0, firstDotIndex)
          const subPath = relativePath.substring(firstDotIndex + 1)
          const errorIndex = parseInt(indexStr, 10)

          if (!isNaN(errorIndex)) {
            if (errorIndex < removeIndex) {
              // Keep errors for items before the removed index
              updatedErrors[errorPath] = this.errors[errorPath]
            } else if (errorIndex > removeIndex) {
              // Shift errors for items after the removed index down by 1
              const newPath = `${arrayPath}.${errorIndex - 1}.${subPath}`
              updatedErrors[newPath] = this.errors[errorPath]
            }
            // errorIndex === removeIndex: delete this error (removed item)
          }
        }
      } else {
        // Keep non-array errors as-is
        updatedErrors[errorPath] = this.errors[errorPath]
      }
    })

    this.errors = updatedErrors
    this.errorsChanged(this.errorsChanged() + 1)
  }

  /**
   * Clean up errors when moving array items (clear all errors for the array to force revalidation)
   */
  private cleanupArrayMoveErrors(arrayPath: string): void {
    const arrayPathPrefix = `${arrayPath}.`
    const updatedErrors: Record<string, string[]> = {}

    Object.keys(this.errors).forEach(errorPath => {
      if (!errorPath.startsWith(arrayPathPrefix)) {
        // Keep non-array errors as-is
        updatedErrors[errorPath] = this.errors[errorPath]
      }
      // Remove all array errors - they will be recreated during revalidation
    })

    this.errors = updatedErrors
    this.errorsChanged(this.errorsChanged() + 1)
  }

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
   * Trigger data update (to notify computed values)
   */
  triggerDataUpdate(): void {
    this.dataChanged(this.dataChanged() + 1)
  }


}