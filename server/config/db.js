import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medguardian');
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    console.log('[Database] If MongoDB server is not running locally, please start it or provide MONGODB_URI in server/.env');
  }
};
