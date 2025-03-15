"use client"

import { useState } from "react"

export default function DebugPanelSimple() {
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testMistralAPI = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/mistral-simple-test');
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(data);
      
    } catch (error) {
      console.error('Fehler beim Testen der Mistral-API:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Mistral API Test</h2>
      
      <button 
        onClick={testMistralAPI}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
        disabled={isLoading}
      >
        {isLoading ? 'Wird getestet...' : 'Mistral API testen'}
      </button>
      
      {error && (
        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}
      
      {apiResponse && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">API-Antwort:</h3>
          <pre className="p-2 bg-gray-50 border rounded overflow-auto max-h-60">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 