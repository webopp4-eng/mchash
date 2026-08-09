import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import healthRoutes from './routes/health';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`CM HASH backend running on http://localhost:${port}`);
});
