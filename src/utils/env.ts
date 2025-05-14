// src/utils/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

// Define and export all environment variables with type safety
export const env = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server Configuration
  PORT: parseInt(process.env.PORT || '3000'),
  JWT_SECRET: process.env.JWT_SECRET || 'your-strong-secret-key',
  APP_NAME: process.env.APP_NAME || 'Medical App',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL || 'mongodb://localhost:27017/medical-app',
  
  // Email Configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.example.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT || '587'),
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'your@email.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your-email-password',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@medicalapp.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'Medical App Team',
  EMAIL_USE_SSL: process.env.EMAIL_USE_SSL === 'true',
  
  // Support
  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL || 'support@medicalapp.com',
  
  // Production Checks
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test'
};

// Type for our environment variables
export type EnvConfig = typeof env;

// Optional: Validate required environment variables
export const validateEnv = () => {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'EMAIL_HOST', 'EMAIL_USERNAME', 'EMAIL_PASSWORD'];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      if (env.isProduction) {
        process.exit(1);
      }
    }
  });
};

// Call validateEnv when this module is loaded
validateEnv();