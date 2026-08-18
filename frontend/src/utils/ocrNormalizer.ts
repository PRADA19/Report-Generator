/**
 * Utility to clean and normalize raw OCR text extracted from event posters.
 */
export function normalizeOcrText(text: string): string {
  if (!text) return '';

  // 1. Split into lines and trim whitespace
  let lines = text.split(/\r?\n/).map(line => line.trim());

  // Remove duplicate empty lines
  lines = lines.filter(line => line.length > 0);

  // 2. Clean each line and correct common OCR errors (0/1 inside words)
  lines = lines.map(line => {
    // Remove duplicate spaces
    let cleaned = line.replace(/[ \t]+/g, ' ');

    // Correct character misrecognitions (0 -> O, 1 -> I) inside alphabetical words
    cleaned = cleaned.split(' ').map(word => {
      // If the word contains mixed letters and digits (0 or 1), but isn't a date, time, or pure number
      if (/[A-Za-z]/.test(word) && /[01]/.test(word)) {
        // Skip common number patterns (e.g. 1st, 2nd, 10am, 2026, etc.)
        if (/^\d+(?:st|nd|rd|th|AM|PM|am|pm|s)?$/i.test(word) || /^\d+$/.test(word)) {
          return word;
        }
        // Also check that it does not contain punctuation suggesting date/time like ":" or "/"
        if (/[:/]/.test(word)) {
          return word;
        }

        // Replace 0 with O and 1 with I when adjacent to letters
        return word
          .replace(/(?<=[A-Za-z])0(?=[A-Za-z])/g, 'O')
          .replace(/(?<=[A-Za-z])0/g, 'O')
          .replace(/0(?=[A-Za-z])/g, 'O')
          .replace(/(?<=[A-Za-z])1(?=[A-Za-z])/g, 'I')
          .replace(/(?<=[A-Za-z])1/g, 'I')
          .replace(/1(?=[A-Za-z])/g, 'I');
      }
      return word;
    }).join(' ');

    return cleaned;
  });

  // 3. Merge broken OCR lines into continuous sentences/headings
  const mergedLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const current = lines[i];
    if (mergedLines.length > 0) {
      const lastIdx = mergedLines.length - 1;
      const lastLine = mergedLines[lastIdx];

      // Check if we should merge:
      // - last line does not end with punctuation (., !, ?, :, -, |)
      // - current line does not start with a major header (e.g. Date:, Time:, Speaker:)
      // - last line is relatively short (typical of broken headings)
      const endsWithPunct = /[.!?:;\\-|]$/.test(lastLine);
      const isHeaderStart = /^(date|time|venue|speaker|resource\s+person|guest|coordinator|organized|organizer|theme|agenda|description|audience|topic):/i.test(current);
      const lastWordCount = lastLine.split(' ').length;

      if (!endsWithPunct && !isHeaderStart && lastWordCount < 8) {
        mergedLines[lastIdx] = `${lastLine} ${current}`;
      } else {
        mergedLines.push(current);
      }
    } else {
      mergedLines.push(current);
    }
  }

  return mergedLines.join('\n');
}
