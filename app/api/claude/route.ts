import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Cache für API-Antworten
const responseCache = new Map();

export async function POST(request: Request) {
  try {
    const { keyword, context } = await request.json();
    
    // Generate cache key
    const cacheKey = `${keyword}-${context.substring(0, 50)}`;
    
    // Check cache first
    if (responseCache.has(cacheKey)) {
      console.log('Returning cached response');
      return NextResponse.json({ result: responseCache.get(cacheKey) });
    }

    console.log('Making single API call...');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0, // Reduzierte Variabilität für konsistentere Antworten
      system: "You are a technical document analyzer specializing in industrial machinery and components. Focus on functional similarities when comparing terms.",
      messages: [{
        role: 'user',
        content: `Context: "${context}"

Task: Find terms that are functionally similar to "${keyword}" in the context.
For example:
- "2-Finger-Leistenausroller" is functionally similar to "3-Finger-Leistenausroller" (both are roller devices with fingers)
- "Fremdluft" is functionally similar to "Fremdlüfter" (both relate to external air systems)
- But "Leistenausroller" is NOT functionally similar to "Transportband" (different functions)

Return ONLY in this format:
"Similar Results for the keyword '${keyword}': [found term]
[Complete sentence containing the found term]"

Only return terms that serve a similar technical function. If no functionally similar terms are found, return exactly: "Keine relevanten Informationen gefunden."`
      }]
    });

    // Cache the response
    const result = message.content[0].text;
    responseCache.set(cacheKey, result);
    
    console.log('API call completed');
    return NextResponse.json({ result });

  } catch (error) {
    console.error('Detailed API error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Suche. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    );
  }
} 