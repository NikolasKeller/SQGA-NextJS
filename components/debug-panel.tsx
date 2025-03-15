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
  
  // Zustände für die Textextraktion
  const [keyword, setKeyword] = useState<string>('');
  const [extractedSection, setExtractedSection] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [sectionHeading, setSectionHeading] = useState<string>('');
  const [ocrId, setOcrId] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/mistral-ocr-direct', {
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
        
        setOcrId(data.ocrId);
        
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
  
  // Hilfsfunktion zum Finden des Abschnitts basierend auf dem Inhaltsverzeichnis
  const findSectionFromTOC = (keyword: string, toc: TOCEntry[], fullText: string): { section: string, heading: string } | null => {
    // Normalisiere das Keyword für den Vergleich
    const normalizedKeyword = keyword.toLowerCase().trim();
    
    // Spezielle Behandlung für "Wärmerückgewinnung"
    if (normalizedKeyword === "wärmerückgewinnung") {
      const wrgHeadingIndex = toc.findIndex(entry => 
        entry.title.toLowerCase().includes("wärmerückgewinnung")
      );
      
      if (wrgHeadingIndex !== -1) {
        const wrgHeading = toc[wrgHeadingIndex];
        let nextHeadingIndex = -1;
        
        // Suche nach "Preis" oder "Zusammenfassung" als Ende des Abschnitts
        for (let i = wrgHeadingIndex + 1; i < toc.length; i++) {
          if (toc[i].title.toLowerCase().includes("preis") || 
              toc[i].title.toLowerCase().includes("zusammenfassung")) {
            nextHeadingIndex = i;
            break;
          }
        }
        
        const sectionStart = wrgHeading.position + wrgHeading.title.length;
        const sectionEnd = nextHeadingIndex !== -1 ? toc[nextHeadingIndex].position : fullText.length;
        
        return {
          section: fullText.substring(sectionStart, sectionEnd).trim(),
          heading: wrgHeading.title
        };
      }
    }
    
    // Finde die Überschrift, die das Keyword enthält
    let matchingHeadingIndex = -1;
    
    // Zuerst versuchen wir, eine exakte Überschrift zu finden
    matchingHeadingIndex = toc.findIndex(entry => 
      entry.title.toLowerCase().includes(normalizedKeyword)
    );
    
    // Wenn keine exakte Überschrift gefunden wurde, suchen wir im Text nach dem Keyword
    if (matchingHeadingIndex === -1) {
      // Finde die Position des Keywords im Text
      const keywordPosition = fullText.toLowerCase().indexOf(normalizedKeyword);
      
      if (keywordPosition === -1) {
        // Versuche ähnliche Keywords zu finden
        const similarKeywords = [
          normalizedKeyword.replace(/\s+/g, ''),  // Ohne Leerzeichen
          normalizedKeyword.replace(/-/g, ' '),   // Bindestrich durch Leerzeichen ersetzen
          normalizedKeyword.replace(/\([^)]*\)/g, '') // Klammern entfernen
        ];
        
        for (const similarKeyword of similarKeywords) {
          const similarPosition = fullText.toLowerCase().indexOf(similarKeyword);
          if (similarPosition !== -1) {
            // Finde die Überschrift, unter der das ähnliche Keyword fällt
            for (let i = 0; i < toc.length; i++) {
              if (toc[i].position <= similarPosition && 
                  (i === toc.length - 1 || toc[i + 1].position > similarPosition)) {
                matchingHeadingIndex = i;
                break;
              }
            }
            break;
          }
        }
        
        if (matchingHeadingIndex === -1) {
          return null; // Keyword nicht gefunden
        }
      } else {
        // Finde die Überschrift, unter der das Keyword fällt
        for (let i = 0; i < toc.length; i++) {
          if (toc[i].position <= keywordPosition && 
              (i === toc.length - 1 || toc[i + 1].position > keywordPosition)) {
            matchingHeadingIndex = i;
            break;
          }
        }
      }
    }
    
    if (matchingHeadingIndex === -1) {
      // Direkte Textsuche als Fallback
      const keywordContext = extractKeywordContext(fullText, normalizedKeyword, 500);
      if (keywordContext) {
        return {
          section: keywordContext,
          heading: `Kontext für "${keyword}"`
        };
      }
      return null; // Keine passende Überschrift gefunden
    }
    
    // Extrahiere den Abschnitt zwischen dieser Überschrift und der nächsten
    const currentHeading = toc[matchingHeadingIndex];
    const nextHeading = matchingHeadingIndex < toc.length - 1 ? toc[matchingHeadingIndex + 1] : null;
    
    const sectionStart = currentHeading.position + currentHeading.title.length;
    const sectionEnd = nextHeading ? nextHeading.position : fullText.length;
    
    const section = fullText.substring(sectionStart, sectionEnd).trim();
    
    return {
      section,
      heading: currentHeading.title
    };
  };
  
  // Hilfsfunktion zum Extrahieren des Kontexts um ein Keyword herum
  const extractKeywordContext = (text: string, keyword: string, contextSize: number = 500): string | null => {
    const normalizedText = text.toLowerCase();
    const keywordIndex = normalizedText.indexOf(keyword);
    
    if (keywordIndex === -1) return null;
    
    const startIndex = Math.max(0, keywordIndex - contextSize / 2);
    const endIndex = Math.min(text.length, keywordIndex + keyword.length + contextSize / 2);
    
    return text.substring(startIndex, endIndex).trim();
  };
  
  // Funktion zum Extrahieren eines Abschnitts basierend auf einem Keyword
  const extractSection = async () => {
    if (!ocrId || !keyword) return;
    
    setIsExtracting(true);
    setExtractedSection('');
    setSectionHeading('');
    
    try {
      // Verwende die einfache Suche statt der API
      const matchingSection = findSectionFromTOC(keyword, tableOfContents, pdfText);
      
      if (matchingSection) {
        setExtractedSection(matchingSection.section);
        setSectionHeading(matchingSection.heading);
      } else {
        setExtractedSection(`Kein Abschnitt für das Keyword "${keyword}" gefunden.`);
        setSectionHeading(`Suche nach "${keyword}"`);
      }
    } catch (error) {
      console.error('Fehler beim Extrahieren des Abschnitts:', error);
      setError(`Fehler beim Extrahieren: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      setExtractedSection(`Kein Abschnitt für das Keyword "${keyword}" gefunden.`);
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
          
          {/* Abschnitt für die Textextraktion */}
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
                <div className="mt-2">
                  {sectionHeading && (
                    <div className="font-medium text-sm mb-1 text-blue-600">{sectionHeading}</div>
                  )}
                  <div className="text-xs border rounded p-2 max-h-60 overflow-y-auto bg-gray-50">
                    <pre className="whitespace-pre-wrap">{extractedSection}</pre>
                  </div>
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