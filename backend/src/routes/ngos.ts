import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';
import { haversineKm } from '../utils/geo';

const router = Router();

router.use(authenticate);
router.use(requireApproved);

// Approved NGOs (consumers), nearest first relative to the requesting provider.
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { lat: true, lng: true, radius: true }
    });

    const ngos = await prisma.user.findMany({
      where: { role: 'CONSUMER', status: 'APPROVED' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        lat: true,
        lng: true
      }
    });

    const withDistance = ngos.map((ngo) => {
      const distanceKm =
        me?.lat != null && me?.lng != null && ngo.lat != null && ngo.lng != null
          ? haversineKm(me.lat, me.lng, ngo.lat, ngo.lng)
          : null;
      return { ...ngo, distanceKm };
    });

    withDistance.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    res.json(withDistance);
  } catch (error) {
    console.error('Get NGOs error:', error);
    res.status(500).json({ error: 'Failed to get NGOs' });
  }
});

export default router;
