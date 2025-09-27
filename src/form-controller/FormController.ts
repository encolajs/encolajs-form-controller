import { signal, computed } from 'alien-signals'
import type {
  DataSource,
  FormValidator,
  IFieldController,
  IFormController,
  FormSetValueOptions,
  Signal,
  ISignal
} from '../types'
import { PlainObjectDataSource } from '../data-sources/PlainObjectDataSource'
import { NoopValidator } from '../validators/NoopValidator'

/**
 * Field controller implementation using alien-signals
 */
class FieldController implements IFieldController {
  readonly value: ISignal<unknown>
  readonly isDirty: Signal<boolean>
  readonly isTouched: Signal<boolean>
  readonly isValidating: Signal<boolean>
  readonly isValid: ISignal<boolean>
  readonly errors: ISignal<string[]>

  private formController: FormController
  private path: string

  constructor(formController: FormController, path: string) {
    this.formController = formController
    this.path = path

    // Computed value from data source
    this.value = computed(() => this.formController.getDataSource().get(this.path)) as ISignal<unknown>

    // Individual field state signals
    this.isDirty = signal(false)
    this.isTouched = signal(false)
    this.isValidating = signal(false)

    // Computed field errors from form controller
    this.errors = computed(() => {
      const formErrors = this.formController.getErrors()
      return formErrors[this.path] || []
    }) as ISignal<string[]>

    // Computed field validity
    this.isValid = computed(() => this.errors().length === 0) as ISignal<boolean>
  }

  async setValue(value: unknown, options: FormSetValueOptions = {}): Promise<void> {
    const {
      validate = true,
      touch = true,
      dirty = true
    } = options

    // Update the data source
    this.formController.getDataSource().set(this.path, value)

    // Trigger data source reactivity
    this.formController.triggerDataUpdate()

    // Update field state
    if (dirty) {
      this.isDirty(true)
      this.formController.setDirty(true)
    }

    if (touch) {
      this.isTouched(true)
      this.formController.setTouched(true)
    }

    // Validate if requested
    if (validate) {
      await this.validate()
    }
  }

  getValue(): unknown {
    return this.formController.getDataSource().get(this.path)
  }

  async validate(): Promise<boolean> {
    this.isValidating(true)

    try {
      const validator = this.formController.getValidator()
      const dataSource = this.formController.getDataSource()
      const errors = await validator.validateField(this.path, dataSource)

      // Update form-level errors
      this.formController.setFieldErrors(this.path, errors)

      return errors.length === 0
    } catch (error) {
      console.error(`[FormController] Error validating field ${this.path}:`, error)
      return false
    } finally {
      this.isValidating(false)
    }
  }

  setErrors(errors: string[]): void {
    this.formController.setFieldErrors(this.path, errors)
  }

  reset(): void {
    this.isDirty(false)
    this.isTouched(false)
    this.isValidating(false)
  }
}

/**
 * Main FormController implementation using alien-signals for reactivity
 */
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
  private fieldControllers: Map<string, IFieldController> = new Map()
  private dataSignal: Signal<Record<string, unknown>>
  private errorsSignal: Signal<Record<string, string[]>>

  constructor(dataSource: DataSource, validator?: FormValidator) {
    this.dataSource = dataSource
    this.initialDataSource = dataSource.clone() // Keep initial state for reset
    this.validator = validator || new NoopValidator()

    // Initialize reactive signals
    this.isSubmitting = signal(false)
    this.isValidating = signal(false)
    this.isDirty = signal(false)
    this.isTouched = signal(false)

    // Data and errors signals for triggering reactivity
    this.dataSignal = signal(this.dataSource.all())
    this.errorsSignal = signal({})

    // Computed form validity
    this.isValid = computed(() => {
      const errors = this.errorsSignal()
      return Object.keys(errors).length === 0
    }) as ISignal<boolean>
  }

  field(path: string): IFieldController {
    // Cache field controllers to maintain signal consistency
    if (!this.fieldControllers.has(path)) {
      const fieldController = new FieldController(this, path)
      this.fieldControllers.set(path, fieldController)
    }

    return this.fieldControllers.get(path)!
  }

  getValues(): Record<string, unknown> {
    return this.dataSource.all()
  }

  async validate(): Promise<boolean> {
    this.isValidating(true)

    try {
      const errors = await this.validator.validate(this.dataSource)

      this.errorsSignal(errors)

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
    this.errorsSignal({})

    // Reset all field controllers
    this.fieldControllers.forEach(field => field.reset())

    // Trigger data update
    this.triggerDataUpdate()
  }

  destroy(): void {
    // Clean up field controllers
    this.fieldControllers.clear()

    // Clear any ongoing operations
    this.isSubmitting(false)
    this.isValidating(false)
  }

  // Array operations
  arrayAdd(arrayPath: string, item: unknown, index?: number): void {
    if (index !== undefined) {
      this.dataSource.arrayInsert(arrayPath, index, item)
    } else {
      this.dataSource.arrayPush(arrayPath, item)
    }

    this.isDirty(true)
    this.triggerDataUpdate()
  }

  arrayRemove(arrayPath: string, index: number): void {
    this.dataSource.arrayRemove(arrayPath, index)
    this.isDirty(true)
    this.triggerDataUpdate()
  }

  arrayMove(arrayPath: string, fromIndex: number, toIndex: number): void {
    this.dataSource.arrayMove(arrayPath, fromIndex, toIndex)
    this.isDirty(true)
    this.triggerDataUpdate()
  }

  setErrors(errors: Record<string, string[]>): void {
    this.errorsSignal({ ...errors })

    // Mark affected fields as touched
    Object.keys(errors).forEach(path => {
      const field = this.field(path)
      if (field instanceof FieldController) {
        field.isTouched(true)
      }
    })

    this.setTouched(true)
  }

  // Internal helper methods

  /**
   * Get the data source (for field controllers)
   */
  getDataSource(): DataSource {
    return this.dataSource
  }

  /**
   * Get the validator (for field controllers)
   */
  getValidator(): FormValidator {
    return this.validator
  }

  /**
   * Get current errors state
   */
  getErrors(): Record<string, string[]> {
    return this.errorsSignal()
  }

  /**
   * Set errors for a specific field
   */
  setFieldErrors(path: string, errors: string[]): void {
    const currentErrors = { ...this.errorsSignal() }

    if (errors.length > 0) {
      currentErrors[path] = errors
    } else {
      delete currentErrors[path]
    }

    this.errorsSignal(currentErrors)
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
    this.dataSignal(this.dataSource.all())
  }

}