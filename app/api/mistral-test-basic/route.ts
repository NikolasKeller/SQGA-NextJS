import { NextRequest, NextResponse } from 'next/server';

// Mistral API-Key aus der Umgebungsvariable
const apiKey = process.env.MISTRAL_API_KEY || 'PxyFNvjueT8sBG5WwNegHYcRezgHNrn3';

export async function GET(request: NextRequest) {
  try {
    // Einfacher Test mit der Mistral-API
    const response = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    // Überprüfe die Antwort
    const responseText = await response.text();
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Fehler bei der Mistral-Anfrage',
        status: response.status,
        statusText: response.statusText,
        responseText,
        success: false 
      }, { status: 500 });
    }
    
    // Versuche, die Antwort als JSON zu parsen
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      return NextResponse.json({ 
        error: 'Fehler beim Parsen der Antwort',
        responseText,
        success: false 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      models: data,
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