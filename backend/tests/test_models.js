import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.split(',')[0].trim() : '';

console.log('Testing key:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = ['gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];

async function testModels() {
  for (const modelName of modelsToTest) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('ping');
      console.log(`Model [${modelName}] SUCCESS! Response:`, result.response.text());
    } catch (err) {
      console.error(`Model [${modelName}] FAILED:`, err.message);
    }
  }
}

testModels();
