import { NextRequest, NextResponse } from 'next/server'
import { validatePDFFile } from '@/lib/validation'
import { PDFProcessor } from '@/lib/pdfProcessor'
import { SearchQuerySchema } from '@/lib/validation'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    // Validierung
    await validatePDFFile(file)
    
    // PDF verarbeiten
    const processor = new PDFProcessor()
    const result = await processor.processFile(file)
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unbekannter Fehler' },
      { status: 400 }
    )
  }
} 