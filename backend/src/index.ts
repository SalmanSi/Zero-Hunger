import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import userRoutes from './routes/users';
import geocodeRoutes from './routes/geocode';
import rideRoutes from './routes/rides';
import notificationRoutes from './routes/notifications';
import prisma from './utils/prisma';

dotenv.config();

const app = express();

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ZeroHunger API is running' });
});

const expireListings = async () => {
  try {
    const now = new Date();
    const result = await prisma.listing.updateMany({
      where: { status: 'AVAILABLE', pickupEnd: { lt: now } },
      data: { status: 'EXPIRED' }
    });
    if (result.count > 0) {
      console.log(`[sweep] expired ${result.count} listing(s)`);
    }
  } catch (e) {
    console.error('[sweep] failed:', e);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`ZeroHunger API running on port ${PORT}`);
  expireListings();
  setInterval(expireListings, 60_000);
});

export default app;
