import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const NOTIFICATION_TYPES = {
  RIDE_STARTED: 'RIDE_STARTED',
  RIDE_ARRIVED: 'RIDE_ARRIVED',
  RIDE_COMPLETED: 'RIDE_COMPLETED',
  LISTING_CLAIMED: 'LISTING_CLAIMED'
};

router.post('/ride',
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

      if (listing.status !== 'AVAILABLE') {
        return res.status(400).json({ error: 'Listing is not available' });
      }

      if (listing.consumerId !== req.user!.id) {
        return res.status(403).json({ error: 'You have not claimed this listing' });
      }

      const ride = await prisma.ride.create({
        data: {
          listingId,
          consumerId: req.user!.id,
          status: 'IN_PROGRESS',
          startTime: new Date()
        }
      });

      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'CLAIMED' }
      });

      res.status(201).json({
        ...ride,
        providerNotificationSent: true
      });
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

router.patch('/:rideId/complete', async (req: AuthRequest, res: Response) => {
  try {
    const rideId = req.params.rideId as string;
    const user = req.user!;

    if (user.role !== 'CONSUMER') {
      return res.status(403).json({ error: 'Only consumers can complete rides' });
    }

    const ride = await prisma.ride.findUnique({
      where: { id: rideId }
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
        status: 'COMPLETED',
        endTime: new Date()
      }
    });

    await prisma.listing.update({
      where: { id: ride.listingId },
      data: { status: 'COMPLETED' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({ error: 'Failed to complete ride' });
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