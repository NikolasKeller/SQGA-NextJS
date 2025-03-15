import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { testSectionExtraction } from '@/lib/pdf-section-test';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const keyword = formData.get('keyword') as string;
    
    if (!file || !keyword) {
      return NextResponse.json({ 
        error: 'Datei und Keyword sind erforderlich' 
      }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extrahiere Text aus der PDF
    const pdfText = await extractTextFromPDF(buffer);
    
    // Teste die Abschnittserkennung
    const extractedSection = await testSectionExtraction(pdfText, keyword);
    
    return NextResponse.json({
      keyword,
      extractedSection,
      success: true
    });
    
  } catch (error) {
    console.error('Fehler beim Testen:', error);
    return NextResponse.json({ 
      error: 'Fehler beim Testen',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      success: false 
    }, { status: 500 });
  }
} 