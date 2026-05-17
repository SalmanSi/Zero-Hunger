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

app.get('/api/public/stats', async (req, res) => {
  try {
    const completedStatuses = ['CLAIMED', 'COMPLETED'] as const;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const [
      providers,
      consumers,
      activeRescues,
      mealsSaved,
      rescuesToday,
      recentListings,
      weeklyRows,
      topLocationRows
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PROVIDER', status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'CONSUMER', status: 'APPROVED' } }),
      prisma.listing.count({ where: { status: 'AVAILABLE', pickupEnd: { gt: new Date() } } }),
      prisma.listing.aggregate({ where: { status: { in: [...completedStatuses] } }, _sum: { servings: true } }),
      prisma.listing.count({ where: { status: { in: [...completedStatuses] }, updatedAt: { gte: startOfToday } } }),
      prisma.listing.findMany({
        where: { status: 'AVAILABLE', pickupEnd: { gt: new Date() } },
        select: {
          id: true,
          description: true,
          servings: true,
          location: true,
          foodType: true,
          status: true,
          pickupStart: true,
          provider: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.listing.findMany({
        where: { status: { in: [...completedStatuses] }, updatedAt: { gte: weekStart } },
        select: { servings: true, updatedAt: true }
      }),
      prisma.listing.groupBy({
        by: ['location'],
        where: { status: { in: [...completedStatuses] } },
        _sum: { servings: true },
        _count: { _all: true },
        orderBy: { _sum: { servings: 'desc' } },
        take: 5
      })
    ]);

    const weeklyServings = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      const date = day.toISOString().slice(0, 10);
      return {
        date,
        servings: weeklyRows
          .filter((row) => row.updatedAt.toISOString().slice(0, 10) === date)
          .reduce((sum, row) => sum + row.servings, 0)
      };
    });

    res.json({
      mealsSaved: mealsSaved._sum.servings || 0,
      partners: providers + consumers,
      activeProviders: providers,
      activeNGOs: consumers,
      activeRescues,
      rescuesToday,
      weeklyServings,
      topLocations: topLocationRows.map((row) => ({
        location: row.location,
        servings: row._sum.servings || 0,
        listings: row._count._all
      })),
      recentListings
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ error: 'Failed to get public stats' });
  }
});

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
