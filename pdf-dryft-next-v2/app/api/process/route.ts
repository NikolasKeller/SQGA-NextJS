import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF } from '@/lib/pdfExtractor'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei im Request' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Nur PDF-Dateien sind erlaubt' },
        { status: 400 }
      )
    }

    const text = await extractTextFromPDF(file)
    return NextResponse.json({ text })
    
  } catch (error) {
    console.error('Fehler bei der Verarbeitung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 