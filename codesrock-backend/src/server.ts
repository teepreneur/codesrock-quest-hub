// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { supabase } from './config/supabase';

// Get port from environment or use default
const PORT = process.env.PORT || 5000;

// Connect to database and start server
const startServer = async () => {
  try {
    // Verify Supabase connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.warn('Supabase connection warning:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('Process terminated!');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
