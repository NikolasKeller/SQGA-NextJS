import { NextRequest, NextResponse } from 'next/server';
import { MistralAI } from '@mistralai/mistralai';

// Mistral API-Key aus der Umgebungsvariable
const apiKey = process.env.MISTRAL_API_KEY || 'PxyFNvjueT8sBG5WwNegHYcRezgHNrn3';
const client = new MistralAI({ apiKey });

export async function GET(request: NextRequest) {
  try {
    // Einfacher Chat-Test
    const chatResponse = await client.chat({
      model: "mistral-small-latest",
      messages: [
        {
          role: "user",
          content: "Hallo, wie geht es dir?"
        }
      ]
    });
    
    return NextResponse.json({
      response: chatResponse.choices[0].message.content,
      success: true
    });
    
  } catch (error) {
    console.error('Fehler bei der Mistral-Anfrage:', error);
    return NextResponse.json({ 
      error: 'Fehler bei der Mistral-Anfrage',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      success: false 
    }, { status: 500 });
  }
} 