"use client"

import { useState } from "react"

interface TOCEntry {
  title: string;
  level: number;
  position: number;
}

export default function DebugPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<TOCEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Neue Zustände für die Textextraktion
  const [keyword, setKeyword] = useState<string>('');
  const [extractedSection, setExtractedSection] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/test-section', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`API-Fehler: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setFileInfo({
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType
        });
        
        if (data.pdfText) {
          setPdfText(data.pdfText);
        }
        
        if (data.tableOfContents && Array.isArray(data.tableOfContents)) {
          setTableOfContents(data.tableOfContents);
        }
        
        if (data.processingError) {
          setError(`Verarbeitungswarnung: ${data.processingError}`);
        }
      } else {
        throw new Error(data.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('Fehler beim Verarbeiten der Datei:', error);
      setError(error instanceof Error ? error.message : 'Unbekannter Fehler');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funktion zum Extrahieren eines Abschnitts basierend auf einem Keyword
  const extractSection = async () => {
    if (!file || !keyword) return;
    
    setIsExtracting(true);
    setExtractedSection('');
    
    try {
      // Simuliere die Extraktion eines Abschnitts
      // In einer realen Implementierung würdest du hier eine API-Anfrage stellen
      
      // Für Testzwecke verwenden wir eine Verzögerung und simulierte Daten
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulierte Abschnitte für verschiedene Keywords
      const sections: Record<string, string> = {
        'wärmerückgewinnung': `Wärmerückgewinnung (WRG) ECO-HEAT

S
2 Schottzone am Einlauf und Auslauf des Trockners
Schottzone zur Anreicherung der eingesaugten kalten Frischluft
mit warmer Zuluft von dem Wärmerückgewinnungssystem.
Bestehend aus Gestell, Thermoisolierung, jeweils einer
Schlitzdüse ober- und unterhalb der Warenbahn mit
Luftzuführung von der Decke, einer Zugangstüre sowie einer
Trennwand zum Trockenraum und Verlängerung des
Warentransportsystems.
17.02.01.01 S`,
        'anlagensteuerung': `Anlagensteuerung

Die Anlagensteuerung erfolgt über eine SPS mit Touch-Panel.
Alle relevanten Betriebsparameter können eingestellt und
überwacht werden. Die Steuerung ermöglicht eine einfache
Bedienung und Wartung der Anlage.`,
        'technische daten': `Technische Daten

Nennleistung: 22 kW
Betriebsspannung: 400 V / 50 Hz
Luftmenge: 5000 m³/h
Abmessungen (L x B x H): 4500 x 2200 x 2800 mm
Gewicht: ca. 3500 kg`
      };
      
      // Suche nach dem Keyword in den simulierten Abschnitten
      const lowercaseKeyword = keyword.toLowerCase();
      let foundSection = '';
      
      for (const [key, section] of Object.entries(sections)) {
        if (key.includes(lowercaseKeyword)) {
          foundSection = section;
          break;
        }
      }
      
      if (foundSection) {
        setExtractedSection(foundSection);
      } else {
        setExtractedSection(`Kein Abschnitt für das Keyword "${keyword}" gefunden.`);
      }
      
    } catch (error) {
      console.error('Fehler beim Extrahieren des Abschnitts:', error);
      setError(`Fehler beim Extrahieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const toggleDebugPanel = () => {
    setIsDebugVisible(!isDebugVisible);
  };

  return (
    <div className="relative">
      {/* Debug-Panel-Toggle-Button */}
      <button 
        onClick={toggleDebugPanel}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
        title="Debug-Panel ein-/ausblenden"
      >
        {isDebugVisible ? '✕' : '🔍'}
      </button>
      
      {/* Debug-Panel */}
      {isDebugVisible && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg overflow-auto z-40 p-4 border-l border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Debug-Panel</h2>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">PDF-Datei auswählen:</label>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="block w-full text-sm"
            />
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Wird verarbeitet...</span>
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {fileInfo && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Datei-Informationen:</h3>
              <div className="text-sm border rounded p-2">
                <p><strong>Name:</strong> {fileInfo.fileName}</p>
                <p><strong>Größe:</strong> {Math.round(fileInfo.fileSize / 1024)} KB</p>
                <p><strong>Typ:</strong> {fileInfo.fileType}</p>
              </div>
            </div>
          )}
          
          {tableOfContents.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Inhaltsverzeichnis:</h3>
              <ul className="text-sm space-y-1 max-h-60 overflow-y-auto border rounded p-2">
                {tableOfContents.map((entry, index) => (
                  <li 
                    key={index} 
                    className="truncate hover:text-blue-600 cursor-pointer"
                    style={{ paddingLeft: `${entry.level * 0.5}rem` }}
                    title={entry.title}
                    onClick={() => setKeyword(entry.title)}
                  >
                    {entry.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {pdfText && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">PDF-Text (Auszug):</h3>
              <div className="text-xs border rounded p-2 max-h-40 overflow-y-auto">
                {pdfText}...
              </div>
            </div>
          )}
          
          {/* Neue Abschnitt für die Textextraktion */}
          {fileInfo && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Abschnitt extrahieren:</h3>
              <div className="flex space-x-2 mb-2">
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Keyword eingeben"
                  className="flex-1 border rounded p-1 text-sm"
                />
                <button 
                  onClick={extractSection}
                  disabled={isExtracting || !keyword}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm disabled:bg-gray-300"
                >
                  {isExtracting ? '...' : 'Suchen'}
                </button>
              </div>
              
              {extractedSection && (
                <div className="text-xs border rounded p-2 max-h-60 overflow-y-auto bg-gray-50">
                  <pre className="whitespace-pre-wrap">{extractedSection}</pre>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Status: {isLoading ? 'Wird verarbeitet...' : error && !fileInfo ? 'Fehler' : fileInfo ? 'Erfolgreich' : 'Bereit'}</p>
            <p>Überschriften: {tableOfContents.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}