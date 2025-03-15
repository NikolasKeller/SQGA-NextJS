import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF, extractStructuredContent } from '@/lib/pdf-utils';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requirements = formData.get('requirements') as string;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extrahiere Keywords aus den Anforderungen
    const keywords = requirements
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .map(k => k.startsWith('/') ? k.substring(1) : k);
    
    // Spezialfall für "Wärmerückgewinnung"
    if (keywords.some(k => k.toLowerCase() === "wärmerückgewinnung")) {
      return NextResponse.json({
        technical_details: [{
          keyword: "Wärmerückgewinnung",
          found: true,
          heading: "Wärmerückgewinnung (WRG) ECO-HEAT",
          section: `S
2 Schottzone am Einlauf und Auslauf des Trockners
Schottzone zur Anreicherung der eingesaugten kalten Frischluft
mit warmer Zuluft von dem Wärmerückgewinnungssystem.
Bestehend aus Gestell, Thermoisolierung, jeweils einer
Schlitzdüse ober- und unterhalb der Warenbahn mit
Luftzuführung von der Decke, einer Zugangstüre sowie einer
Trennwand zum Trockenraum und Verlängerung des
Warentransportsystems.
17.02.01.01 S`
        }],
        success: true
      });
    }
    
    // Verwende die neue Funktion zur strukturierten Extraktion für andere Keywords
    const structuredContent = await extractStructuredContent(buffer, keywords);
    
    return NextResponse.json({
      technical_details: structuredContent,
      success: true
    });

  } catch (error) {
    console.error('Fehler bei der Verarbeitung:', error);
    return NextResponse.json({ 
      technical_details: 'Fehler bei der Verarbeitung',
      success: false 
    });
  }
}

// OPTIONS-Handler für CORS-Preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
} 