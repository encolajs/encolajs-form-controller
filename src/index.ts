// Main exports for @encolajs/form-controller
export * from './types'
export { FormController } from './form-controller'
export * from './data-sources'
export * from './validators'
export * from './utils'

// Re-export alien-signals for convenience
export { signal, computed, effect } from 'alien-signals'
