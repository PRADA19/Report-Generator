import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import pg from 'pg'; // PostgreSQL client

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
      return res.status(429).json({ error: 'Unauthorized: Invalid or missing API Key.' });
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

router.post('/extract', rateLimitMiddleware, authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fingerprint = req.body.fingerprint || null;
  const visionServiceUrl = process.env.VISION_SERVICE_URL || 'http://localhost:8001';
  const ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://localhost:8000';

  // Try Qwen2.5-VL Vision Service first
  try {
    const form = new FormData();
    form.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    console.log(`Routing autofill request to Vision Service: ${visionServiceUrl}/extract`);
    const visionResponse = await axios.post(
      `${visionServiceUrl}/extract`,
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 60000, // 60s timeout for vision model inference
      }
    );

    const visionData = visionResponse.data;
    const ext = visionData.extractedData || {};
    const gen = visionData.generatedContent || {};
    
    // Map Qwen structured response to old expected format for compatibility
    const mappedResult = {
      eventTitle: ext.title || '',
      department: ext.department || '',
      organizedBy: ext.organizer || '',
      eventType: ext.topic || '',
      date: ext.date || '',
      time: ext.time || '',
      venue: ext.venue || '',
      audience: ext.audience || 'Students & Faculty',
      briefDescription: ext.topic || '',
      speakers: ext.speaker ? [
        {
          name: ext.speaker,
          designation: ext.speakerDesignation || '',
          organization: ''
        }
      ] : [],
      generatedContent: {
        objectiveDescription: gen.objectiveDescription || '',
        eventSummary: gen.eventSummary || '',
        summaryPoints: gen.summaryPoints || [],
        keyProgramOutcomes: gen.keyProgramOutcomes || []
      },
      confidence: {
        eventTitle: visionData.confidence?.title ?? 0.8,
        department: visionData.confidence?.department ?? 0.8,
        date: visionData.confidence?.date ?? 0.8,
        venue: visionData.confidence?.venue ?? 0.8,
        speakers: visionData.confidence?.speaker ?? 0.8,
      },
      warnings: visionData.warnings || [],
      ocrMethod: 'Qwen2.5-VL'
    };

    // Apply historical corrections mapping
    const finalResult = await applyHistoricalCorrections(mappedResult, fingerprint);
    return res.status(200).json(finalResult);

  } catch (visionError) {
    console.warn('Vision Service failed or offline, falling back to PaddleOCR:', visionError.message);

    // Fallback to PaddleOCR
    try {
      const form = new FormData();
      form.append('file', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

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
  const visionServiceUrl = process.env.VISION_SERVICE_URL || 'http://localhost:8001';
  try {
    const response = await axios.get(`${visionServiceUrl}/health`, { timeout: 2000 });
    return res.json(response.data);
  } catch (err) {
    return res.json({
      status: 'degraded',
      provider: 'ollama',
      available: false,
      error: err.message
    });
  }
});

export default router;
