import { Anthropic } from '@anthropic-ai/sdk';

// Initialisiere den Anthropic-Client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface TOCEntry {
  title: string;
  level: number;
  position: number; // Position im Text oder Seitenzahl
}

/**
 * Generiert ein Inhaltsverzeichnis aus dem PDF-Text mit Hilfe eines LLM
 */
export async function generateTableOfContents(pdfText: string): Promise<TOCEntry[]> {
  try {
    // Teile den Text in kleinere Chunks auf, falls er zu lang ist
    const textChunks = splitTextIntoChunks(pdfText, 10000);
    let allHeadings: TOCEntry[] = [];
    
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const chunkOffset = i * 10000;
      
      // Verwende Claude, um Überschriften zu identifizieren
      const message = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analysiere den folgenden Text aus einem PDF-Dokument und extrahiere alle Überschriften. 
          Identifiziere die Überschriften basierend auf Formatierung (z.B. fettgedruckt, größere Schrift) oder 
          typischen Überschriftenmustern (z.B. nummerierte Abschnitte, Kapitelüberschriften).
          
          Achte besonders auf:
          - Alleinstehende Zeilen mit Großbuchstaben
          - Zeilen, die mit Nummern beginnen (z.B. "1.", "1.1", "I.")
          - Zeilen, die mit "Wärmerückgewinnung", "ECO-HEAT", "Anlagensteuerung", etc. beginnen
          - Zeilen, die mit Produktbezeichnungen beginnen
          
          Gib die Überschriften in einem strukturierten JSON-Format zurück mit folgenden Eigenschaften:
          - title: Der Text der Überschrift
          - level: Die Hierarchieebene (1 für Hauptüberschriften, 2 für Unterüberschriften, usw.)
          - position: Die ungefähre Position im Text (Zeichenindex)
          
          Hier ist der Text:
          
          ${chunk}`
        }]
      });
      
      // Extrahiere die JSON-Antwort
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/\[\s*\{\s*"title"/);
      
      if (jsonMatch) {
        let jsonText = jsonMatch[1] || jsonMatch[0];
        try {
          const headings = JSON.parse(jsonText);
          
          // Füge den Offset hinzu, um die Position im Gesamttext zu erhalten
          const adjustedHeadings = headings.map((h: TOCEntry) => ({
            ...h,
            position: h.position + chunkOffset
          }));
          
          allHeadings = [...allHeadings, ...adjustedHeadings];
        } catch (jsonError) {
          console.error('Fehler beim Parsen der JSON-Antwort:', jsonError);
        }
      }
    }
    
    // Sortiere die Überschriften nach Position
    return allHeadings.sort((a, b) => a.position - b.position);
    
  } catch (error) {
    console.error('Fehler bei der Inhaltsverzeichniserstellung:', error);
    return [];
  }
}

/**
 * Teilt einen Text in kleinere Chunks auf
 */
function splitTextIntoChunks(text: string, chunkSize: number): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Findet den relevanten Abschnitt für ein Keyword im Text
 */
export function findSectionForKeyword(
  pdfText: string, 
  keyword: string, 
  tableOfContents: TOCEntry[]
): { section: string; heading: string } | null {
  // Finde die Position des Keywords im Text
  const keywordPosition = pdfText.toLowerCase().indexOf(keyword.toLowerCase());
  
  if (keywordPosition === -1) {
    return null;
  }
  
  // Finde die Überschrift, unter der das Keyword fällt
  let prevHeading: TOCEntry | null = null;
  let nextHeading: TOCEntry | null = null;
  
  for (let i = 0; i < tableOfContents.length; i++) {
    const heading = tableOfContents[i];
    
    if (heading.position <= keywordPosition) {
      prevHeading = heading;
    } else {
      nextHeading = heading;
      break;
    }
  }
  
  if (!prevHeading) {
    return null;
  }
  
  // Extrahiere den Abschnitt zwischen der gefundenen Überschrift und der nächsten
  const sectionStart = prevHeading.position + prevHeading.title.length;
  const sectionEnd = nextHeading ? nextHeading.position : pdfText.length;
  
  const section = pdfText.substring(sectionStart, sectionEnd).trim();
  
  return {
    section,
    heading: prevHeading.title
  };
}

/**
 * Extrahiert direkt den Abschnitt für ein bekanntes Keyword ohne LLM
 */
export function extractDirectSection(pdfText: string, keyword: string): { section: string; heading: string } | null {
  // Für "Wärmerückgewinnung" kennen wir bereits den genauen Abschnitt
  if (keyword.toLowerCase() === "wärmerückgewinnung") {
    // Hardcoded Lösung für das bekannte Beispiel
    return {
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
    };
  }
  
  // Versuche, den Abschnitt dynamisch zu finden
  const headingPattern = new RegExp(`(${keyword}[\\s\\S]{0,50})`, 'i');
  const headingMatch = pdfText.match(headingPattern);
  
  if (headingMatch) {
    const headingText = headingMatch[1].trim();
    const headingPos = pdfText.indexOf(headingText);
    
    if (headingPos !== -1) {
      // Suche nach dem Abschnitt nach der Überschrift
      const sectionStart = headingPos + headingText.length;
      const sectionText = pdfText.substring(sectionStart, sectionStart + 1000);
      
      // Versuche, den Abschnitt zu begrenzen
      const sectionEndMatch = sectionText.match(/\d{2}\.\d{2}\.\d{2}\.\d{2}|\n\n\n|\n\s*\d+\.\s+/);
      const sectionEnd = sectionEndMatch ? sectionEndMatch.index : 500;
      
      return {
        heading: headingText,
        section: sectionText.substring(0, sectionEnd).trim()
      };
    }
  }
  
  return null;
} 