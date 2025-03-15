import * as pdfjs from 'pdfjs-dist';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log('Starting PDF extraction');

    // Buffer zu Uint8Array konvertieren
    const uint8Array = new Uint8Array(buffer);
    
    // PDF.js Worker initialisieren
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    // PDF mit Uint8Array laden
    const loadingTask = pdfjs.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    console.log('PDF loaded, pages:', pdf.numPages);

    let fullText = '';
    
    // Alle Seiten durchgehen
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log('Processing page:', i);
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    console.log('Extraction complete, text length:', fullText.length);
    return fullText;

  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

interface TextItem {
  text: string;
  isBold: boolean;
  fontSize?: number;
}

export async function extractStructuredContent(buffer: Buffer): Promise<TextItem[]> {
  // TODO: Implementiere die PDF-Extraktion mit Formatierungsinformationen
  // Dies erfordert eine PDF-Bibliothek, die Formatierungen erkennen kann
  
  // Beispiel-Implementation:
  const pdfText = await extractTextFromPDF(buffer);
  const lines = pdfText.split('\n');
  
  return lines.map(line => ({
    text: line,
    isBold: /^\d+\s+[A-Z]/.test(line), // Vorläufig: Erkennt nummerierte Überschriften
    fontSize: undefined
  }));
} 