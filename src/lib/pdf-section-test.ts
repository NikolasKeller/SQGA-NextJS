import { Anthropic } from '@anthropic-ai/sdk';

// Initialisiere den Anthropic-Client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Testet die Fähigkeit des LLM, Abschnitte zu einem Keyword zu identifizieren
 */
export async function testSectionExtraction(pdfText: string, keyword: string): Promise<string> {
  try {
    // Finde die Position des Keywords im Text
    const keywordPosition = pdfText.toLowerCase().indexOf(keyword.toLowerCase());
    
    if (keywordPosition === -1) {
      return `Keyword "${keyword}" nicht im Text gefunden.`;
    }
    
    // Extrahiere einen Kontext um das Keyword herum
    const contextStart = Math.max(0, keywordPosition - 2000);
    const contextEnd = Math.min(pdfText.length, keywordPosition + 2000);
    const context = pdfText.substring(contextStart, contextEnd);
    
    // Verwende Claude, um den relevanten Abschnitt zu identifizieren
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Ich habe einen Text aus einem technischen Dokument und suche nach dem Abschnitt, der das Keyword "${keyword}" beschreibt.

Hier ist ein Ausschnitt aus dem Dokument, der das Keyword enthält:

"""
${context}
"""

Bitte identifiziere den spezifischen Abschnitt, der das Keyword "${keyword}" beschreibt. Der Abschnitt sollte:
1. Mit einer Überschrift beginnen, die das Keyword enthält oder sich darauf bezieht
2. Den vollständigen Inhalt enthalten, der dieses Konzept beschreibt
3. Nicht zu lang sein (idealerweise nicht mehr als 10-15 Zeilen)

Gib nur den extrahierten Abschnitt zurück, ohne zusätzliche Erklärungen.`
      }]
    });
    
    return message.content[0].text;
    
  } catch (error) {
    console.error('Fehler beim Testen der Abschnittserkennung:', error);
    return `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
  }
} 