export interface SearchResult {
  query: string
  results: {
    direct_answer: string | null
    matches: string[]
    pattern_used: string | number
    error?: string
  }
}

export interface ProcessingResult {
  text?: string
  error?: string
}

export interface DirectAnswerResult {
  direct_answer: string | null
  matches: string[]
  pattern_used: string | number
  error?: string
} 