"use client";

import { useState } from 'react';

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [keyword, setKeyword] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !keyword) {
      alert('Bitte wähle eine Datei aus und gib ein Keyword ein');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('keyword', keyword);
      
      const response = await fetch('/api/test-section', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.extractedSection);
      } else {
        setResult(`Fehler: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      setResult(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Abschnittserkennung testen</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block mb-2">PDF-Datei:</label>
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
            className="border p-2 w-full"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">Keyword:</label>
          <input 
            type="text" 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)}
            className="border p-2 w-full"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {loading ? 'Wird getestet...' : 'Testen'}
        </button>
      </form>
      
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Ergebnis:</h2>
          <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
} 