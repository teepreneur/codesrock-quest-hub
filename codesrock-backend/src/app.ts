import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/errorHandler';
import logger from './utils/logger';

// Rate limiting configuration
// General API rate limit: 500 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for authentication endpoints: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
import authRoutes from './routes/authRoutes';
import gamificationRoutes from './routes/gamificationRoutes';
import courseRoutes from './routes/courseRoutes';
import resourceRoutes from './routes/resourceRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import sessionRoutes from './routes/sessionRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import adminRoutes from './routes/admin';
import classRoutes from './routes/classRoutes';
import searchRoutes from './routes/searchRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import certificateRoutes from './routes/certificateRoutes';

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

    logger.warn('CORS blocked origin: %s', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

// Middleware
app.use(helmet()); // Secure HTTP headers
app.use(morgan('combined', { 
  stream: { write: (message: string) => logger.info(message.trim()) } 
})); // Request logging
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// Health check route
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
// Apply stricter rate limiting to auth endpoints
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', gamificationRoutes);
app.use('/api', courseRoutes);
app.use('/api', resourceRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', sessionRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/certificates', certificateRoutes);

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

export default app;
