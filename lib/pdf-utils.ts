import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { MistralClient } from '@mistralai/mistralai';

// Mistral API-Key aus der Umgebungsvariable
const apiKey = process.env.MISTRAL_API_KEY || '';

// Erstelle einen Mistral-Client
const mistralClient = new MistralClient(apiKey);

export interface Section {
  title: string;
  content: string;
  level: number;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Datei in ArrayBuffer umwandeln
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Temporäre Datei erstellen
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, file.name);
    await fs.writeFile(tempFilePath, buffer);
    
    console.log("Datei wird verarbeitet:", file.name, "Größe:", file.size);
    
    // Datei als Buffer lesen
    const fileBuffer = await fs.readFile(tempFilePath);
    
    // Verwende die offizielle Mistral-Bibliothek für OCR
    const ocrResult = await mistralClient.ocr({
      model: "mistral-large-latest",
      files: [fileBuffer],
    });
    
    // Temporäre Datei löschen
    await fs.unlink(tempFilePath);
    
    return ocrResult.text || '';
  } catch (error) {
    console.error('Fehler bei der PDF-Textextraktion:', error);
    throw new Error(`Fehler bei der PDF-Textextraktion: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}

export function extractStructuredContent(text: string): Section[] {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Heuristik für Überschriften
    const isPotentialHeading = 
      line.length > 0 && 
      line.length < 100 && 
      !line.match(/[.,:;]$/) && 
      !line.match(/^[0-9•\-*]/);
    
    const isFollowedByEmptyLine = i < lines.length - 1 && !lines[i + 1].trim();
    const hasCapitalLetters = /[A-Z]/.test(line);
    const isAllCaps = line === line.toUpperCase() && line.length > 3;
    
    if (isPotentialHeading && (isFollowedByEmptyLine || isAllCaps || hasCapitalLetters)) {
      // Bestimme die Ebene basierend auf verschiedenen Faktoren
      let level = 1;
      
      if (line.startsWith(' ') || line.startsWith('\t')) {
        level = 2;
      }
      
      if (line.length < 30) {
        level = Math.min(level + 1, 3);
      }
      
      if (isAllCaps) {
        level = 1;
      }
      
      // Speichere den vorherigen Abschnitt, wenn vorhanden
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Erstelle einen neuen Abschnitt
      currentSection = {
        title: line,
        content: '',
        level
      };
    } else if (currentSection) {
      // Füge die Zeile zum aktuellen Abschnitt hinzu
      currentSection.content += line + '\n';
    }
  }
  
  // Füge den letzten Abschnitt hinzu, wenn vorhanden
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
} 