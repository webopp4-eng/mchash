import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = [
  process.env.PUBLIC_FRONTEND_URL || 'https://mchash.vercel.app',
  process.env.RENDER_FRONTEND_URL || 'https://mchash.vercel.app',
  process.env.LOCAL_ADMIN_ORIGIN || 'http://localhost:3001',
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://webopp4-eng.github.io',
  'https://mchash.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Demo mode: wallet-auth and onboarding requests should not be throttled.
// Routes
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', name: 'CM HASH API', version: '1.0.0' });
});

// 404 handler
app.use((_, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`CM HASH backend running on http://localhost:${port}`);
});
