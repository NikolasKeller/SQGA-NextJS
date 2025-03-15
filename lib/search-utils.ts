import { Section } from './pdf-utils';

/**
 * Findet relevanten Kontext basierend auf einer Anfrage und extrahierten Abschnitten
 * @param query Die Suchanfrage
 * @param sections Die extrahierten Abschnitte aus dem Dokument
 * @param maxTokens Maximale Anzahl von Tokens im zurückgegebenen Kontext
 * @returns Der relevante Kontext als String
 */
export function findRelevantContext(query: string, sections: Section[], maxTokens: number = 4000): string {
  // Normalisiere die Anfrage für den Vergleich
  const normalizedQuery = query.toLowerCase().trim();
  
  // Bewerte jeden Abschnitt nach Relevanz
  const scoredSections = sections.map(section => {
    // Einfache Bewertung basierend auf Übereinstimmung von Schlüsselwörtern
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 3);
    
    let score = 0;
    const normalizedTitle = section.title.toLowerCase();
    const normalizedContent = section.content.toLowerCase();
    
    // Höhere Punktzahl für Übereinstimmungen im Titel
    for (const word of queryWords) {
      if (normalizedTitle.includes(word)) {
        score += 10;
      }
      
      // Punktzahl für Übereinstimmungen im Inhalt
      const contentMatches = (normalizedContent.match(new RegExp(word, 'g')) || []).length;
      score += contentMatches;
    }
    
    // Bonus für Abschnitte höherer Ebene (Hauptüberschriften)
    if (section.level === 1) {
      score *= 1.5;
    }
    
    return {
      section,
      score
    };
  });
  
  // Sortiere Abschnitte nach Relevanz (höchste Punktzahl zuerst)
  scoredSections.sort((a, b) => b.score - a.score);
  
  // Wähle die relevantesten Abschnitte aus, bis maxTokens erreicht ist
  let context = '';
  let estimatedTokens = 0;
  const tokensPerChar = 0.25; // Grobe Schätzung: 4 Zeichen pro Token
  
  for (const { section } of scoredSections) {
    const sectionText = `## ${section.title}\n\n${section.content}\n\n`;
    const sectionTokens = Math.ceil(sectionText.length * tokensPerChar);
    
    if (estimatedTokens + sectionTokens <= maxTokens) {
      context += sectionText;
      estimatedTokens += sectionTokens;
    } else {
      // Wenn der vollständige Abschnitt nicht passt, füge so viel wie möglich hinzu
      const remainingTokens = maxTokens - estimatedTokens;
      const remainingChars = Math.floor(remainingTokens / tokensPerChar);
      
      if (remainingChars > 50) { // Nur hinzufügen, wenn es sinnvoll ist
        context += `## ${section.title}\n\n${section.content.substring(0, remainingChars)}...\n\n`;
      }
      
      break;
    }
  }
  
  return context.trim();
}

/**
 * Sucht nach einem bestimmten Abschnitt basierend auf einem Schlüsselwort
 * @param keyword Das Schlüsselwort zum Suchen
 * @param sections Die extrahierten Abschnitte
 * @returns Der gefundene Abschnitt oder null, wenn keiner gefunden wurde
 */
export function findSectionByKeyword(keyword: string, sections: Section[]): Section | null {
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  // Zuerst nach exakten Übereinstimmungen im Titel suchen
  let matchingSection = sections.find(section => 
    section.title.toLowerCase().includes(normalizedKeyword)
  );
  
  // Wenn keine Übereinstimmung im Titel gefunden wurde, im Inhalt suchen
  if (!matchingSection) {
    matchingSection = sections.find(section => 
      section.content.toLowerCase().includes(normalizedKeyword)
    );
  }
  
  return matchingSection;
} 