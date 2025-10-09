/**
 * Tree-shakable Yup adapter entry point
 *
 * Usage:
 * import { YupValidatorAdapter, createYupAdapter } from '@encolajs/form-controller/yup'
 * import * as yup from 'yup'
 *
 * const schema = yup.object({
 *   name: yup.string().required('Name is required'),
 *   email: yup.string().email('Invalid email').required('Email is required')
 * })
 *
 * const validator = createYupAdapter(schema)
 * const formController = new FormController(dataSource, validator)
 */

export { YupValidatorAdapter, useYupValidator } from './src/adapters/YupValidatorAdapter'