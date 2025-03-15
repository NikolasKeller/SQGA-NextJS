// Text Analyse und Antwortgenerierung 

import { DirectAnswerResult } from './types'

export function getDirectAnswer(query: string, text: string): DirectAnswerResult {
  if (!query || !text) {
    return {
      direct_answer: null,
      matches: [],
      pattern_used: 0,
      error: 'Query oder Text ist leer'
    }
  }

  // Query bereinigen
  const cleanedQuery = query.toLowerCase().trim().replace(/[?.,!]/g, '')
  
  // Schlüsselwörter extrahieren
  const keywords = cleanedQuery.split(' ').filter(word => word.length > 3)
  
  // Suchmuster
  const patterns = [
    new RegExp(`(?i)[^.!?]*${keywords.map(word => `.*\\b${word}\\b`).join('')}.*?[.!?]`, 'gi'),
    new RegExp(`(?i)[^.!?]*(${keywords.map(word => `\\b${word}\\b`).join('|')}).*?[.!?]`, 'gi')
  ]

  // Implementierung der Suchmuster...
  // (Rest der Suchlogik hier)

  return {
    direct_answer: null,
    matches: [],
    pattern_used: 'fallback',
    error: 'Keine Übereinstimmungen gefunden'
  }
} 