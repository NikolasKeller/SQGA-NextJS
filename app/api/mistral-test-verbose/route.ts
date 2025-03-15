import { NextRequest, NextResponse } from 'next/server';

// Mistral API-Key aus der Umgebungsvariable
const apiKey = process.env.MISTRAL_API_KEY || 'PxyFNvjueT8sBG5WwNegHYcRezgHNrn3';

export async function GET(request: NextRequest) {
  try {
    console.log("Starte Mistral-API-Test");
    console.log("API-Key (erste 5 Zeichen):", apiKey.substring(0, 5) + "...");
    
    // Einfacher Test mit der Mistral-API
    const response = await fetch('https://api.mistral.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Antwort-Status:", response.status, response.statusText);
    
    // Überprüfe die Antwort
    const responseText = await response.text();
    console.log("Antwort-Text:", responseText.substring(0, 100) + "...");
    
    if (!response.ok) {
      console.error("Fehler bei der Mistral-Anfrage:", response.status, response.statusText);
      console.error("Antwort-Text:", responseText);
      
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
      console.log("Antwort erfolgreich geparst");
    } catch (parseError) {
      console.error("Fehler beim Parsen der Antwort:", parseError);
      
      return NextResponse.json({ 
        error: 'Fehler beim Parsen der Antwort',
        responseText,
        parseError: parseError instanceof Error ? parseError.message : 'Unbekannter Fehler',
        success: false 
      }, { status: 500 });
    }
    
    console.log("Test erfolgreich abgeschlossen");
    
    return NextResponse.json({
      models: data,
      success: true
    });
    
  } catch (error) {
    console.error('Fehler bei der Mistral-Anfrage:', error);
    
    return NextResponse.json({ 
      error: 'Fehler bei der Mistral-Anfrage',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler',
      stack: error instanceof Error ? error.stack : 'Kein Stack-Trace verfügbar',
      success: false 
    }, { status: 500 });
  }
} 