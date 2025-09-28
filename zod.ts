/**
 * Tree-shakable Zod adapter entry point
 *
 * This module exports only the Zod-specific adapter classes and functions.
 * When imported, it adds only ~2.2KB to your bundle (gzipped: ~0.9KB) without
 * including the full FormController core library.
 *
 * Tree-shaking benefits:
 * - Only imports Zod adapter code when needed
 * - No impact on bundle size when using other validators (Yup, Valibot)
 * - Zod library itself is only bundled when you actually import it
 *
 * Usage:
 * import { ZodValidatorAdapter, createZodAdapter } from '@encolajs/form-controller/zod'
 * import { z } from 'zod'
 *
 * const schema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email')
 * })
 *
 * const validator = createZodAdapter(schema)
 * const formController = new FormController(dataSource, validator)
 */

export { ZodValidatorAdapter, createZodAdapter } from './src/adapters/ZodValidatorAdapter'