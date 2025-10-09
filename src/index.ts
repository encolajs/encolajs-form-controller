// Main exports for @encolajs/form-controller
import type { DataSource, FormValidator } from '@/types.ts'
import { FormController } from './form-controller'

export * from './types'
export { FormController } from './form-controller'
export * from './data-sources'
export * from './validators'

// Re-export alien-signals for convenience
export { signal, computed, effect } from 'alien-signals'

export default function useForm(
  dataSource: DataSource,
  validator?: FormValidator
): FormController {
  return new FormController(dataSource, validator)
}
