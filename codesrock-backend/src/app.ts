import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import gamificationRoutes from './routes/gamificationRoutes';
import courseRoutes from './routes/courseRoutes';
import resourceRoutes from './routes/resourceRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import sessionRoutes from './routes/sessionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/admin';

// Initialize express app
const app: Application = express();

// CORS configuration
const allowedOrigins = [
  // GitHub Pages
  'https://teepreneur.github.io',
  // Custom domain (if configured)
  'https://portal.codesrock.com',
  'http://portal.codesrock.com',
  // Additional origins from environment variable
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // Allow any localhost origin for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', gamificationRoutes);
app.use('/api', courseRoutes);
app.use('/api', resourceRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', sessionRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

export default app;
