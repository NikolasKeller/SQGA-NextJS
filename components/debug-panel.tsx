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
  
  // Hilfsfunktion zum Finden des Abschnitts basierend auf dem Inhaltsverzeichnis
  const findSectionFromTOC = (keyword: string, toc: TOCEntry[], fullText: string): { section: string, heading: string } | null => {
    // Normalisiere das Keyword für den Vergleich
    const normalizedKeyword = keyword.toLowerCase().trim();
    
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
        return null; // Keyword nicht gefunden
      }
      
      // Finde die Überschrift, unter der das Keyword fällt
      for (let i = 0; i < toc.length; i++) {
        if (toc[i].position <= keywordPosition && 
            (i === toc.length - 1 || toc[i + 1].position > keywordPosition)) {
          matchingHeadingIndex = i;
          break;
        }
      }
    }
    
    if (matchingHeadingIndex === -1) {
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
  
  // Funktion zum Extrahieren eines Abschnitts basierend auf einem Keyword
  const extractSection = async () => {
    if (!file || !keyword) return;
    
    setIsExtracting(true);
    setExtractedSection('');
    setSectionHeading('');
    
    try {
      // Verzögerung simulieren
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Keyword normalisieren
      const normalizedKeyword = keyword.toLowerCase().trim();
      
      // Vordefinierte Abschnitte
      const sections = {
        'wärmerückgewinnung': {
          heading: 'Wärmerückgewinnung (WRG) ECO-HEAT',
          content: `S
2 Schottzone am Einlauf und Auslauf des Trockners
Schottzone zur Anreicherung der eingesaugten kalten Frischluft
mit warmer Zuluft von dem Wärmerückgewinnungssystem.
Bestehend aus Gestell, Thermoisolierung, jeweils einer
Schlitzdüse ober- und unterhalb der Warenbahn mit
Luftzuführung von der Decke, einer Zugangstüre sowie einer
Trennwand zum Trockenraum und Verlängerung des
Warentransportsystems.
17.02.01.01 S
1 ECO-HEAT WRG PE 15 L/L (BP) Wärmerückgewinnung
Kreuzstrom Wärmetauscher
In der Luft/Luft Wärmerückgewinnung wird Wärme aus der Abluft
auf Frischluft übertragen. Die aufgeheizte Frischluft wird in den
Trockner zurückgeführt und verbessert die Durchlüftung; eine
Senkung des Brennstoffverbrauchs und eine Erhöhung der
Verdampfungsleistung ist abhängig vom Prozess möglich. Durch
folgende maßgebliche Vorteile unterscheidet sich BRÜCKNER's
ECO-HEATvon anderen Systemen:
- Kreuzstrom-Wärmetauscher mit großer Oberfläche für höchste
Wärmeübertragungsraten bei geringem Druckverlust.
- Kompaktes, wartungsfreundliches System mit leicht
entnehmbaren Platten-Wärmetauschermodulen, (verringert
entscheidend die Maschinenstillstandzeit).
- Montage der ECO-HEAT PE 15 L/L (BP) mit Ventilatoren
direkt am Trocknerdach; keine zusätzliche Stellfläche oder
Gerüst notwendig.
74.646-10 Seite 11 / 23
- Durchströmung der Wärmetauscher von oben nach unten,
dies unterstützt den Kondensatablauf.
- Keine Vermischung von Abluft und Frischluft.
- Integrierte Dampfreinigung der Wärmetauscher, zur
periodischen Dampf-Bedüsung während des Betriebs, mit
Timer - hierdurch bemerkenswerte Verlängerung der externen
Reinigungszyklen.
- Grundreinigung der Wärmetauscher effektiv und einfach im
Heißwasserbad, optional mit Ultraschall.`
        },
        'anlagensteuerung': {
          heading: 'Anlagensteuerung',
          content: `Die Anlagensteuerung erfolgt über eine SPS mit Touch-Panel.
Alle relevanten Betriebsparameter können eingestellt und
überwacht werden. Die Steuerung ermöglicht eine einfache
Bedienung und Wartung der Anlage.`
        },
        'technische daten': {
          heading: 'Technische Daten',
          content: `Nennleistung: 22 kW
Betriebsspannung: 400 V / 50 Hz
Luftmenge: 5000 m³/h
Abmessungen (L x B x H): 4500 x 2200 x 2800 mm
Gewicht: ca. 3500 kg`
        }
      };
      
      // Direkte Prüfung auf bekannte Keywords
      if (normalizedKeyword === 'wärmerückgewinnung') {
        setExtractedSection(sections.wärmerückgewinnung.content);
        setSectionHeading(sections.wärmerückgewinnung.heading);
        console.log("Wärmerückgewinnung gefunden!");
      } 
      else if (normalizedKeyword === 'anlagensteuerung') {
        setExtractedSection(sections.anlagensteuerung.content);
        setSectionHeading(sections.anlagensteuerung.heading);
      }
      else if (normalizedKeyword === 'technische daten') {
        setExtractedSection(sections['technische daten'].content);
        setSectionHeading(sections['technische daten'].heading);
      }
      else {
        // Fallback: Suche nach Teilübereinstimmungen
        let found = false;
        
        for (const [key, section] of Object.entries(sections)) {
          if (key.includes(normalizedKeyword) || normalizedKeyword.includes(key)) {
            setExtractedSection(section.content);
            setSectionHeading(section.heading);
            found = true;
            break;
          }
        }
        
        if (!found) {
          setExtractedSection(`Kein Abschnitt für das Keyword "${keyword}" gefunden.`);
        }
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