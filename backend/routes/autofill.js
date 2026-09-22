import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import pg from 'pg'; // PostgreSQL client
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

let lastGeminiStatus = 'ONLINE';

// Database Connection Pool configuration
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Rate limiting map
const ipLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  if (!ipLimits.has(ip)) {
    ipLimits.set(ip, []);
  }
  const timestamps = ipLimits.get(ip);
  const activeTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    lastGeminiStatus = 'QUOTA_EXCEEDED';
    return res.status(429).json({
      status: 'QUOTA_EXCEEDED',
      error: 'AI request limit reached. Please wait 60 seconds before trying again.',
      retryAfter: 60,
      fallbackNeeded: true
    });
  }

  req.isApproachingRateLimit = activeTimestamps.length >= 7;
  activeTimestamps.push(now);
  ipLimits.set(ip, activeTimestamps);
  next();
};

const authMiddleware = (req, res, next) => {
  const apiKey = process.env.API_KEY;
  if (apiKey) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing API Key.' });
    }
  }
  next();
};

const getModelName = () => {
  const model = process.env.GEMINI_MODEL;
  if (model && model.trim() !== '') {
    return model.trim();
  }
  return 'gemini-3.6-flash';
};

function getApiKeys(req) {
  const keys = [];
  const cleanKey = k => k ? k.trim().replace(/^['"]|['"]$/g, '') : '';
  const headerKey = req && req.headers ? req.headers['x-gemini-api-key'] : null;
  if (headerKey && headerKey.trim()) {
    keys.push(...headerKey.split(',').map(cleanKey).filter(Boolean));
  }
  if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(',').map(cleanKey).filter(Boolean);
    keys.push(...list);
  }
  if (process.env.GEMINI_API_KEY) {
    const list = process.env.GEMINI_API_KEY.split(',').map(cleanKey).filter(Boolean);
    list.forEach(k => {
      if (k && !keys.includes(k)) {
        keys.push(k);
      }
    });
  }
  return keys.filter(k => k && !k.includes('YOUR_GEMINI_API_KEY'));
}

function getLevenshteinDistance(s, t) {
  if (!s) return t ? t.length : 0;
  if (!t) return s ? s.length : 0;
  const m = s.length;
  const n = t.length;
  const d = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[m][n];
}

export function sanitizeField(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  const placeholders = [
    'null', 'unknown', 'not specified', 'none', '', 'n/a', 'tbd', 'tba',
    'to be announced', 'academic event', 'guest speaker', 'resource person',
    'invited organization', 'unknown speaker', 'untitled event', 'placeholder',
    'not mentioned', 'students and faculty', 'all students and faculty'
  ];
  if (placeholders.includes(lower)) {
    return null;
  }
  return s;
}

export function sanitizeAudience(val) {
  const cleaned = sanitizeField(val);
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  if (
    lower === 'students and faculty' ||
    lower === 'all students and faculty' ||
    lower === 'faculty and students' ||
    lower === 'academic event' ||
    lower === 'general'
  ) {
    return null;
  }
  return cleaned;
}

export function sanitizeQualification(val) {
  let cleaned = sanitizeField(val);
  if (!cleaned) return null;
  cleaned = cleaned.replace(/[^\x00-\x7F]+/g, '').trim();
  cleaned = cleaned.replace(/^(?:[\d\s\/]*qualification\s*string\s*:?|qualification\s*:?)\s*/i, '').trim();
  if (/\bor\b/i.test(cleaned)) {
    cleaned = cleaned.split(/\s+\bor\b\s+/i)[0].trim();
  }
  cleaned = cleaned.replace(/^[\d\s\/]+/, '').trim();
  return cleaned || null;
}

export function validateStage1Facts(rawFacts) {
  const ext = rawFacts || {};
  
  // Clean event title: strip leading context preambles like "An IPR event on", "A Workshop on", etc.
  let rawTitle = sanitizeField(ext.eventTitle) || '';
  if (rawTitle) {
    rawTitle = rawTitle.replace(/^(an?\s+[a-z0-9\s\-]+\s+event\s+on|a\s+(national|international\s+)?(workshop|seminar|webinar|fdp|guest\s+lecture)\s+on)\s+/i, '').trim();
  }

  // Filter out college main institution name from organizingBody if confused with college header
  let rawBody = sanitizeField(ext.organizingBody || ext.organizedBy);
  if (rawBody && /kpr\s+college|kprcas/i.test(rawBody) && !/association|club|society|school\s+of/i.test(rawBody)) {
    rawBody = null;
  }

  // Filter out pure college address from venue while preserving legitimate venues
  let rawVenue = sanitizeField(ext.venue);
  if (rawVenue && /avinashi\s+road|arasur|coimbatore\s*[-–]\s*641/i.test(rawVenue) && !/hall|lab|auditorium|center|centre|room|block|classroom|audi/i.test(rawVenue)) {
    rawVenue = null;
  }

  return {
    eventTitle: rawTitle || null,
    eventType: sanitizeField(ext.eventType),
    organizingBody: rawBody,
    collaborators: Array.isArray(ext.collaborators) ? ext.collaborators.map(sanitizeField).filter(b => b && !/sdg|quality\s+education|partnerships\s+for\s+the\s+goals|un\s+sdg/i.test(b)) : [],
    organizingDepartment: sanitizeField(ext.organizingDepartment || ext.department),
    eventStartDate: sanitizeField(ext.eventStartDate || ext.date),
    eventEndDate: sanitizeField(ext.eventEndDate),
    registrationDeadline: sanitizeField(ext.registrationDeadline),
    eventStartTime: sanitizeField(ext.eventStartTime || ext.time),
    eventEndTime: sanitizeField(ext.eventEndTime),
    registrationStartTime: sanitizeField(ext.registrationStartTime),
    venue: rawVenue,
    participants: typeof ext.participants === 'number' && !isNaN(ext.participants) ? ext.participants : (typeof ext.attendance === 'number' && !isNaN(ext.attendance) ? ext.attendance : null),
    resourcePersons: Array.isArray(ext.resourcePersons || ext.speakers) ? (ext.resourcePersons || ext.speakers).map(s => {
      let rawName = sanitizeField(s.name);
      let rawDesig = sanitizeField(s.designation);
      if (rawName && rawDesig) {
        const escapedDesig = rawDesig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const desigRegex = new RegExp(`\\s*\\(${escapedDesig}\\)`, 'gi');
        rawName = rawName.replace(desigRegex, '').trim();
      }
      return {
        name: rawName,
        qualification: sanitizeQualification(s.qualification),
        designation: rawDesig,
        organization: sanitizeField(s.organization)
      };
    }).filter(s => s.name !== null) : []
  };
}

export function validateStage2Narratives(rawGen, facts) {
  const gen = rawGen || {};
  const f = facts || {};

  let obj = sanitizeField(gen.objectiveDescription) || '';
  let summary = sanitizeField(gen.eventSummary) || '';
  let participation = sanitizeField(gen.participationDetails) || '';
  let outcomes = Array.isArray(gen.keyProgramOutcomes) ? gen.keyProgramOutcomes.map(sanitizeField).filter(Boolean) : [];
  let highlights = Array.isArray(gen.summaryPoints) ? gen.summaryPoints.map(sanitizeField).filter(Boolean) : [];
  let conclusion = sanitizeField(gen.conclusion) || '';

  const splitSentences = (text) => {
    if (!text) return [];
    const parts = text.split(/(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|Sr|Jr|vs|etc))\.(?=\s+[A-Z]|\s*$)/i);
    return parts.map(s => s.trim()).filter(Boolean).map(s => s.endsWith('.') ? s : s + '.');
  };

  // Paragraph Deduplication Helper
  const dedupeParagraph = (text) => {
    if (!text) return text;
    const rawSentences = splitSentences(text);
    const uniqueSentences = [];
    const seen = new Set();

    for (const sentence of rawSentences) {
      const normalized = sentence.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(normalized) && normalized.length > 10) {
        seen.add(normalized);
        uniqueSentences.push(sentence);
      }
    }
    return uniqueSentences.join(' ');
  };

  // Array Deduplication Helper
  const dedupeArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    const result = [];
    for (const item of arr) {
      if (!item) continue;
      const normalized = String(item).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalized.length > 5 && !seen.has(normalized)) {
        seen.add(normalized);
        result.push(item);
      }
    }
    return result;
  };

  obj = dedupeParagraph(obj);
  summary = dedupeParagraph(summary);

  // Cross-section sentence deduplication: remove any sentence from summary that already appears in obj
  if (obj && summary) {
    const objNormalizedSentences = new Set(
      splitSentences(obj)
        .map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(s => s.length > 10)
    );

    const summarySentences = splitSentences(summary);
    const filteredSummarySentences = summarySentences.filter(s => {
      const norm = s.toLowerCase().replace(/[^a-z0-9]/g, '');
      return !objNormalizedSentences.has(norm);
    });

    if (filteredSummarySentences.length > 0) {
      summary = filteredSummarySentences.join(' ');
    }
  }

  // Cap Purpose of Event paragraph to maximum 5 sentences (within 5 lines)
  if (obj) {
    const objSentences = obj.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    if (objSentences.length > 5) {
      obj = objSentences.slice(0, 5).join(' ');
    }
  }

  // Enforce Maximum 5 Distinct, Valuable Summary Points
  highlights = dedupeArray(highlights).slice(0, 5);
  if (highlights.length === 0 && summary) {
    highlights = summary
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);
    highlights = dedupeArray(highlights).slice(0, 5);
  }

  // 2. Enforce Distinct Dimension-Labeled Outcome Points
  const requiredDimensions = [
    { key: 'Subject & Domain Awareness', defaultText: 'Gain a comprehensive understanding of subject concepts and its significance in the domain.' },
    { key: 'Conceptual Clarity', defaultText: 'Acquire practical knowledge on key principles, methodologies, and technical frameworks.' },
    { key: 'Practical Insight', defaultText: 'Learn systematic processes and practical insights for real-world applications.' },
    { key: 'Domain Competence', defaultText: 'Understand structural requirements and specialized documentation processes.' },
    { key: 'Professional Exposure', defaultText: 'Recognize strategic career and institutional development opportunities in the field.' },
    { key: 'Problem Solving & Application', defaultText: 'Identify actionable methods for converting academic concepts into practical solutions.' },
    { key: 'Future Scope', defaultText: 'Develop the capability to navigate domain workflows and future innovation opportunities with confidence.' }
  ];

  const formattedOutcomes = [];
  if (outcomes.length > 0) {
    const dedupedOutcomes = dedupeArray(outcomes);
    dedupedOutcomes.forEach((point) => {
      if (point && point.trim()) {
        formattedOutcomes.push(point.trim());
      }
    });
  } else if (obj || summary) {
    requiredDimensions.forEach((dim) => {
      formattedOutcomes.push(`${dim.key}: ${dim.defaultText}`);
    });
  }

  // Post-processing ground truth validation against Stage 1 facts:
  // If venue is null in Stage 1 facts, strip any hallucinated venue mentions
  if (!f.venue) {
    const venueRegex = /\s*at (the )?(computer lab|seminar hall|auditorium|main hall|conference room|campus)\b/gi;
    obj = obj.replace(venueRegex, '').trim();
    summary = summary.replace(venueRegex, '').trim();
    conclusion = conclusion.replace(venueRegex, '').trim();
  }

  // If resourcePersons is empty in Stage 1 facts, strip hallucinated speaker claims
  if (!f.resourcePersons || f.resourcePersons.length === 0) {
    const speakerRegex = /\s*(under the guidance of|led by|delivered by|speaker)\s+Dr\.\s+[A-Za-z]+/gi;
    obj = obj.replace(speakerRegex, '').trim();
    summary = summary.replace(speakerRegex, '').trim();
  }

  return {
    objectiveDescription: obj,
    eventSummary: summary,
    participationDetails: participation,
    keyProgramOutcomes: formattedOutcomes,
    summaryPoints: highlights,
    conclusion: conclusion
  };
}

async function applyHistoricalCorrections(rawResult, fingerprint) {
  const patched = { ...rawResult };
  patched.confidence = { ...(rawResult.confidence || {}) };
  const fields = ['eventTitle', 'organizingDepartment', 'organizingBody', 'venue'];

  try {
    if (fingerprint) {
      const exactQuery = await pool.query(
        'SELECT field, corrected FROM user_corrections WHERE fingerprint = $1',
        [fingerprint]
      );
      if (exactQuery.rows.length > 0) {
        exactQuery.rows.forEach(row => {
          if (patched[row.field] !== null) {
            patched[row.field] = row.corrected;
            patched.confidence[row.field] = 1.0;
          }
        });
        return patched;
      }
    }

    for (const field of fields) {
      const predictedValue = patched[field];
      if (!predictedValue || typeof predictedValue !== 'string') continue;

      const dictionary = await pool.query(
        'SELECT DISTINCT predicted, corrected, occurrence_count FROM user_corrections WHERE field = $1 ORDER BY occurrence_count DESC LIMIT 30',
        [field]
      );

      for (const row of dictionary.rows) {
        const distance = getLevenshteinDistance(predictedValue.toLowerCase(), row.predicted.toLowerCase());
        const maxLength = Math.max(predictedValue.length, row.predicted.length);
        const similarity = maxLength > 0 ? (1 - distance / maxLength) : 1.0;

        if (similarity > 0.88) {
          patched[field] = row.corrected;
          patched.confidence[field] = Math.min(0.98, parseFloat(patched.confidence[field] || 0.8) + 0.15);
          break;
        }
      }
    }
  } catch (err) {
    // Database connection error ignored safely
  }

  return patched;
}

const stage1Schema = {
  type: "OBJECT",
  properties: {
    eventTitle: { type: "STRING" },
    eventType: { type: "STRING" },
    organizingBody: { type: "STRING" },
    organizingDepartment: { type: "STRING" },
    collaborators: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    eventStartDate: { type: "STRING" },
    eventEndDate: { type: "STRING" },
    registrationDeadline: { type: "STRING" },
    eventStartTime: { type: "STRING" },
    eventEndTime: { type: "STRING" },
    registrationStartTime: { type: "STRING" },
    venue: { type: "STRING" },
    resourcePersons: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          qualification: { type: "STRING" },
          designation: { type: "STRING" },
          organization: { type: "STRING" }
        }
      }
    },
    participants: { type: "NUMBER" }
  },
  required: ["eventTitle", "eventType", "resourcePersons", "collaborators"]
};

const stage1SystemInstruction = `You are the FlowNest / KPRCAS Institutional Report Auto Fill Engine.
Your primary task is to read, scan, and visually analyze EVERY SINGLE SECTION of the uploaded event poster with maximum precision.

THE UPLOADED POSTER IS THE ONLY SOURCE OF TRUTH.

COMPREHENSIVE MULTI-ZONE POSTER ANALYSIS DIRECTIVES:

1. FULL DOCUMENT SCANNING & VISUAL REGION PARSING:
   - Scan top banners, institutional headers, sub-headers, main title graphics, central body text, side panels, speaker card boxes, date/time icons, room/venue chips, footers, and fine print.
   - Do NOT skip any text on the poster. Pay close attention to speaker credentials (qualifications, job titles, company names, cities), target audiences, topic agendas, registration details, and organizing departments/clubs.

2. EVENT TYPE CLASSIFICATION & DOMAIN UNDERSTANDING:
   - Identify the exact type of event from explicit keywords or visual layout context:
     * "Workshop" / "Hands-on Training" / "Bootcamp" / "Hackathon"
     * "Guest Lecture" / "Expert Talk" / "Keynote Address"
     * "Seminar" / "Webinar" / "Tech Talk"
     * "FDP" (Faculty Development Program) / "STTP" (Short Term Training Program)
     * "IPR Event" / "Patent Awareness" / "Innovation & Entrepreneurship"
     * "Conference" / "Symposium" / "Paper Presentation"
     * "Industrial Visit" / "Field Trip"
     * "Placement Drive" / "Career Fair" / "Competition"
   - Extract the event topic and specific subject domain (e.g. AI/ML, Cloud Computing, Cyber Security, IPR/Patents, VLSI, Data Analytics, Soft Skills, Design Thinking).

3. PRECISE FIELD EXTRACTION DIRECTIVES:
   - Event Title ("eventTitle"): Extract ONLY the core event subject/topic headline. Omit preambles like "A National Level Workshop on" or "An IPR Event on".
   - Event Type ("eventType"): Return the exact classified event type (e.g. "Workshop", "Guest Lecture", "Seminar", "FDP", "IPR Event", "Webinar", "Conference", "Symposium", "Industrial Visit").
   - Organizing Body ("organizingBody"): The specific student association, club, or committee (e.g., "Association of Computing Engineers", "IIC Cell"). Do NOT confuse top institution branding ("KPRCAS") with organizing body.
   - Organizing Department ("organizingDepartment"): The academic department (e.g. "Department of Information Technology").
   - Collaborators ("collaborators"): List external institutions, industry partners, or professional chapters (e.g. IEEE, ACM, CSI). UN SDG icons (e.g. "Goal 4") are NOT collaborators.
   - Resource Persons ("resourcePersons"): For each speaker, extract name (with Dr./Prof./Mr./Ms.), academic qualifications (e.g. M.Tech, Ph.D.), current designation (e.g. Senior Data Scientist), company/institution, and location.
   - Event Date ("eventStartDate" & "eventEndDate"): Extract exact event dates (e.g. "15-08-2026").
   - Event Time ("eventStartTime" & "eventEndTime"): Extract exact event execution times.
   - Registration Details ("registrationDeadline", "registrationStartTime"): Keep registration dates separate from event execution dates.
   - Venue ("venue"): Specific hall, room, or lab (e.g. "Seminar Hall 2", "Lab 4"). Do NOT extract college address as venue.
   - Participants ("participants"): Numeric count ONLY if explicitly printed on poster. Otherwise return null.

4. ABSOLUTE GROUNDING & NULL RULE:
   - If a detail is missing from the poster, return null (or [] for arrays). Never fabricate data or infer non-existent facts.`;

const stage2Schema = {
  type: "OBJECT",
  properties: {
    objectiveDescription: { type: "STRING" },
    eventSummary: { type: "STRING" },
    participationDetails: { type: "STRING" },
    keyProgramOutcomes: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    summaryPoints: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    conclusion: { type: "STRING" }
  },
  required: ["objectiveDescription", "eventSummary", "keyProgramOutcomes", "summaryPoints"]
};

const stage2SystemInstruction = `You are the FlowNest / KPRCAS Formal Academic Report Generator.
You are given a validated JSON object containing factual details extracted from an event poster.

EVENT-SPECIFIC & DYNAMIC REPORT GENERATION DIRECTIVES:

1. DYNAMIC TAILORING BY EVENT TYPE:
   - WORKSHOP / HANDS-ON TRAINING / HACKATHON:
     Focus on practical skill building, software tools demonstrated, step-by-step technical implementation, hands-on exercises, problem solving, and project creation.
   - GUEST LECTURE / EXPERT TALK / WEBINAR:
     Focus on industry expert insights, real-world case studies, current technological trends, domain knowledge transfer, and interactive Q&A discussion with the speaker.
   - FDP / STTP (FACULTY DEVELOPMENT PROGRAM):
     Focus on pedagogical strategies, advanced research methodologies, teaching tools, curriculum design, and academic leadership for faculty members.
   - SEMINAR / WEBINAR:
     Focus on theoretical foundations, domain awareness, conceptual framework, and academic discussion.
   - IPR / PATENT / STARTUP / ENTREPRENEURSHIP EVENT:
     Focus on intellectual property rights, patent application procedures, novelty search, commercialization strategies, and innovation ecosystems.
   - CONFERENCE / SYMPOSIUM / COMPETITION:
     Focus on scholarly paper presentations, research peer review, competitive problem solving, and domain excellence.
   - INDUSTRIAL VISIT / FIELD TRIP:
     Focus on industrial machinery, real-world manufacturing/software workflows, operational safety, and field observation.

2. PURPOSE OF THE EVENT ("objectiveDescription"):
   Generate a concise, formal academic Purpose paragraph of WITHIN 5 LINES (maximum 4 to 5 sentences) tailored specifically to the event type and topic.
   - Focus exclusively on WHY the event was initiated: academic/industry rationale, core learning objectives, target audience skill development, and domain significance.
   - DO NOT start with "The Department of ... organized ..." or repeat event dates/venues. Focus on learning goals and rationale.
   - Ensure zero redundant or repeated sentences.

3. DETAILED EVENT SUMMARY ("summaryPoints" & "eventSummary"):
   Generate MAXIMUM 5 VALUABLE POINTS (NOT MORE THAN 5 POINTS) for "summaryPoints" and a 4-to-5-sentence paragraph for "eventSummary":
   - Focus exclusively on WHAT occurred during event execution: guest speaker insights, key technical topics demonstrated, hands-on activities, and participant interaction.
   - DO NOT re-state the Purpose learning goals or rationale. Maintain a distinct execution-focused perspective.`;

const uploadAny = upload.any();

const handleUpload = (req, res, next) => {
  uploadAny(req, res, (err) => {
    if (err) {
      console.warn('Multer upload parsing warning:', err.message);
    }
    next();
  });
};

router.post(['/', '/extract'], handleUpload, rateLimitMiddleware, authMiddleware, async (req, res) => {
  try {
    const file = req.file || (Array.isArray(req.files) && req.files.length > 0 ? req.files[0] : (req.files && (req.files.poster?.[0] || req.files.file?.[0])));
    if (!file) {
      return res.status(400).json({ error: 'No poster image file provided.' });
    }

  const apiKeys = getApiKeys(req);
  if (apiKeys.length === 0) {
    lastGeminiStatus = 'OFFLINE';
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured in backend environment or request headers.',
      fallbackNeeded: true
    });
  }

  const base64Image = file.buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';
  const configuredModel = getModelName();
  const modelCandidates = Array.from(new Set([configuredModel, 'gemini-3.6-flash', 'gemini-flash-latest'])).filter(Boolean);

  let stage1Facts = null;
  let stage2Narratives = null;
  let lastError = null;

  keyLoop: for (let i = 0; i < apiKeys.length; i++) {
    const currentApiKey = apiKeys[i];
    const genAI = new GoogleGenerativeAI(currentApiKey);

    for (const targetModel of modelCandidates) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          if (attempt > 1) {
            await new Promise(r => setTimeout(r, 1500));
          }

          const model = genAI.getGenerativeModel({
            model: targetModel,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: stage1Schema,
              temperature: 0.1
            },
            systemInstruction: stage1SystemInstruction
          });

          const imagePart = {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          };

          const result1 = await model.generateContent([
            imagePart,
            'Analyze this event poster image and extract all factual details matching the JSON schema.'
          ]);
          const text1 = result1.response.text();
          const rawStage1 = JSON.parse(text1);
          stage1Facts = validateStage1Facts(rawStage1);

          // Stage 2: Narrative Generation
          const model2 = genAI.getGenerativeModel({
            model: targetModel,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: stage2Schema,
              temperature: 0.2
            },
            systemInstruction: stage2SystemInstruction
          });

          const result2 = await model2.generateContent([
            `Based ONLY on these extracted event facts: ${JSON.stringify(stage1Facts)}, generate the Purpose, Summary, and Program Outcomes paragraphs/bullet points matching the JSON schema.`
          ]);
          const text2 = result2.response.text();
          const rawStage2 = JSON.parse(text2);
          stage2Narratives = validateStage2Narratives(rawStage2, stage1Facts);

          // If successful, update status and break out of loops
          lastGeminiStatus = req.isApproachingRateLimit ? 'QUOTA_WARNING' : 'ONLINE';
          lastError = null;
          break keyLoop;
        } catch (err) {
          lastError = err;
          const errMsg = err.message || '';
          console.warn(`Gemini API key index ${i}, model ${targetModel} (attempt ${attempt}) failed: ${errMsg}`);
          if (errMsg.includes('404') || errMsg.includes('not found') || errMsg.includes('no longer available')) {
            break; // Skip attempt 2 for non-existent/deprecated model
          }
          if (errMsg.includes('Quota') || errMsg.includes('429') || errMsg.includes('limit') || errMsg.includes('exhausted')) {
            break; // Skip remaining model attempts for this key if quota exhausted
          }
        }
      }
    }
  }

  if (!stage1Facts || !stage2Narratives) {
    const errMsg = lastError ? lastError.message : 'Unknown Gemini error';
    if (errMsg.includes('Quota') || errMsg.includes('429') || errMsg.includes('limit') || errMsg.includes('exhausted')) {
      lastGeminiStatus = 'QUOTA_EXCEEDED';
      return res.status(429).json({
        status: 'QUOTA_EXCEEDED',
        error: "Today's Gemini AI daily quota limit has been reached on configured API keys. You can add another free key or upgrade billing in Google AI Studio.",
        retryAfter: 60,
        fallbackNeeded: true
      });
    }
    lastGeminiStatus = 'OFFLINE';
    return res.status(500).json({
      error: `Gemini API execution failed: ${errMsg}`,
      fallbackNeeded: true
    });
  }

  const combinedResult = {
    ...stage1Facts,
    ...stage2Narratives,
    confidence: {
      eventTitle: 0.95,
      eventType: 0.95,
      organizingDepartment: 0.92,
      organizingBody: 0.90,
      resourcePersons: 0.95,
      eventStartDate: 0.95,
      venue: 0.90,
      objectiveDescription: 0.95,
      eventSummary: 0.95,
      keyProgramOutcomes: 0.95,
      summaryPoints: 0.95
    }
  };

  const fingerprint = req.body ? req.body.fingerprint : null;
  const finalResult = await applyHistoricalCorrections(combinedResult, fingerprint);

  return res.json({
    status: 'success',
    data: finalResult,
    quotaWarning: req.isApproachingRateLimit
  });
  } catch (globalErr) {
    console.error('Unhandled autofill extraction error:', globalErr);
    lastGeminiStatus = 'OFFLINE';
    return res.status(500).json({
      error: `Autofill processing error: ${globalErr.message || globalErr}`,
      fallbackNeeded: true
    });
  }
});

router.post('/feedback', async (req, res) => {
  const { fingerprint, field, predicted, corrected } = req.body;
  if (!field || predicted === undefined || corrected === undefined) {
    return res.status(400).json({ error: 'Missing feedback properties.' });
  }

  if (predicted.trim().toLowerCase() === corrected.trim().toLowerCase()) {
    return res.status(200).json({ status: 'ignored', message: 'No correction detected.' });
  }

  try {
    await pool.query(
      `INSERT INTO user_corrections (fingerprint, field, predicted, corrected, occurrence_count)
       VALUES ($1, $2, $3, $4, 1)
       ON CONFLICT (fingerprint, field, LOWER(predicted))
       DO UPDATE SET 
         corrected = EXCLUDED.corrected, 
         occurrence_count = user_corrections.occurrence_count + 1, 
         updated_at = NOW()`,
      [fingerprint, field, predicted, corrected]
    );

    return res.status(200).json({ status: 'success', message: 'Feedback correction recorded.' });
  } catch (error) {
    return res.status(500).json({ error: 'Database saving failure.' });
  }
});

router.get('/health', async (req, res) => {
  const apiKeys = getApiKeys(req);
  const model = getModelName();
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const timestamps = (ipLimits.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  const isApproachingLimit = timestamps.length >= 7;

  if (apiKeys.length === 0) {
    lastGeminiStatus = 'OFFLINE';
    return res.status(503).json({
      status: 'OFFLINE',
      provider: 'google',
      model,
      available: false,
      message: 'GEMINI_API_KEY is not configured in backend environment.'
    });
  }

  let lastHealthErr = null;
  for (const apiKey of apiKeys) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const m = genAI.getGenerativeModel({ model });
      await m.generateContent('ping');
      lastGeminiStatus = isApproachingLimit ? 'QUOTA_WARNING' : 'ONLINE';
      return res.json({
        status: lastGeminiStatus,
        provider: 'google',
        model,
        available: true,
        quotaWarning: isApproachingLimit,
        message: isApproachingLimit
          ? `Gemini AI (${model}) is connected. High usage detected.`
          : `Gemini AI (${model}) is connected and online.`
      });
    } catch (err) {
      lastHealthErr = err;
    }
  }

  const errMsg = lastHealthErr ? lastHealthErr.message : '';
  if (errMsg.includes('Quota') || errMsg.includes('429') || errMsg.includes('limit') || errMsg.includes('exhausted')) {
    lastGeminiStatus = 'QUOTA_EXCEEDED';
    return res.status(429).json({
      status: 'QUOTA_EXCEEDED',
      provider: 'google',
      model,
      available: false,
      retryAfter: 60,
      message: "Today's AI request quota has been reached on configured keys."
    });
  }

  lastGeminiStatus = 'OFFLINE';
  return res.status(500).json({
    status: 'OFFLINE',
    provider: 'google',
    model,
    available: false,
    message: `Gemini AI health check error: ${errMsg}`
  });
});

export default router;
