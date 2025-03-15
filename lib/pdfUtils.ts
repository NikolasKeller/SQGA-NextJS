import { Section } from './pdf-utils';

export async function processPDF(file: File): Promise<{
  text: string;
  sections: Section[];
}> {
  try {
    // Verwende die vorhandene Funktion aus pdf-utils.ts
    const text = await import('./pdf-utils').then(module => module.extractTextFromPDF(file));
    const sections = await import('./pdf-utils').then(module => module.extractStructuredContent(text));
    
    return {
      text,
      sections
    };
  } catch (error) {
    console.error('Fehler bei der PDF-Verarbeitung:', error);
    throw new Error(`Fehler bei der PDF-Verarbeitung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
} 