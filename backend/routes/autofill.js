import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import pg from 'pg'; // PostgreSQL client
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Database Connection Pool configuration (to be configured in environment)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// In-memory rate limiting map for production API stability
const ipLimits = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  
  if (!ipLimits.has(ip)) {
    ipLimits.set(ip, []);
  }
  
  const timestamps = ipLimits.get(ip);
  // Keep only active timestamps within the current window
  const activeTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Rate limit exceeded. You can only perform 5 extraction requests per minute.',
      fallbackNeeded: true
    });
  }
  
  activeTimestamps.push(now);
  ipLimits.set(ip, activeTimestamps);
  next();
};

// Configurable API key check for production security
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

/**
 * Pure JavaScript Levenshtein Distance Calculator
 * Avoids external dependency bloat and makes the file self-contained.
 */
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

/**
 * Performs fuzzy correction patching against global historical corrections.
 */
async function applyHistoricalCorrections(rawResult, fingerprint) {
  const patched = { ...rawResult };
  patched.confidence = { ...rawResult.confidence };
  const fields = ['eventTitle', 'department', 'organizedBy', 'venue', 'audience'];

  try {
    // 1. Check for exact document matches first (Fingerprint match)
    if (fingerprint) {
      const exactQuery = await pool.query(
        'SELECT field, corrected FROM user_corrections WHERE fingerprint = $1',
        [fingerprint]
      );
      
      if (exactQuery.rows.length > 0) {
        exactQuery.rows.forEach(row => {
          patched[row.field] = row.corrected;
          patched.confidence[row.field] = 1.0; // Mark as 100% accurate since user set it previously
        });
        return patched;
      }
    }

    // 2. Perform fuzzy global matching for each text field
    for (const field of fields) {
      const predictedValue = patched[field];
      if (!predictedValue || typeof predictedValue !== 'string') continue;

      // Query the top most common corrections for this field
      const dictionary = await pool.query(
        'SELECT DISTINCT predicted, corrected, occurrence_count FROM user_corrections WHERE field = $1 ORDER BY occurrence_count DESC LIMIT 30',
        [field]
      );

      for (const row of dictionary.rows) {
        const distance = getLevenshteinDistance(predictedValue.toLowerCase(), row.predicted.toLowerCase());
        const maxLength = Math.max(predictedValue.length, row.predicted.length);
        const similarity = maxLength > 0 ? (1 - distance / maxLength) : 1.0;

        // Apply correction if similarity matches threshold
        if (similarity > 0.88) {
          patched[field] = row.corrected;
          // Boost confidence score dynamically
          patched.confidence[field] = Math.min(0.98, parseFloat(patched.confidence[field]) + 0.15);
          break;
        }
      }
    }
  } catch (err) {
    console.error('Error applying user feedback corrections:', err.message);
  }

  return patched;
}

const responseSchema = {
  type: "object",
  properties: {
    eventTitle: { type: "string", description: "Official title of the event" },
    department: { type: "string", description: "The organizing department" },
    organizedBy: { type: "string", description: "The organizing body/club/association" },
    eventType: { type: "string", description: "Type of event (Workshop, Seminar, Guest Lecture, Webinar, etc.)" },
    date: { type: "string", description: "Event date" },
    time: { type: "string", description: "Event time" },
    venue: { type: "string", description: "Event venue" },
    audience: { type: "string", description: "Target audience" },
    briefDescription: { type: "string", description: "One sentence topic description" },
    speakers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          designation: { type: "string" },
          organization: { type: "string" }
        },
        required: ["name"]
      }
    },
    generatedContent: {
      type: "object",
      properties: {
        objectiveDescription: { type: "string" },
        eventSummary: { type: "string" },
        summaryPoints: { type: "array", items: { type: "string" } },
        keyProgramOutcomes: { type: "array", items: { type: "string" } }
      },
      required: ["objectiveDescription", "eventSummary", "summaryPoints", "keyProgramOutcomes"]
    },
    confidence: {
      type: "object",
      properties: {
        eventTitle: { type: "number" },
        department: { type: "number" },
        date: { type: "number" },
        venue: { type: "number" },
        speakers: { type: "number" }
      },
      required: ["eventTitle", "department", "date", "venue", "speakers"]
    },
    validation: {
      type: "object",
      properties: {
        missingFields: { type: "array", items: { type: "string" } },
        uncertainFields: { type: "array", items: { type: "string" } }
      },
      required: ["missingFields", "uncertainFields"]
    }
  },
  required: ["eventTitle", "eventType", "generatedContent", "confidence", "validation"]
};

const systemInstruction = `You are the extraction and report generation engine for the KPRCAS Event Report Generator.
Your task is to analyze the uploaded event poster and return structured JSON matching the schema.

STRICT INTEGRITY RULES:
1. Grounding: Do NOT invent names, dates, times, or venues. If a field is not visible in the flyer, return null.
2. Participant Counts: Always map participant count or student numbers to null if not explicitly printed.
3. Event Classification: Map eventType strictly to one of the following: "Workshop", "Seminar", "Guest Lecture", "Webinar", "Faculty Development Programme", "Hackathon", "Symposium", "Conference", "Placement Activity", "Sports Event", "Cultural Event".
4. Content Generation: 
   - objectiveDescription: Explain the educational goal of this topic.
   - eventSummary: Write a report-style narrative summarizing the speaker's topic, department, and date. Use safe wording: do NOT state that activities or demonstrations happened unless they are explicitly written on the flyer.
   - keyProgramOutcomes: Generate 3-4 professional learning outcomes.
5. In validation.uncertainFields, note any fields where text was pixelated or ambiguous.
6. Output JSON only. No code block wrappers, markdown formatting, or conversational text.`;

router.post('/extract', rateLimitMiddleware, authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fingerprint = req.body.fingerprint || null;
  const ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8000';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not configured. Falling back to PaddleOCR.');
  }

  // Try Gemini Vision API first
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const filePart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType: req.file.mimetype
        }
      };

      console.log('Routing autofill request to Gemini 1.5 Flash API');
      const result = await model.generateContent([
        "Analyze this event circular/poster and return the structured JSON data.",
        filePart
      ]);

      const responseText = result.response.text();
      const visionData = JSON.parse(responseText);

      const ext = visionData || {};
      const gen = visionData.generatedContent || {};

      const mappedResult = {
        eventTitle: ext.eventTitle || '',
        department: ext.department || '',
        organizedBy: ext.organizedBy || '',
        eventType: ext.eventType || '',
        date: ext.date || '',
        time: ext.time || '',
        venue: ext.venue || '',
        audience: ext.audience || 'Students & Faculty',
        briefDescription: ext.briefDescription || '',
        speakers: ext.speakers ? ext.speakers.map(s => ({
          name: s.name || '',
          designation: s.designation || '',
          organization: s.organization || ''
        })) : [],
        generatedContent: {
          objectiveDescription: gen.objectiveDescription || '',
          eventSummary: gen.eventSummary || '',
          summaryPoints: gen.summaryPoints || [],
          keyProgramOutcomes: gen.keyProgramOutcomes || []
        },
        confidence: {
          eventTitle: ext.confidence?.eventTitle ?? 0.8,
          department: ext.confidence?.department ?? 0.8,
          date: ext.confidence?.date ?? 0.8,
          venue: ext.confidence?.venue ?? 0.8,
          speakers: ext.confidence?.speakers ?? 0.8,
        },
        warnings: ext.validation?.missingFields || [],
        ocrMethod: 'Gemini-1.5-Flash'
      };

      // Apply historical corrections mapping
      const finalResult = await applyHistoricalCorrections(mappedResult, fingerprint);
      return res.status(200).json(finalResult);

    } catch (geminiError) {
      console.warn('Gemini API extraction failed, falling back to PaddleOCR:', geminiError.message);
    }
  }

  // Fallback to PaddleOCR
  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log(`Routing fallback request to PaddleOCR: ${ocrServiceUrl}/api/v1/ocr/process`);
    const ocrResponse = await axios.post(
      `${ocrServiceUrl}/api/v1/ocr/process`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'x-api-key': process.env.OCR_SERVICE_TOKEN || '',
        },
        timeout: 10000, // 10s maximum timeout
      }
    );

    const extraction = ocrResponse.data;
    extraction.ocrMethod = 'PaddleOCR';

    const finalResult = await applyHistoricalCorrections(extraction, fingerprint);
    return res.status(200).json(finalResult);

  } catch (ocrError) {
    console.error('All backend autofill options failed:', ocrError.message);
    
    // Fallback to client-side Tesseract
    return res.status(503).json({
      error: 'Backend autofill service is offline.',
      fallbackNeeded: true,
      details: ocrError.message
    });
  }
});

/**
 * POST /api/autofill/feedback
 * Records user corrections to the database.
 */
router.post('/feedback', async (req, res) => {
  const { fingerprint, field, predicted, corrected } = req.body;

  if (!field || predicted === undefined || corrected === undefined) {
    return res.status(400).json({ error: 'Missing feedback properties.' });
  }

  // Prevent logging feedback if value has not actually changed
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
    console.error('Feedback recording database error:', error.message);
    return res.status(500).json({ error: 'Database saving failure.' });
  }
});

router.get('/health', async (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  return res.json({
    status: hasApiKey ? 'ok' : 'degraded',
    provider: 'google',
    model: 'gemini-1.5-flash',
    available: hasApiKey
  });
});

export default router;
