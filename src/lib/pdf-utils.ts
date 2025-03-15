import { TOCEntry, generateTableOfContents, findSectionForKeyword, extractDirectSection } from './pdf-toc-generator';
import * as pdfjs from 'pdfjs-dist';

// Stelle sicher, dass die Worker-Datei korrekt geladen wird
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ExtractedPDF {
  text: string;
  tableOfContents: TOCEntry[];
}

/**
 * Extrahiert Text aus einer PDF-Datei
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Fehler beim Extrahieren des PDF-Textes:', error);
    throw new Error('PDF-Textextraktion fehlgeschlagen');
  }
}

/**
 * Extrahiert Text und generiert ein Inhaltsverzeichnis aus einer PDF-Datei
 */
export async function extractPDFWithTOC(pdfBuffer: Buffer): Promise<ExtractedPDF> {
  const text = await extractTextFromPDF(pdfBuffer);
  const tableOfContents = await generateTableOfContents(text);
  
  return {
    text,
    tableOfContents
  };
}

/**
 * Extrahiert strukturierten Inhalt aus einer PDF-Datei
 */
export async function extractStructuredContent(pdfBuffer: Buffer, keywords: string[]): Promise<any> {
  const { text, tableOfContents } = await extractPDFWithTOC(pdfBuffer);
  
  const results = keywords.map(keyword => {
    // Versuche zuerst die direkte Extraktion für bekannte Keywords
    const directSection = extractDirectSection(text, keyword);
    
    if (directSection) {
      return {
        keyword,
        found: true,
        heading: directSection.heading,
        section: directSection.section
      };
    }
    
    // Fallback auf die allgemeine Methode
    const section = findSectionForKeyword(text, keyword, tableOfContents);
    
    if (!section) {
      return {
        keyword,
        found: false,
        message: 'Keyword nicht gefunden'
      };
    }
    
    return {
      keyword,
      found: true,
      heading: section.heading,
      section: section.section
    };
  });
  
  return results;
} 