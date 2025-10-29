// api/index.ts

import { config } from "dotenv";
config();

import mongoose from "mongoose";
import { app } from "../src/app.ts";

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    console.log('✅ Using cached MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error);
    throw error;
  }
}

export default async function handler(req: any, res: any) {
  await connectDB();
  return app(req, res);
}
