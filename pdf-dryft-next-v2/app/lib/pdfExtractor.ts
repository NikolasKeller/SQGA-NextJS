// PDF Extraktion und Verarbeitung 
import { ProcessingResult } from './types'
import { PDFDocument } from 'pdf-lib'

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()
    
    let text = ''
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const pageText = await page.extractText()
      text += pageText + '\n'
    }
    
    return text
  } catch (error) {
    console.error('Fehler beim Extrahieren des Textes:', error)
    throw error
  }
} 