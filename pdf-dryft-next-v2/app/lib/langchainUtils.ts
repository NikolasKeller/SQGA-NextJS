import { Anthropic } from '@anthropic-ai/sdk'

// Anthropic Client initialisieren
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export async function getAIResponse(query: string, context: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Kontext: ${context}\n\nFrage: ${query}`
      }]
    })

    return {
      answer: message.content,
      error: null
    }
  } catch (error) {
    console.error('Fehler bei der AI-Anfrage:', error)
    return {
      answer: null,
      error: 'Fehler bei der AI-Verarbeitung'
    }
  }
} 