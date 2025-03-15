import { z } from 'zod' // Für Typescript Validierung

export const PDFValidationSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.type === 'application/pdf',
    'Nur PDF-Dateien sind erlaubt'
  ).refine(
    (file) => file.size <= 100 * 1024 * 1024,
    'Maximale Dateigröße ist 100MB'
  )
})

export const SearchQuerySchema = z.object({
  query: z.string().min(3, 'Mindestens 3 Zeichen').max(500, 'Maximal 500 Zeichen'),
  topK: z.number().int().min(1).max(100).optional().default(3),
  minScore: z.number().min(0).max(1).optional().default(0.3)
})

export type SearchQueryInput = z.infer<typeof SearchQuerySchema>

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export async function validatePDFFile(file: File): Promise<void> {
  try {
    await PDFValidationSchema.parseAsync({ file })
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors[0].message)
    }
    throw error
  }
} 