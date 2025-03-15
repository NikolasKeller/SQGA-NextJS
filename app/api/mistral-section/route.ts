import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Mistral API-Key aus der Umgebungsvariable oder direkt (für Testzwecke)
const apiKey = process.env.MISTRAL_API_KEY || 'PxyFNvjueT8sBG5WwNegHYcRezgHNrn3';
const client = new Mistral({ apiKey });

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { ocrId, keyword } = data;
    
    if (!ocrId || !keyword) {
      return NextResponse.json({ 
        error: 'OCR-ID und Keyword sind erforderlich', 
        success: false 
      }, { status: 400 });
    }
    
    // Frage Mistral nach dem spezifischen Abschnitt
    const chatResponse = await client.chat({
      model: "mistral-large-latest",
      messages: [
        {
          role: "system",
          content: `Du bist ein Assistent, der Abschnitte aus OCR-verarbeiteten Dokumenten extrahiert. 
          Deine Aufgabe ist es, den Abschnitt zu finden, der am besten zum angegebenen Keyword passt.
          Extrahiere den vollständigen Abschnitt, der mit der Überschrift beginnt, die das Keyword enthält, 
          und mit der nächsten Überschrift endet. Gib nur den extrahierten Text zurück, ohne zusätzliche Erklärungen.`
        },
        {
          role: "user",
          content: `Extrahiere den Abschnitt zum Thema "${keyword}" aus dem OCR-verarbeiteten Dokument mit der ID ${ocrId}.`
        }
      ]
    });
    
    const extractedSection = chatResponse.choices[0].message.content;
    
    // Erfolgreiche Antwort mit dem extrahierten Abschnitt
    return NextResponse.json({
      section: extractedSection,
      keyword,
      success: true
    });
    
  } catch (error) {
    console.error('Fehler bei der Abschnittserkennung:', error);
    return NextResponse.json({ 
      error: 'Fehler bei der Abschnittserkennung',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      success: false 
    }, { status: 500 });
  }
} 