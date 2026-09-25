import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn('[DB] MONGODB_URI is not set in backend/.env. Waiting for MongoDB Atlas connection URL.');
    isConnected = false;
    return false;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || 'retailmind',
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('[DB] Successfully connected to MongoDB Atlas.');
    return true;
  } catch (error: any) {
    console.error('[DB] MongoDB connection failed:', error.message);
    isConnected = false;
    return false;
  }
};

export const getDBStatus = (): { status: string; isConnected: boolean; dbName: string } => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const state = states[mongoose.connection.readyState] || 'unknown';
  return {
    status: state,
    isConnected: mongoose.connection.readyState === 1,
    dbName: mongoose.connection.name || 'retailmind'
  };
};
