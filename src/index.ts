// Main exports for @encolajs/form-controller
import type { DataSource, IFormValidator } from '@/types.ts'
import { FormController } from './form-controller'

export * from './types'
export { FormController } from './form-controller'
export * from './data-sources'
export * from './validators'

// Re-export alien-signals for convenience
export { signal, computed, effect } from 'alien-signals'

export default function createForm(
  dataSource: DataSource,
  validator?: IFormValidator
): FormController {
  return new FormController(dataSource, validator)
}
