'use client'

import { useState } from 'react'
import { PDFProcessor } from '@/components/PDFProcessor'
import { SearchBar } from '@/components/SearchBar'
import { ResultsDisplay } from '@/components/ResultsDisplay'
import { SearchResult } from '@/lib/types'

export function MainProcessor() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [processing, setProcessing] = useState(false)

  const handleSearchResults = (newResults: SearchResult[]) => {
    setResults(newResults)
  }

  return (
    <div className="space-y-8">
      <PDFProcessor onProcessing={setProcessing} />
      <SearchBar onResults={handleSearchResults} disabled={processing} />
      <ResultsDisplay results={results} />
    </div>
  )
} 