import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }

  async searchInContext(keyword: string, context: string): Promise<string> {
    try {
      console.log('Searching with Claude for:', keyword);

      const message = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.1, // Sehr niedrige Temperatur für konsistente Antworten
        messages: [{
          role: 'user',
          content: `In this technical document:

"${context}"

Find technical terms similar to "${keyword}". For example, for "Fremdluft", look for terms like "Fremdlüfter".

Rules:
1. Find the COMPLETE sentence containing the similar term
2. Format the response EXACTLY like this:
"Similar Results for the keyword '${keyword}': [similar term]
[Complete sentence with the similar term]"

Example for keyword "Fremdluft":
"Similar Results for the keyword 'Fremdluft': Fremdlüfter
Hauptantriebsmotor 9,6 kW, Regelbereich 1:20, als Drehstrom-Kurzschlussläufermotor mit Frequenzumrichter für Drehzahlregelung, inklusive angebautem Fremdlüfter, Wärmewächter, Drehzahlvorwahl."

If no similar terms are found, return exactly: "Keine relevanten Informationen gefunden."`
        }]
      });

      console.log('Claude response:', message.content[0].text);
      return message.content[0].text;

    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  }
} 