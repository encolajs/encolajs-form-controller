/**
 * Tree-shakable Valibot adapter entry point
 *
 * Usage:
 * import { ValibotValidatorAdapter, createValibotAdapter } from '@encolajs/form-controller/valibot'
 * import * as v from 'valibot'
 *
 * const schema = v.object({
 *   name: v.pipe(v.string(), v.minLength(1, 'Name is required')),
 *   email: v.pipe(v.string(), v.email('Invalid email'))
 * })
 *
 * const validator = createValibotAdapter(schema)
 * const formController = new FormController(dataSource, validator)
 */

export { ValibotValidatorAdapter, useValibotValidator } from './src/adapters/ValibotValidatorAdapter'