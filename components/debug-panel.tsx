"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import * as pdfjsLib from 'pdfjs-dist'
import { ClaudeService } from '@/services/claude-service'

// Worker-Konfiguration
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface DebugPanelProps {
  // ... falls Props benötigt werden
}

export default function DebugPanel({}: DebugPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [requirements, setRequirements] = useState('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const processRequirements = async () => {
    if (!file || !requirements) return;

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('requirements', requirements);
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      // Direkt den technical_details String anzeigen
      setResult(data.technical_details || 'Keine technischen Details gefunden');

    } catch (error) {
      console.error('Error:', error);
      setResult('Fehler bei der Verarbeitung');
    } finally {
      setIsLoading(false);
    }
  };

  const [debugState, setDebugState] = useState({
    status: "waiting_for_input",
    uploaded_files: [],
    requirements: "",
    extracted_information: null
  });

  const [pdfContent, setPdfContent] = useState<string[]>([]);

  const claudeService = new ClaudeService();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(new Uint8Array(arrayBuffer)).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('PDF Extraktionsfehler:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setDebugState(prev => ({
        ...prev,
        status: "processing",
        uploaded_files: Array.from(files).map(file => file.name)
      }));

      const contents = await Promise.all(
        Array.from(files).map(file => extractTextFromPdf(file))
      );

      setPdfContent(contents);
      setDebugState(prev => ({
        ...prev,
        status: "ready"
      }));
    } catch (error) {
      console.error('Fehler beim Datei-Upload:', error);
      setDebugState(prev => ({
        ...prev,
        status: "error",
        extracted_information: null
      }));
    }
  };

  const searchWithClaude = async (keyword: string, context: string): Promise<string> => {
    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword, context })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  };

  const findRelevantContext = async (text: string, keyword: string): Promise<string> => {
    try {
      console.log('Starting search for:', keyword);
      console.log('Text length:', text.length);
      
      // Debug: Zeige die ersten paar Zeilen
      const firstLines = text.split('\n').slice(0, 5);
      console.log('First few lines:', firstLines);

      // Verbesserte Segmentierung mit Debug-Logging
      const lines = text.split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      console.log('Number of lines after splitting:', lines.length);

      // Exakte Suche mit Debug-Logging
      const exactMatches = lines.filter(line => {
        const containsKeyword = line.toLowerCase().includes(keyword.toLowerCase());
        const isRelevantLine = !line.match(/^(SWIFT|BIC|IBAN|AG,|Bank|Telefon|E-Mail|USt-ID)/i);
        const isArticleLine = line.match(/^\d+(\.\d+)*\s+\d+\s+/) || line.match(/^-*\s*\d+\s+/);
        
        if (containsKeyword) {
          console.log('Found line with keyword:', line);
          console.log('isRelevantLine:', isRelevantLine);
          console.log('isArticleLine:', isArticleLine);
        }
        
        return containsKeyword && isRelevantLine && isArticleLine;
      });

      console.log('Exact matches found:', exactMatches.length);

      if (exactMatches.length > 0) {
        console.log('Returning exact matches');
        return exactMatches.join('\n');
      }

      // Rest der Logik für Claude bleibt gleich...
      console.log('No exact matches, trying Claude...');
      const claudeResult = await searchWithClaude(keyword, text);
      
      if (claudeResult && claudeResult.includes('Similar Results')) {
        const similarTerm = claudeResult.match(/Similar Results for the keyword '[^']+': ([^\n]+)/)?.[1];
        
        if (similarTerm) {
          const similarMatches = lines
            .filter(line => {
              const containsSimilar = line.toLowerCase().includes(similarTerm.toLowerCase());
              const isRelevantLine = !line.match(/^(SWIFT|BIC|IBAN|AG,|Bank|Telefon|E-Mail|USt-ID)/i);
              const isArticleLine = line.match(/^\d+(\.\d+)*\s+\d+\s+/) || line.match(/^-*\s*\d+\s+/);
              
              return containsSimilar && isRelevantLine && isArticleLine;
            });

          if (similarMatches.length > 0) {
            return `Hinweis: Keine exakten Treffer für "${keyword}" gefunden.
Stattdessen Ergebnisse für den ähnlichen Begriff "${similarTerm}":\n\n${similarMatches.join('\n')}`;
          }
        }
      }

      return `Keine Informationen zu "${keyword}" gefunden`;

    } catch (error) {
      console.error('Error in findRelevantContext:', error);
      return 'Fehler bei der Suche. Bitte versuchen Sie es später erneut.';
    }
  };

  const handleProcessRequirements = async () => {
    if (!debugState.requirements || pdfContent.length === 0) return;

    try {
      const keywords = debugState.requirements
        .split(/[-\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .map(k => k.startsWith('-') ? k.substring(1).trim() : k);

      const results = await Promise.all(keywords.map(async keyword => {
        for (const content of pdfContent) {
          const found = await findRelevantContext(content, keyword);
          if (found && found !== 'Keine relevanten Informationen gefunden.') return found;
        }
        return `Keine Informationen zu "${keyword}" gefunden`;
      }));

      if (results.length > 0) {
        setDebugState(prev => ({
          ...prev,
          status: "completed",
          extracted_information: {
            technical_details: results
              .filter(result => result && !result.startsWith('Keine Informationen'))
              .join('\n\n- - - - - - - - - - - - - - - - - - - - - - - - - - -\n\n'),
            safety_features: null,
            dimensions: null,
            transport_system: null
          }
        }));
      }
    } catch (error) {
      console.error('Fehler bei der Verarbeitung:', error);
      setDebugState(prev => ({
        ...prev,
        status: "error",
        extracted_information: null
      }));
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-bold mb-2">Upload PDFs</h2>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="mb-4"
        />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">Requirements</h2>
        <Textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Enter requirements..."
          className="mb-4"
        />
        <Button 
          onClick={processRequirements}
          disabled={isLoading || !file}
        >
          {isLoading ? 'Processing...' : 'Process Requirements'}
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">Extracted Information</h2>
        <pre className="whitespace-pre-wrap break-words max-w-full overflow-x-auto bg-gray-100 p-4 rounded">
          {result}
        </pre>
      </div>
    </div>
  );
}