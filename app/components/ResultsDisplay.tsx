import { SearchResult } from '@/lib/types'

interface Props {
  results: SearchResult[]
}

export function ResultsDisplay({ results }: Props) {
  if (!results.length) {
    return <p>Keine Ergebnisse gefunden.</p>
  }

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div key={index} className="p-4 border rounded">
          <p className="font-medium">Seite {result.page}</p>
          <p className="mt-2">{result.text}</p>
          {result.context && (
            <p className="mt-2 text-sm text-gray-600">{result.context}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Relevanz: {(result.score * 100).toFixed(1)}%
          </p>
        </div>
      ))}
    </div>
  )
} 