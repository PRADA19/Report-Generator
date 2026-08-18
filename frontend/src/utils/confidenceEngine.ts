/**
 * Utility to calculate field-level confidence ratings (0-100) for extracted metadata.
 * Used primarily for the client-side fallback OCR/Parser pipeline.
 */

import { EVENT_KEYWORDS } from "./posterParser";

const DEPT_KEYWORDS = [
  "computer science", "information technology", "computer applications",
  "data science", "artificial intelligence", "mechanical", "electrical",
  "civil", "business", "commerce", "english", "mathematics", "physics"
];

const VENUE_KEYWORDS = [
  "seminar hall", "auditorium", "conference hall", "lab", "block", "campus",
  "zoom", "google meet", "teams", "online"
];

export function calculateFieldConfidence(
  field: string,
  value: string,
  sourceLine: string = ""
): number {
  if (!value || value.trim() === "") return 0;
  
  const valLower = value.toLowerCase().trim();
  const srcLower = sourceLine.toLowerCase().trim();
  let score = 50; // Baseline starting score

  switch (field) {
    case "eventTitle":
      // Boost if it contains event indicators
      const hasEventKeyword = EVENT_KEYWORDS.some(k => valLower.includes(k));
      if (hasEventKeyword) score += 30;
      
      // Penalize default placeholder
      if (valLower === "academic event" || valLower === "untitled event") {
        score -= 40;
      }
      
      // Boost if in Title/Capital Case
      if (/^[A-Z0-9\s,\-.:'"]+$/.test(value)) {
        score += 10; // All caps
      } else if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(value)) {
        score += 15; // Title Case
      }
      break;

    case "department":
      // Boost if explicitly labeled "Department of..."
      if (srcLower.includes("department of") || srcLower.includes("dept. of")) {
        score += 35;
      }
      // Check for common department domains
      const hasDeptKeyword = DEPT_KEYWORDS.some(k => valLower.includes(k));
      if (hasDeptKeyword) score += 15;
      
      if (valLower === "information technology" && srcLower === "") {
        score -= 20; // Default fallback penalty
      }
      break;

    case "date":
      // Check standard date formats: "12 August 2026", "12/08/2026"
      const dateRegex1 = /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/;
      const dateRegex2 = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}\b/;
      
      if (dateRegex1.test(value)) {
        score += 40;
      } else if (dateRegex2.test(value)) {
        score += 25;
      }
      
      if (srcLower.includes("date:")) {
        score += 10;
      }
      
      if (valLower === "18 september 2026") {
        score -= 20; // Fallback penalty
      }
      break;

    case "time":
      // Range format: "10:00 AM – 4:00 PM"
      const timeRangeRegex = /\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:–|-|to)\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)/i;
      if (timeRangeRegex.test(value)) {
        score += 40;
      }
      
      if (srcLower.includes("time:")) {
        score += 10;
      }
      break;

    case "venue":
      const hasVenueKeyword = VENUE_KEYWORDS.some(k => valLower.includes(k));
      if (hasVenueKeyword) score += 30;
      
      if (srcLower.includes("venue:")) {
        score += 20;
      }
      
      if (valLower === "seminar hall" && srcLower === "") {
        score -= 20; // Fallback penalty
      }
      break;

    case "speaker":
    case "speakers":
      // Academic prefixes
      const hasPrefix = /\b(dr|prof|mr|ms|mrs)\./i.test(value);
      if (hasPrefix) score += 35;
      
      if (srcLower.includes("speaker") || srcLower.includes("resource person") || srcLower.includes("chief guest")) {
        score += 15;
      }
      
      if (valLower === "guest speaker" || valLower === "resource person") {
        score -= 30; // Fallback penalty
      }
      break;

    default:
      break;
  }

  // Cap scores between 10 and 100
  return Math.min(100, Math.max(10, score));
}
