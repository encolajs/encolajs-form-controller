/**
 * Tree-shakable EncolaJS Validator adapter entry point
 *
 * Usage:
 * import { EncolaValidatorAdapter, createEncolaAdapter } from '@encolajs/form-controller/encola'
 * import { ValidatorFactory } from '@encolajs/validator'
 *
 * const factory = new ValidatorFactory()
 * const validator = factory.make({
 *   name: 'required|min_length:2',
 *   email: 'required|email'
 * })
 *
 * const adapter = createEncolaAdapter(validator)
 * const formController = new FormController(dataSource, adapter)
 */

export {
  EncolaValidatorAdapter,
  useEncolaValidator,
  createEncolaValidatorFromRules
} from './src/adapters/EncolaValidatorAdapter'