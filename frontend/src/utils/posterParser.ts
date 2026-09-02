import { normalizeOcrText } from './ocrNormalizer';

export interface ParsedPosterData {
  title: string;
  department: string;
  organizer: string;
  eventType: string;
  speaker: string;
  designation: string;
  date: string;
  time: string;
  venue: string;
  audience: string;
  description: string;
  confidence: number;
  outcomes?: string[];
}

// Event keywords for Title Scoring and Classification
export const EVENT_KEYWORDS = [
  'workshop',
  'seminar',
  'webinar',
  'symposium',
  'conference',
  'guest lecture',
  'invited talk',
  'faculty development programme',
  'fdp',
  'hackathon',
  'training',
  'orientation',
  'awareness programme',
  'awareness program',
  'competition',
  'fest',
  'summit',
  'expo',
  'lecture',
  'talk'
];

const MONTHS_MAP: Record<string, string> = {
  jan: 'January', january: 'January',
  feb: 'February', february: 'February',
  mar: 'March', march: 'March',
  apr: 'April', april: 'April',
  may: 'May',
  jun: 'June', june: 'June',
  jul: 'July', july: 'July',
  aug: 'August', august: 'August',
  sep: 'September', september: 'September',
  oct: 'October', october: 'October',
  nov: 'November', november: 'November',
  dec: 'December', december: 'December'
};

export function isGarbageOcrLine(line: string): boolean {
  if (!line || line.trim().length < 3) return true;
  const str = line.trim();
  if (/[©®™”«»]/.test(str)) return true;
  if (/\b(membre|ue,\s*eno|ceq)\b/i.test(str)) return true;
  const letters = str.replace(/[^a-zA-Z]/g, '').length;
  if (letters < 3 && str.length > 5) return true;
  if (letters / str.length < 0.35 && !/\b(19|20)\d{2}\b/.test(str)) return true;
  return false;
}

/**
 * Parses cleaned OCR text and extracts structured event fields.
 */
export function parsePosterText(rawText: string): ParsedPosterData {
  const normalizedText = normalizeOcrText(rawText);
  const lines = normalizedText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .filter(l => !isGarbageOcrLine(l));

  // Initialize output fields
  let title = '';
  let department = '';
  let organizer = '';
  let eventType = ''; 
  let speaker = '';
  let designation = '';
  let date = '';
  let time = '';
  let venue = '';
  let audience = ''; 
  let description = '';

  // 1. Department & Organizer Detection
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('department of') || l.includes('dept. of') || l.includes('dept of') || l.includes('department of')) {
      const match = line.match(/(?:department|dept\.?)\s+of\s+(.+)/i);
      if (match) {
        department = match[1].split(',')[0].trim();
        // Remove trailing descriptors or punctuation
        department = department.replace(/[.|:|;]$/, '').trim();
        break;
      }
    }
  }

  // Fallback department detection by keywords
  if (!department) {
    const deptKeywords = [
      'information technology', 'computer science', 'computer applications',
      'artificial intelligence', 'data science', 'mechanical engineering',
      'electrical engineering', 'civil engineering', 'business administration',
      'commerce', 'english', 'mathematics', 'physics', 'chemistry', 'computing'
    ];
    for (const line of lines) {
      const l = line.toLowerCase();
      const found = deptKeywords.find(k => l.includes(k));
      if (found) {
        department = line; // Take whole line or capitalized keyword matching
        // Capitalize words nicely
        const cleanWords = found.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        department = cleanWords;
        break;
      }
    }
  }

  // Organizer detection
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('organized by') || l.includes('organizer') || l.includes('association of')) {
      const match = line.match(/(?:organized by|organizer:?|association of)\s+(.+)/i);
      if (match) {
        organizer = match[1].trim();
        break;
      }
    }
  }
  if (!organizer && department) {
    organizer = `Department of ${department}`;
  }

  // 2. Title Detection (Scoring Based)
  let bestTitleScore = -999;
  let bestTitleIndex = -1;

  const blacklistKeywords = [
    'college', 'university', 'accredited', 'approved', 'autonomous', 'affiliation', 
    'accreditation', 'iqac', 'welcome', 'organizes', 'presents', 'conducts', 'slogan', 
    'association', 'naac', 'nba', 'iso', 'campus', 'institution', 'patron', 'advisor',
    'date', 'time', 'venue', 'speaker', 'resource person', 'guest', 'coordinator', 
    'registration', 'fee', 'contact', 'phone', 'mail', 'website', 'all are welcome',
    'organizing committee', 'convenor', 'chairman', 'president', 'department of', 'dept. of'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const len = line.length;
    const l = line.toLowerCase();

    // Skip short or extremely long lines
    if (len < 5 || len > 120) continue;

    // Skip lines starting with label: pattern
    if (/^(date|time|venue|speaker|resource person|guest|coordinator|organized|organizer|designation):/i.test(line)) {
      continue;
    }

    // Check against blacklist
    const isBlacklisted = blacklistKeywords.some(k => l.includes(k));
    if (isBlacklisted) continue;

    let score = 0;

    // ALL CAPS bonus
    if (line === line.toUpperCase() && /[A-Z]/.test(line)) {
      score += 15;
    }
    // Title Case bonus
    else if (/^[A-Z][a-z]+(?:\s+[A-Za-z][a-z]+)*$/.test(line)) {
      score += 10;
    }

    // Event keywords bonus
    const hasEventKeyword = EVENT_KEYWORDS.some(k => l.includes(k));
    if (hasEventKeyword) {
      score += 45;
    }

    // Middle range length bonus
    if (len >= 15 && len <= 80) {
      score += 15;
    }

    if (score > bestTitleScore) {
      bestTitleScore = score;
      bestTitleIndex = i;
    }
  }

  if (bestTitleIndex !== -1) {
    title = lines[bestTitleIndex];

    // If the next line is also capitalized and short, and not blacklisted or key labeled, merge them.
    if (bestTitleIndex + 1 < lines.length) {
      const nextLine = lines[bestTitleIndex + 1];
      const nextLen = nextLine.length;
      const nextL = nextLine.toLowerCase();

      const nextBlacklisted = blacklistKeywords.some(k => nextL.includes(k)) || 
                             /^(date|time|venue|speaker|resource person|guest|coordinator|organized|organizer):/i.test(nextLine);

      if (!nextBlacklisted && nextLen >= 4 && nextLen <= 60 && 
          (nextLine === nextLine.toUpperCase() || /^[A-Z]/.test(nextLine))) {
        title = `${title} ${nextLine}`;
      }
    }
  }

  // Clean title punctuation
  title = title.replace(/^[:\-\s+|]+/, '').replace(/[:\-\s+|]+$/, '').trim();

  // 3. Event Type Inference
  const textForTypeClassification = `${title} ${normalizedText}`.toLowerCase();
  if (textForTypeClassification.includes('workshop') || textForTypeClassification.includes('hands-on') || textForTypeClassification.includes('training')) {
    eventType = 'Workshop';
  } else if (textForTypeClassification.includes('webinar') || textForTypeClassification.includes('online session')) {
    eventType = 'Webinar';
  } else if (textForTypeClassification.includes('fdp') || textForTypeClassification.includes('faculty development')) {
    eventType = 'Faculty Development Programme';
  } else if (textForTypeClassification.includes('hackathon') || textForTypeClassification.includes('coding challenge')) {
    eventType = 'Hackathon';
  } else if (textForTypeClassification.includes('symposium')) {
    eventType = 'Symposium';
  } else if (textForTypeClassification.includes('conference')) {
    eventType = 'Conference';
  } else if (textForTypeClassification.includes('guest lecture') || textForTypeClassification.includes('invited talk') || textForTypeClassification.includes('lecture')) {
    eventType = 'Guest Lecture';
  } else if (textForTypeClassification.includes('placement') || textForTypeClassification.includes('career guidance') || textForTypeClassification.includes('recruitment')) {
    eventType = 'Placement Activity';
  } else if (textForTypeClassification.includes('sports') || textForTypeClassification.includes('tournament') || textForTypeClassification.includes('athletic')) {
    eventType = 'Sports Event';
  } else if (textForTypeClassification.includes('cultural') || textForTypeClassification.includes('fest') || textForTypeClassification.includes('celebration')) {
    eventType = 'Cultural Event';
  } else if (textForTypeClassification.includes('seminar') || textForTypeClassification.includes('awareness')) {
    eventType = 'Seminar';
  }

  // 4. Date Detection & Normalization
  // Support all common formats: 12 August 2026, 12th August 2026, 12/08/2026, 12-08-2026, August 12, 2026, 13 Aug 2026
  let rawDateLine = '';
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('date:') || l.startsWith('date ')) {
      rawDateLine = line.replace(/date:/i, '').trim();
      break;
    }
  }

  const findDatePattern = (text: string): string => {
    // 1. Text dates: 12 August 2026, 12th August 2026, 13 Aug 2026, August 12, 2026
    const textDateRegex = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\b/i;
    const reverseTextDateRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})\b/i;
    
    // 2. Numeric dates: 12/08/2026, 12-08-2026
    const numericDateRegex = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/;

    let match = text.match(textDateRegex);
    if (match) {
      const day = parseInt(match[1]);
      const monthShort = match[2].toLowerCase();
      const month = MONTHS_MAP[monthShort] || monthShort;
      const year = match[3];
      return `${day} ${month} ${year}`;
    }

    match = text.match(reverseTextDateRegex);
    if (match) {
      const monthShort = match[1].toLowerCase();
      const month = MONTHS_MAP[monthShort] || monthShort;
      const day = parseInt(match[2]);
      const year = match[3];
      return `${day} ${month} ${year}`;
    }

    match = text.match(numericDateRegex);
    if (match) {
      const p1 = parseInt(match[1]);
      const p2 = parseInt(match[2]);
      let year = match[3];
      if (year.length === 2) {
        year = `20${year}`;
      }

      // Safe DD vs MM fallback
      let day = p1;
      let monthIndex = p2;
      if (p1 > 12) {
        day = p1;
        monthIndex = p2;
      } else if (p2 > 12) {
        day = p2;
        monthIndex = p1;
      }
      
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[Math.min(Math.max(1, monthIndex), 12) - 1];
      return `${day} ${month} ${year}`;
    }

    return '';
  };

  if (rawDateLine) {
    date = findDatePattern(rawDateLine);
  }
  
  if (!date) {
    // Search entire text
    date = findDatePattern(normalizedText);
  }

  // Fallback to original line if no regex matched but we had a Date: header
  if (!date && rawDateLine) {
    date = rawDateLine.replace(/[^a-zA-Z0-9\s,\-]/g, '').trim();
  }

  // 5. Time Extraction
  let rawTimeLine = '';
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('time:') || l.startsWith('time ')) {
      rawTimeLine = line.replace(/time:/i, '').trim();
      break;
    }
  }

  const findTimePattern = (text: string): string => {
    // Pattern matches: 10:00 AM, 10 AM, 10.00 a.m., 09:30 AM - 12:30 PM, 2.00 PM to 4.00 PM
    // Try to find a range first
    const timeRangeRegex = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?\s*(?:–|-|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/i;
    const singleTimeRegex = /\b\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)/i;

    let match = text.match(timeRangeRegex);
    if (match) {
      return match[0].trim();
    }
    match = text.match(singleTimeRegex);
    if (match) {
      return match[0].trim();
    }
    return '';
  };

  if (rawTimeLine) {
    time = findTimePattern(rawTimeLine);
  }
  if (!time) {
    time = findTimePattern(normalizedText);
  }
  if (!time && rawTimeLine) {
    time = rawTimeLine.trim();
  }

  // Normalize Time ranges: clean separators, uniform AM/PM
  if (time) {
    time = time
      .replace(/a\.m\./gi, 'AM')
      .replace(/p\.m\./gi, 'PM')
      .replace(/am/gi, ' AM')
      .replace(/pm/gi, ' PM')
      .replace(/\s+/g, ' ')
      .replace(/–|-/g, ' – ')
      .replace(/\s+–\s+/g, ' – ')
      .trim();
  }

  // 6. Venue Extraction
  const venueKeywords = [
    'seminar hall', 'auditorium', 'conference hall', 'lab', 'room', 
    'block', 'campus', 'google meet', 'zoom', 'microsoft teams', 'online'
  ];

  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes('venue:') || l.startsWith('venue ')) {
      venue = line.replace(/venue:/i, '').trim();
      break;
    }
  }

  if (!venue) {
    for (const line of lines) {
      const l = line.toLowerCase();
      const hasKeyword = venueKeywords.some(k => l.includes(k));
      if (hasKeyword && !l.includes('date') && !l.includes('time') && !l.includes('speaker') && !l.includes('resource')) {
        venue = line;
        break;
      }
    }
  }
  
  // Clean venue punctuation
  if (venue) {
    venue = venue.replace(/^[:\-\s+|]+/, '').trim();
  }

  // 7. Speaker & Designation Extraction
  let speakerLineIndex = -1;
  const speakerLabels = ['resource person', 'chief guest', 'speaker', 'guest speaker', 'keynote speaker'];

  // Look for label
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    const hasLabel = speakerLabels.some(lbl => l.includes(lbl) || l.startsWith(lbl));
    if (hasLabel) {
      speakerLineIndex = i;
      // If label line has a colon, speaker might be on the same line or next line
      const afterLabel = lines[i].replace(/^(?:resource person|chief guest|speaker|guest speaker|keynote speaker):?/i, '').trim();
      if (afterLabel && afterLabel.length > 3) {
        speaker = afterLabel;
      }
      break;
    }
  }

  // If no label, search for title prefixes: Dr., Prof., Mr., Ms., Mrs.
  if (!speaker) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const l = line.toLowerCase();
      if (/\b(dr|prof|mr|ms|mrs)\./i.test(line)) {
        // Skip lines that are obviously titles, departments, or organizers
        if (l.includes('college') || l.includes('department') || l.includes('organized')) continue;
        speaker = line;
        speakerLineIndex = i;
        break;
      }
    }
  }

  // Extract designation
  if (speakerLineIndex !== -1 && speakerLineIndex + 1 < lines.length) {
    // The next 1-2 lines are likely the designation
    const nextLine = lines[speakerLineIndex + 1];
    const nextL = nextLine.toLowerCase();

    // Check that the next line is not another label, date, time or venue
    const isAnotherField = /^(date|time|venue|registration|contact|convenor|patron):/i.test(nextLine) || 
                           nextL.includes('date') || nextL.includes('time') || nextL.includes('venue');

    if (!isAnotherField && nextLine.length > 3 && nextLine.length < 150) {
      designation = nextLine;

      // Check if we should append one more line (e.g. university or company name on the next line)
      if (speakerLineIndex + 2 < lines.length) {
        const nextNextLine = lines[speakerLineIndex + 2];
        const nextNextL = nextNextLine.toLowerCase();
        const isAnotherField2 = /^(date|time|venue|registration|contact|convenor|patron):/i.test(nextNextLine) ||
                                nextNextL.includes('date') || nextNextL.includes('time') || nextNextL.includes('venue');
        
        if (!isAnotherField2 && nextNextLine.length > 3 && nextNextLine.length < 80 && 
            (nextNextL.includes('university') || nextNextL.includes('institute') || nextNextL.includes('pvt') || nextNextL.includes('ltd') || nextNextL.includes('corp') || nextNextL.includes('college') || nextNextL.includes('technologies'))) {
          designation = `${designation}, ${nextNextLine}`;
        }
      }
    }
  }

  // Clean speaker prefixes from speaker name if it got duplicated
  if (speaker) {
    speaker = speaker.replace(/^[:\-\s+|]+/, '').trim();
  }

  // 8. Audience & Description construction
  const descriptionLines = lines.filter(line => {
    const l = line.toLowerCase();
    return line !== title &&
           line !== department &&
           line !== organizer &&
           line !== speaker &&
           line !== designation &&
           !l.includes('date') &&
           !l.includes('time') &&
           !l.includes('venue') &&
           !l.includes('registration') &&
           !l.includes('all are welcome') &&
           !l.includes('organized by');
  });
  description = descriptionLines.slice(0, 3).join(' ');

  // 9. Confidence Calculation
  let confidenceScore = 0;
  if (title) confidenceScore += 20;
  if (date) confidenceScore += 15;
  if (time) confidenceScore += 10;
  if (venue) confidenceScore += 15;
  if (department) confidenceScore += 10;
  if (speaker) confidenceScore += 15;
  if (eventType) confidenceScore += 15;

  return {
    title: title || '',
    department: department || '',
    organizer: organizer || '',
    eventType,
    speaker: speaker || '',
    designation: designation || '',
    date: date || '',
    time: time || '',
    venue: venue || '',
    audience,
    description: description || '',
    confidence: confidenceScore
  };
}
