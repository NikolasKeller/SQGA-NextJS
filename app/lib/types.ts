export interface SearchResult {
  text: string
  page: number
  score: number
  context?: string
}

export interface ProcessingResult {
  success: boolean
  text?: string
  error?: string
} 