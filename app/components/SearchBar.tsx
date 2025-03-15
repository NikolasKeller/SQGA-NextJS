'use client'

import { useState } from 'react'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      
      if (!response.ok) throw new Error('Suchfehler')
      
      const results = await response.json()
      // Ergebnisse verarbeiten...
      
    } catch (error) {
      console.error('Suchfehler:', error)
    } finally {
      setSearching(false)
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Suchbegriff eingeben..."
        className="flex-1 px-4 py-2 border rounded"
      />
      <button 
        type="submit"
        disabled={searching}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {searching ? 'Suche...' : 'Suchen'}
      </button>
    </form>
  )
} 