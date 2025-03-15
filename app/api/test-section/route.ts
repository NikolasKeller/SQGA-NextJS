import { NextResponse } from 'next/server';
import * as pdfjs from 'pdfjs-dist';

// Stelle sicher, dass die Worker-Datei korrekt geladen wird
if (typeof window === 'undefined') {
  // Server-seitige Konfiguration
  const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.js');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
} else {
  // Client-seitige Konfiguration
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Einfache Funktion zum Extrahieren von Text aus einer PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const loadingTask = pdfjs.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(' ') + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Fehler beim Extrahieren des PDF-Texts:', error);
    throw error;
  }
}

// Einfache Funktion zum Extrahieren von Überschriften
function extractHeadings(text: string): { title: string; level: number; position: number }[] {
  const lines = text.split('\n');
  const headings = [];
  let position = 0;
  
  for (const line of lines) {
    // Einfache Heuristik für Überschriften
    const trimmedLine = line.trim();
    
    // Überschriften sind oft kurz, alleinstehend und haben spezielle Formatierung
    if (trimmedLine && trimmedLine.length < 100) {
      // Prüfe auf typische Überschriftenmerkmale
      const isNumbered = /^\d+(\.\d+)*\s+/.test(trimmedLine); // z.B. "1.2.3 Titel"
      const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3;
      const hasKeywords = /Wärmerückgewinnung|ECO-HEAT|Anlagensteuerung|Spezifikation|Technische Daten/i.test(trimmedLine);
      
      if (isNumbered || isAllCaps || hasKeywords) {
        // Bestimme die Ebene basierend auf Einrückung oder Nummerierung
        let level = 1;
        if (isNumbered) {
          const dotCount = (trimmedLine.match(/\./g) || []).length;
          level = Math.min(dotCount + 1, 3); // Maximal Ebene 3
        }
        
        headings.push({
          title: trimmedLine,
          level,
          position
        });
      }
    }
    
    position += line.length + 1; // +1 für den Zeilenumbruch
  }
  
  return headings;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'Datei ist erforderlich' 
      }, { status: 400 });
    }
    
    // Grundlegende Datei-Informationen
    const fileInfo = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
    
    // Simuliere einige Überschriften für Testzwecke
    const mockHeadings = [
      { title: "Einleitung", level: 1, position: 0 },
      { title: "Technische Spezifikationen", level: 1, position: 500 },
      { title: "Wärmerückgewinnung (WRG) ECO-HEAT", level: 2, position: 1000 },
      { title: "Anlagensteuerung", level: 2, position: 1500 },
      { title: "Garantie und Service", level: 1, position: 2000 }
    ];
    
    // Erfolgreiche Antwort mit simulierten Daten
    return NextResponse.json({
      ...fileInfo,
      pdfText: "Dies ist ein simulierter PDF-Text für Testzwecke. Die tatsächliche Extraktion wurde aufgrund technischer Probleme übersprungen.",
      tableOfContents: mockHeadings,
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