import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireApproved);

const NOTIFICATION_TYPES = {
  RIDE_STARTED: 'RIDE_STARTED',
  RIDE_ARRIVED: 'RIDE_ARRIVED',
  RIDE_COMPLETED: 'RIDE_COMPLETED',
  LISTING_CLAIMED: 'LISTING_CLAIMED'
};

router.post('/start',
  body('listingId').notEmpty().withMessage('Listing ID is required'),
  
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user!.role !== 'CONSUMER') {
        return res.status(403).json({ error: 'Only consumers can start rides' });
      }

      const { listingId } = req.body;

      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { provider: true }
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (listing.consumerId !== req.user!.id) {
        return res.status(403).json({ error: 'You have not claimed this listing' });
      }

      if (listing.status !== 'CLAIMED') {
        return res.status(400).json({ error: 'Listing must be claimed before starting a ride' });
      }

      const existingRide = await prisma.ride.findFirst({
        where: {
          listingId,
          consumerId: req.user!.id,
          status: { in: ['PENDING', 'IN_PROGRESS', 'ARRIVED'] }
        }
      });

      if (existingRide) {
        return res.json(existingRide);
      }

      const ride = await prisma.ride.create({
        data: {
          listingId,
          consumerId: req.user!.id,
          status: 'IN_PROGRESS',
          startTime: new Date()
        }
      });

      prisma.notification.create({
        data: {
          userId: listing.providerId,
          listingId: listing.id,
          type: 'RIDE_STARTED',
          title: 'Pickup en route',
          body: `${req.user!.name} is on the way to pick up "${listing.description}"`
        }
      }).catch((e) => console.error('Ride notification failed:', e));

      res.status(201).json(ride);
    } catch (error) {
      console.error('Start ride error:', error);
      res.status(500).json({ error: 'Failed to start ride' });
    }
  }
);

router.patch('/:rideId/arrive', async (req: AuthRequest, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const user = req.user!;

    if (user.role !== 'CONSUMER') {
      return res.status(403).json({ error: 'Only consumers can mark arrival' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { listing: true }
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.consumerId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { 
        status: 'ARRIVED',
        arrivalTime: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Arrival update error:', error);
    res.status(500).json({ error: 'Failed to update arrival' });
  }
});

// Ride completion is provider-driven only — see /:rideId/confirm-handoff below.
// A consumer self-complete route was removed because it bypassed provider handoff
// confirmation and left listing/ride state inconsistent.

router.patch('/:rideId/confirm-handoff', async (req: AuthRequest, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const user = req.user!;

    if (user.role !== 'PROVIDER') {
      return res.status(403).json({ error: 'Only providers can confirm handoff' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { listing: true }
    });

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.listing.providerId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to confirm this handoff' });
    }

    if (ride.status === 'COMPLETED') {
      return res.json(ride);
    }

    if (ride.status !== 'ARRIVED') {
      return res.status(400).json({ error: 'The NGO must mark arrival before handoff can be confirmed' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const completedRide = await tx.ride.update({
        where: { id: rideId },
        data: {
          status: 'COMPLETED',
          endTime: new Date()
        },
        include: {
          listing: {
            include: {
              provider: { select: { name: true, address: true, phone: true } }
            }
          }
        }
      });

      await tx.listing.update({
        where: { id: ride.listingId },
        data: { status: 'COMPLETED' }
      });

      return completedRide;
    });

    prisma.notification.create({
      data: {
        userId: ride.consumerId,
        listingId: ride.listingId,
        type: 'RIDE_COMPLETED',
        title: 'Handoff confirmed',
        body: `${user.name} confirmed pickup for "${ride.listing.description}"`
      }
    }).catch((e) => console.error('Consumer notification failed:', e));

    res.json(updated);
  } catch (error) {
    console.error('Confirm handoff error:', error);
    res.status(500).json({ error: 'Failed to confirm handoff' });
  }
});

router.get('/my-rides', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    
    let rides;
    if (user.role === 'CONSUMER') {
      rides = await prisma.ride.findMany({
        where: { consumerId: user.id },
        include: {
          listing: {
            include: { provider: true }
          }
        },
        orderBy: { startTime: 'desc' }
      });
    } else {
      rides = await prisma.ride.findMany({
        where: {
          listing: { providerId: user.id }
        },
        include: {
          listing: true
        },
        orderBy: { startTime: 'desc' }
      });
    }

    res.json(rides);
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
});

export default router;
