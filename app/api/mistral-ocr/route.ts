import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Mistral API-Key aus der Umgebungsvariable oder direkt (für Testzwecke)
const apiKey = process.env.MISTRAL_API_KEY || 'PxyFNvjueT8sBG5WwNegHYcRezgHNrn3';
const client = new Mistral({ apiKey });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ 
        error: 'Keine Datei gefunden', 
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
      // Datei in ArrayBuffer umwandeln
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      console.log("Datei wird hochgeladen:", file.name, "Größe:", file.size);
      
      // Datei zu Mistral hochladen
      const uploadedPdf = await client.files.upload({
        file: {
          fileName: file.name,
          content: buffer,
        },
        purpose: "ocr"
      });
      
      console.log("Datei hochgeladen:", uploadedPdf.id);
      
      // OCR-Verarbeitung starten
      console.log("Starte OCR-Verarbeitung für Datei:", uploadedPdf.id);
      
      // Überprüfe, welche Methoden verfügbar sind
      console.log("Verfügbare Methoden:", Object.keys(client));
      
      // Versuche, die OCR-Verarbeitung mit der korrekten Methode zu starten
      const ocrResponse = await client.ocrCompletions.create({
        model: "mistral-ocr-latest",
        document: {
          type: "file_id",
          fileId: uploadedPdf.id
        }
      });
      
      console.log("OCR-Verarbeitung abgeschlossen");
      
      // Extrahiere Text und Struktur aus der OCR-Antwort
      const extractedText = ocrResponse.text || "";
      
      // Extrahiere Überschriften und erstelle Inhaltsverzeichnis
      const tableOfContents = extractHeadingsFromOCR(ocrResponse);
      
      // Erfolgreiche Antwort mit allen Daten
      return NextResponse.json({
        ...fileInfo,
        pdfText: extractedText.substring(0, 1000), // Nur einen Auszug senden
        tableOfContents,
        ocrId: uploadedPdf.id, // Speichere die ID für spätere Abfragen
        success: true
      });
    } catch (uploadError) {
      console.error('Fehler bei der Mistral-Verarbeitung:', uploadError);
      return NextResponse.json({ 
        error: 'Fehler bei der Mistral-Verarbeitung',
        details: uploadError instanceof Error ? uploadError.message : 'Unbekannter Fehler',
        success: false,
        fileInfo // Sende trotzdem die Datei-Informationen zurück
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

// Verbesserte Überschriftenerkennung
function extractHeadingsFromOCR(ocrResponse: any) {
  const text = ocrResponse.text;
  const lines = text.split('\n');
  
  const headings = [];
  let position = 0;
  let currentText = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    currentText += line + '\n';
    
    // Verbesserte Heuristik für Überschriften
    const isPotentialHeading = 
      trimmedLine.length > 0 && 
      trimmedLine.length < 100 && 
      !trimmedLine.match(/[.,:;]$/) && 
      !trimmedLine.match(/^[0-9•\-*]/);
    
    // Zusätzliche Kriterien für Überschriften
    const isFollowedByEmptyLine = i < lines.length - 1 && lines[i + 1].trim() === '';
    const hasCapitalLetters = /[A-Z]/.test(trimmedLine);
    const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3;
    
    if (isPotentialHeading && (isFollowedByEmptyLine || isAllCaps || hasCapitalLetters)) {
      // Bestimme die Ebene basierend auf verschiedenen Faktoren
      let level = 1;
      
      // Wenn die Zeile eingerückt ist, könnte es eine Unterüberschrift sein
      if (line.startsWith(' ') || line.startsWith('\t')) {
        level = 2;
      }
      
      // Wenn die Zeile kürzer ist als die durchschnittliche Überschriftslänge
      if (trimmedLine.length < 30) {
        level = Math.min(level + 1, 3);
      }
      
      // Wenn die Zeile in Großbuchstaben ist, könnte es eine Hauptüberschrift sein
      if (isAllCaps) {
        level = 1;
      }
      
      headings.push({
        title: trimmedLine,
        level,
        position: currentText.length - line.length - 1
      });
    }
    
    position += line.length + 1;
  }
  
  return headings;
} 