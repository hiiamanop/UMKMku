import { z } from 'zod'
import { SkincareDataSchema, type SkincareData, skincareSystemPrompt } from './skincare'
import { ParfumDataSchema, type ParfumData, parfumSystemPrompt } from './parfum'
import { FashionDataSchema, type FashionData, fashionSystemPrompt } from './fashion'
import { FDBDataSchema, type FDBData, fdbSystemPrompt } from './fdb'

// Re-export all schemas and types
export { SkincareDataSchema, type SkincareData }
export { ParfumDataSchema, type ParfumData }
export { FashionDataSchema, type FashionData }
export { FDBDataSchema, type FDBData }

// Union types for convenience
export type CategoryData = SkincareData | ParfumData | FashionData | FDBData
export type CategoryType = 'skincare' | 'parfum' | 'fashion' | 'fdb'

// Map category to schema
const categorySchemaMap = {
  skincare: SkincareDataSchema,
  parfum: ParfumDataSchema,
  fashion: FashionDataSchema,
  fdb: FDBDataSchema,
} as const

// Map category to system prompt
const categoryPromptMap = {
  skincare: skincareSystemPrompt,
  parfum: parfumSystemPrompt,
  fashion: fashionSystemPrompt,
  fdb: fdbSystemPrompt,
} as const

/**
 * Validates category-specific product data
 * @param category - The category type
 * @param data - The data to validate
 * @returns SafeParseResult with success flag and either data or error
 */
export function validateCategoryData(
  category: CategoryType,
  data: unknown
): any {
  const schema = categorySchemaMap[category]
  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: `Unknown category: ${category}`,
          path: [],
        },
      ]),
    }
  }
  return schema.safeParse(data)
}

/**
 * Gets the system prompt for a category with variable substitution
 * @param category - The category type
 * @param vars - Object with template variables (brand_name, description, products_json)
 * @returns Formatted system prompt string
 */
export function getCategorySystemPrompt(
  category: CategoryType,
  vars: {
    brand_name: string
    description: string
    products_json: string
  }
): string {
  const template = categoryPromptMap[category]
  if (!template) {
    throw new Error(`Unknown category: ${category}`)
  }

  return template
    .replace('{brand_name}', vars.brand_name)
    .replace('{description}', vars.description)
    .replace('{products_json}', vars.products_json)
}
