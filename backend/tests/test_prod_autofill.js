import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';

async function testBackendAutofill(baseUrl, label) {
  console.log(`\n==================================================`);
  console.log(`Testing [${label}] Backend at: ${baseUrl}`);
  console.log(`==================================================`);

  console.log('\n--- Step 1: Health Check ---');
  try {
    const healthRes = await axios.get(`${baseUrl}/api/autofill/health`, { timeout: 15000 });
    console.log('Health Status Code:', healthRes.status);
    console.log('Health Response Data:', JSON.stringify(healthRes.data, null, 2));
  } catch (err) {
    console.error('Health Error:', err.response ? err.response.data : err.message);
  }

  console.log('\n--- Step 2: Poster Detail Extraction ---');
  const imagePath = path.resolve('../frontend/src/assets/hero.png');
  if (!fs.existsSync(imagePath)) {
    console.error('Image file not found at:', imagePath);
    return;
  }

  const form = new FormData();
  form.append('poster', fs.createReadStream(imagePath), {
    filename: 'hero.png',
    contentType: 'image/png',
  });
  form.append('sessionId', 'test-session-' + Date.now());

  try {
    const extractRes = await axios.post(`${baseUrl}/api/autofill/extract`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 45000,
    });
    console.log('Extract Status Code:', extractRes.status);
    console.log('Extract Response Status:', extractRes.data.status);
    console.log('Extracted Data Keys:', Object.keys(extractRes.data.data || {}));
    console.log('Extracted Event Title:', extractRes.data.data?.eventTitle);
    console.log('Extracted Event Type:', extractRes.data.data?.eventType);
    console.log('Extracted Purpose:', extractRes.data.data?.objectiveDescription?.substring(0, 100) + '...');
    console.log('Extracted Outcomes Count:', extractRes.data.data?.keyProgramOutcomes?.length || 0);
  } catch (err) {
    console.error('Extract Error:', err.response ? { status: err.response.status, data: err.response.data } : err.message);
  }
}

async function runAllTests() {
  // Test local fixed backend with IPv4 address
  await testBackendAutofill('http://127.0.0.1:5000', 'LOCAL FIXED BACKEND');

  // Test production backend
  await testBackendAutofill('https://report-generator-lok5.onrender.com', 'DEPLOYED PRODUCTION BACKEND');
}

runAllTests();
