import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import autofillRouter from './routes/autofill.js';


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount the autofill router
app.use('/api/autofill', autofillRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'express-backend' });
});

app.listen(PORT, () => {
  console.log(`Express backend server running on port ${PORT}`);
});
