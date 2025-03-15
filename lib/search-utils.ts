export async function findRelevantContext(text: string, keyword: string): Promise<string> {
  try {
    console.log('Starting search for:', keyword);
    
    // Erst normale Keyword-Suche
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Exakte Suche
    const exactMatches = lines.filter(line => {
      const containsKeyword = line.toLowerCase().includes(keyword.toLowerCase());
      const isRelevantLine = !line.match(/^(SWIFT|BIC|IBAN|AG,|Bank|Telefon|E-Mail|USt-ID)/i);
      const isArticleLine = line.match(/^\d+(\.\d+)*\s+\d+\s+/) || line.match(/^-*\s*\d+\s+/);
      
      return containsKeyword && isRelevantLine && isArticleLine;
    });

    console.log('Exact matches found:', exactMatches.length);

    // Wenn exakte Treffer gefunden, DIREKT zurückgeben
    if (exactMatches.length > 0) {
      console.log('Found exact matches, returning without API call');
      return exactMatches.join('\n');
    }

    // NUR wenn keine exakten Treffer gefunden wurden
    console.log('No exact matches found, trying Claude API...');
    const claudeResult = await searchWithClaude(keyword, text);
    return claudeResult;

  } catch (error) {
    console.error('Search error:', error);
    return '';
  }
} 