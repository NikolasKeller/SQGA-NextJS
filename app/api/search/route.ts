import { NextRequest, NextResponse } from 'next/server'
import { searchInPDF } from '@/lib/pdfUtils'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Keine Suchanfrage' },
        { status: 400 }
      )
    }

    const results = await searchInPDF(query)
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Suchfehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 