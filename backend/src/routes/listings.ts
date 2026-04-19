import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.query.role as string;
    const sector = req.query.sector as string;
    
    if (role === 'PROVIDER') {
      const listings = await prisma.listing.findMany({
        where: { providerId: req.user!.id },
        include: { 
          provider: { select: { name: true, address: true } },
          consumer: { select: { name: true, address: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(listings);
    }

    if (role === 'CONSUMER') {
      const where: any = { status: 'AVAILABLE' };
      if (req.query.sector) {
        where.location = { contains: req.query.sector as string };
      }

      const listings = await prisma.listing.findMany({
        where,
        include: { provider: { select: { name: true, address: true, phone: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(listings);
    }

    if (role === 'ADMIN') {
      const listings = await prisma.listing.findMany({
        include: { provider: { select: { name: true, address: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(listings);
    }

    res.json([]);
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Failed to get listings' });
  }
});

router.post('/',
  body('description').notEmpty().withMessage('Description is required'),
  body('servings').isInt({ min: 1 }).withMessage('Servings must be at least 1'),
  body('foodType').notEmpty().withMessage('Food type is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('pickupEnd').isISO8601().withMessage('Valid pickup end time is required'),
  
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (req.user!.role !== 'PROVIDER') {
        return res.status(403).json({ error: 'Only providers can create listings' });
      }

      const { description, servings, foodType, location, lat, lng, pickupEnd } = req.body;

      const listing = await prisma.listing.create({
        data: {
          providerId: req.user!.id,
          description,
          servings,
          foodType,
          location,
          lat: lat || null,
          lng: lng || null,
          pickupStart: new Date(),
          pickupEnd: new Date(pickupEnd),
          status: 'AVAILABLE'
        }
      });

      res.status(201).json(listing);
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }
);

router.patch('/:id/claim', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'CONSUMER') {
      return res.status(403).json({ error: 'Only consumers can claim listings' });
    }

    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Listing is not available' });
    }

    if (new Date() > new Date(listing.pickupEnd)) {
      return res.status(400).json({ error: 'Listing has expired' });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        status: 'CLAIMED',
        consumerId: req.user!.id
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Claim listing error:', error);
    res.status(500).json({ error: 'Failed to claim listing' });
  }
});

router.patch('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.providerId !== req.user!.id && listing.consumerId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to complete this listing' });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: 'COMPLETED' }
    });

    res.json(updated);
  } catch (error) {
    console.error('Complete listing error:', error);
    res.status(500).json({ error: 'Failed to complete listing' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        provider: { select: { name: true, address: true, phone: true } },
        consumer: { select: { name: true, address: true, phone: true } }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.providerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view this listing' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to get listing' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { description, servings, foodType, location, pickupEnd } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.providerId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    if (listing.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Can only update available listings' });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(description && { description }),
        ...(servings && { servings }),
        ...(foodType && { foodType }),
        ...(location && { location }),
        ...(pickupEnd && { pickupEnd: new Date(pickupEnd) })
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.providerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await prisma.listing.delete({
      where: { id }
    });

    res.json({ message: 'Listing deleted' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

export default router;