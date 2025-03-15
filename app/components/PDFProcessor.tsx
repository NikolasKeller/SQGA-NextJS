'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'

export function PDFProcessor() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = async (acceptedFiles: File[]) => {
    try {
      setProcessing(true)
      setError(null)

      const file = acceptedFiles[0]
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Fehler bei der Verarbeitung')
      }

      const result = await response.json()
      // Ergebnis verarbeiten...

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setProcessing(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        <input {...getInputProps()} />
        <p>PDF hier ablegen oder klicken zum Auswählen</p>
      </div>

      {processing && (
        <div className="mt-4">
          <p>Verarbeite PDF...</p>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-500">
          <p>{error}</p>
        </div>
      )}
    </div>
  )
} 