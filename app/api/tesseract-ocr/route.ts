import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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
      
      // Temporäre Datei erstellen
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, file.name);
      await fs.writeFile(tempFilePath, buffer);
      
      console.log("Datei wird verarbeitet:", file.name, "Größe:", file.size);
      
      // Tesseract Worker erstellen
      const worker = await createWorker('deu');
      
      // OCR durchführen
      const { data } = await worker.recognize(tempFilePath);
      
      // Worker beenden
      await worker.terminate();
      
      // Temporäre Datei löschen
      await fs.unlink(tempFilePath);
      
      console.log("OCR-Verarbeitung abgeschlossen, Text extrahiert:", data.text.substring(0, 100) + "...");
      
      // Extrahiere Überschriften aus dem Text
      const tableOfContents = extractHeadingsFromText(data.text);
      
      return NextResponse.json({
        ...fileInfo,
        pdfText: data.text,
        tableOfContents,
        success: true
      });
      
    } catch (error) {
      console.error('Fehler bei der OCR-Verarbeitung:', error);
      
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

// Verbesserte Überschriftenerkennung
function extractHeadingsFromText(text: string) {
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