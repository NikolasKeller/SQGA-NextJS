import { NextRequest, NextResponse } from 'next/server'
import { processPDF } from '@/lib/pdfUtils'
import { extractTextFromPDF, extractStructuredContent } from '@/lib/pdf-utils'
import { findRelevantContext } from '@/lib/search-utils'

interface Section {
  title: string;
  content: string;
  level: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const query = formData.get('query') as string;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'Keine Datei gefunden', 
        success: false 
      }, { status: 400 });
    }
    
    if (!query) {
      return NextResponse.json({ 
        error: 'Keine Anfrage gefunden', 
        success: false 
      }, { status: 400 });
    }
    
    // Datei-Informationen
    const fileInfo = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      success: true
    };
    
    try {
      // Extrahiere Text aus der PDF
      const pdfText = await extractTextFromPDF(file);
      
      // Extrahiere strukturierten Inhalt
      const sections = extractStructuredContent(pdfText);
      
      // Finde relevanten Kontext basierend auf der Anfrage
      const relevantContext = findRelevantContext(query, sections);
      
      return NextResponse.json({
        ...fileInfo,
        pdfText,
        relevantContext,
        success: true
      });
      
    } catch (error) {
      console.error('Fehler bei der Verarbeitung:', error);
      
      return NextResponse.json({ 
        ...fileInfo,
        error: 'Fehler bei der Verarbeitung',
        details: error instanceof Error ? error.message : 'Unbekannter Fehler',
        success: false 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Fehler bei der Formular-Verarbeitung:', error);
    return NextResponse.json({ 
      error: 'Fehler bei der Formular-Verarbeitung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      success: false 
    }, { status: 500 });
  }
}

// Hilfsfunktion zum Formatieren von Text
function formatText(text: string): string {
  // Entferne übermäßige Leerzeichen und Zeilenumbrüche
  let formattedText = text.replace(/\s+/g, ' ').trim();
  
  // Füge Zeilenumbrüche an sinnvollen Stellen ein
  formattedText = formattedText.replace(/\. /g, '.\n');
  
  return formattedText;
}

// Hilfsfunktion zum Umbrechen von Text
function wrapText(text: string, maxLineLength: number = 80): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLineLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

function extractRelevantSection(pdfText: string, keyword: string): string {
  // Teile den Text in Zeilen
  const lines = pdfText.split('\n');
  
  // Finde die Zeile mit dem Keyword
  let keywordLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(keyword)) {
      keywordLineIndex = i;
      console.log('Keyword gefunden in Zeile:', i);
      break;
    }
  }
  
  if (keywordLineIndex === -1) {
    console.log('Keyword nicht gefunden');
    return '';
  }

  // Liste bekannter Überschriften
  const knownHeadings = [
    'Prozessdatenschnittstellen / –aufzeichnung',
    'Wärmerückgewinnung (WRG) ECO-HEAT',
    'Anlagensteuerung und Automatisierung',
    'Montage- / Inbetriebnahmekosten',
    'Auslass Spannrahmen',
    'Steuerung und Visualisierung'
  ];

  // Suche rückwärts nach der letzten Überschrift
  let startIndex = -1;
  for (let i = keywordLineIndex; i >= 0; i--) {
    if (knownHeadings.some(heading => lines[i].includes(heading))) {
      startIndex = i;
      console.log('Start-Überschrift gefunden:', lines[i]);
      break;
    }
  }

  // Suche vorwärts nach der nächsten Überschrift
  let endIndex = -1;
  for (let i = keywordLineIndex + 1; i < lines.length; i++) {
    if (knownHeadings.some(heading => lines[i].includes(heading))) {
      endIndex = i;
      console.log('End-Überschrift gefunden:', lines[i]);
      break;
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    console.log('Keine umschließenden Überschriften gefunden');
    return '';
  }

  // Extrahiere den Text zwischen den Überschriften
  const relevantText = lines.slice(startIndex, endIndex).join('\n').trim();
  console.log('Extrahierter Text:', relevantText);
  
  return relevantText;
}

function containsBoldText(line: string): boolean {
  // Prüfe auf typische Merkmale von Fettdruck in PDFs:
  // 1. Wiederholte Zeichen direkt hintereinander
  // 2. Großgeschriebene Wörter mit bestimmten Formatierungen
  // 3. Spezielle Überschriften-Patterns
  
  // Entferne Zahlen und Sonderzeichen für die Prüfung
  const cleanLine = line.trim().replace(/[\d\.\-\/\(\)]/g, '').trim();
  
  return (
    // Prüfe auf Überschriften-Format
    /^[A-Z][A-Z\s]+$/.test(cleanLine) || // Komplett großgeschriebene Wörter
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*(?:\/|und)\s+[A-Z][a-z]+/.test(line) || // Format wie "Montage- / Inbetriebnahmekosten"
    line.includes('ECO-HEAT') || // Spezielle Keywords
    /^[A-Z][A-Z\s\-]+(?:\s*\/\s*[–A-Z\s\-]+)?$/.test(line) // Prozessdatenschnittstellen / -aufzeichnung Format
  );
}

// OPTIONS-Handler für CORS-Preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 })
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:3001')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  return response
} 