/**
 * Adapter index file
 * Note: This file should NOT be imported directly to maintain tree-shaking
 * Each adapter should be imported from its specific entry point
 */

// This file exists for internal organization only
// Consumers should use:
// - import { ZodValidatorAdapter } from '@encolajs/form-controller/zod'
// - import { YupValidatorAdapter } from '@encolajs/form-controller/yup'
// - import { ValibotValidatorAdapter } from '@encolajs/form-controller/valibot'

export { ZodValidatorAdapter, createZodAdapter } from './ZodValidatorAdapter'
export { YupValidatorAdapter, createYupAdapter } from './YupValidatorAdapter'
export { ValibotValidatorAdapter, createValibotAdapter } from './ValibotValidatorAdapter'