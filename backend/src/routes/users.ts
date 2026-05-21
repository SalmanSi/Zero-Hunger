import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, role } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        address: true,
        phone: true,
        lat: true,
        lng: true,
        radius: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.patch('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

router.patch('/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

router.patch('/:id/suspend', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      select: { id: true, name: true, email: true, role: true, status: true }
    });
    res.json(updated);
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const completedStatuses = ['CLAIMED', 'COMPLETED'] as const;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      providers,
      consumers,
      pending,
      listings,
      availableListings,
      claimedListings,
      completedListings,
      totalServings,
      mealsSaved,
      rescuesToday,
      weeklyRows,
      topProviderRows,
      topLocationRows
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PROVIDER' } }),
      prisma.user.count({ where: { role: 'CONSUMER' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'AVAILABLE' } }),
      prisma.listing.count({ where: { status: 'CLAIMED' } }),
      prisma.listing.count({ where: { status: 'COMPLETED' } }),
      prisma.listing.aggregate({ _sum: { servings: true } }),
      prisma.listing.aggregate({ where: { status: { in: [...completedStatuses] } }, _sum: { servings: true } }),
      prisma.listing.count({ where: { status: { in: [...completedStatuses] }, updatedAt: { gte: startOfToday } } }),
      prisma.listing.findMany({
        where: { status: { in: [...completedStatuses] }, updatedAt: { gte: weekStart } },
        select: { servings: true, updatedAt: true }
      }),
      prisma.listing.groupBy({
        by: ['providerId'],
        where: { status: { in: [...completedStatuses] } },
        _sum: { servings: true },
        _count: { _all: true },
        orderBy: { _sum: { servings: 'desc' } },
        take: 5
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

    const providerNames = await prisma.user.findMany({
      where: { id: { in: topProviderRows.map((row) => row.providerId) } },
      select: { id: true, name: true }
    });
    const providerNameById = new Map(providerNames.map((provider) => [provider.id, provider.name]));
    const weeklyServings = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + index);
      return {
        date: day.toISOString().slice(0, 10),
        servings: weeklyRows
          .filter((row) => row.updatedAt.toISOString().slice(0, 10) === day.toISOString().slice(0, 10))
          .reduce((sum, row) => sum + row.servings, 0)
      };
    });

    res.json({
      totalUsers,
      providers,
      consumers,
      pending,
      listings,
      availableListings,
      claimedListings,
      completedListings,
      totalServings: totalServings._sum.servings || 0,
      mealsSaved: mealsSaved._sum.servings || 0,
      rescuesToday,
      weeklyServings,
      topLocations: topLocationRows.map((row) => ({
        location: row.location,
        servings: row._sum.servings || 0,
        listings: row._count._all
      })),
      topProviders: topProviderRows.map((row) => ({
        providerId: row.providerId,
        name: providerNameById.get(row.providerId) || 'Unknown provider',
        servings: row._sum.servings || 0,
        listings: row._count._all
      }))
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
