import { NextRequest, NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

// Mistral API-Key aus der Umgebungsvariable
const apiKey = process.env.MISTRAL_API_KEY || 'PxyFNvjueT8sBG5WwNegHYcRezgHNrn3';
const client = new Mistral(apiKey);

export async function GET(request: NextRequest) {
  try {
    // Überprüfe, was der Client tatsächlich ist
    console.log("Client-Typ:", typeof client);
    console.log("Client-Eigenschaften:", Object.getOwnPropertyNames(client));
    
    // Versuche, die verfügbaren Modelle abzurufen
    const models = await client.listModels();
    
    return NextResponse.json({
      models,
      success: true
    });
    
  } catch (error) {
    console.error('Fehler bei der Mistral-Anfrage:', error);
    return NextResponse.json({ 
      error: 'Fehler bei der Mistral-Anfrage',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      clientType: typeof client,
      success: false 
    }, { status: 500 });
  }
} 