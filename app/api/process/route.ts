import { NextRequest, NextResponse } from 'next/server'
import { processPDF } from '@/lib/pdfUtils'
import { extractTextFromPDF, extractStructuredContent } from '@/lib/pdf-utils'
import { findRelevantContext } from '@/lib/search-utils'

interface Section {
  title: string;
  content: string;
  isBold: boolean;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requirements = formData.get('requirements') as string;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfText = await extractTextFromPDF(buffer);
    
    // Teile den Text in Sätze
    const sentences = pdfText.split(/(?<=[.!?])\s+(?=[A-Z])/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('Gefundene Sätze:', sentences.length); // Debug

    const keywords = requirements
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .map(k => k.startsWith('/') ? k.substring(1) : k);

    const allMatches = keywords.map(keyword => {
      // Finde die Indizes der Sätze, die das Keyword enthalten
      const matchingIndices = sentences.reduce((acc, sentence, index) => {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
          acc.push(index);
        }
        return acc;
      }, [] as number[]);

      if (matchingIndices.length === 0) {
        return `Keine Treffer für: "${keyword}"`;
      }

      // Für jeden Fund hole den erweiterten Kontext
      return matchingIndices.map(matchIndex => {
        // Hole 2 Sätze vor und nach dem Match
        const contextSize = 2;
        const startIndex = Math.max(0, matchIndex - contextSize);
        const endIndex = Math.min(sentences.length, matchIndex + contextSize + 1);
        
        // Extrahiere den Kontext
        const contextSentences = sentences.slice(startIndex, endIndex);
        
        // Finde die nächstgelegene Überschrift
        let title = "Abschnitt";
        for (let i = matchIndex; i >= 0; i--) {
          if (sentences[i].match(/^\d+\.?\s+[A-Z]/)) {
            title = sentences[i];
            break;
          }
        }

        // Formatiere den Kontext und markiere das Keyword
        const context = contextSentences.map(sentence => {
          if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
            // Markiere das Keyword im Satz
            return sentence.replace(new RegExp(`(${keyword})`, 'gi'), '**$1**');
          }
          return sentence;
        }).join(' ');
        
        return `Keyword: "${keyword}"\n\nAbschnitt: ${title}\n\n${formatText(context, 80)}`;
      }).join('\n\n---\n\n');
    });

    return NextResponse.json({
      technical_details: allMatches.join('\n\n'),
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

function formatText(text: string, maxLength: number): string {
  // Teile den Text in Wörter
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).length <= maxLength) {
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