import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { authenticate, requireApproved, AuthRequest } from '../middleware/auth';
import { haversineKm } from '../utils/geo';

const router = Router();

router.use(authenticate);

const publicListingSelect = {
  id: true,
  providerId: true,
  description: true,
  servings: true,
  foodType: true,
  location: true,
  lat: true,
  lng: true,
  pickupStart: true,
  pickupEnd: true,
  status: true,
  consumerId: true,
  unit: true,
  weight: true,
  packageCount: true,
  dietary: true,
  allergies: true,
  storage: true,
  prepInstructions: true,
  createdAt: true,
  updatedAt: true,
  provider: { select: { name: true, address: true, phone: true, lat: true, lng: true } }
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const role = req.query.role as string;

    if (role === 'PROVIDER') {
      const listings = await prisma.listing.findMany({
        where: { providerId: req.user!.id },
        include: {
          provider: { select: { name: true, address: true } },
          consumer: { select: { name: true, address: true, phone: true } },
          rides: {
            include: { consumer: { select: { name: true, address: true, phone: true } } },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(listings);
    }

    if (role === 'CONSUMER') {
      const me = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { lat: true, lng: true, radius: true }
      });

      const where: any = {
        OR: [
          { status: 'AVAILABLE', pickupEnd: { gt: new Date() } },
          { consumerId: req.user!.id }
        ]
      };
      if (req.query.sector) {
        where.AND = [{ location: { contains: req.query.sector as string } }];
      }

      const rows = await prisma.listing.findMany({
        where,
        select: publicListingSelect,
        orderBy: { createdAt: 'desc' }
      });

      let filtered = rows;
      if (me?.lat != null && me?.lng != null) {
        const radius = me.radius ?? 10;
        filtered = rows.filter((l) => {
          if (l.lat == null || l.lng == null) return true;
          return haversineKm(me.lat!, me.lng!, l.lat, l.lng) <= radius;
        });
      }

      return res.json(filtered);
    }

    if (role === 'ADMIN') {
      const listings = await prisma.listing.findMany({
        include: {
          provider: { select: { name: true, address: true } },
          consumer: { select: { name: true } }
        },
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
  requireApproved,
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
          lat: lat ?? null,
          lng: lng ?? null,
          pickupStart: new Date(),
          pickupEnd: new Date(pickupEnd),
          status: 'AVAILABLE'
        }
      });

      // Fire-and-forget radius-based notification fanout
      (async () => {
        try {
          const consumers = await prisma.user.findMany({
            where: { role: 'CONSUMER', status: 'APPROVED' },
            select: { id: true, lat: true, lng: true, radius: true }
          });

          const matched = consumers.filter((c) => {
            if (listing.lat == null || listing.lng == null) return true;
            if (c.lat == null || c.lng == null) return true;
            const r = c.radius ?? 10;
            return haversineKm(listing.lat, listing.lng, c.lat, c.lng) <= r;
          });

          if (matched.length > 0) {
            await prisma.notification.createMany({
              data: matched.map((c) => ({
                userId: c.id,
                listingId: listing.id,
                type: 'LISTING_AVAILABLE',
                title: 'New surplus food available',
                body: `${listing.description} (${listing.servings} servings) at ${listing.location}`
              }))
            });
          }
        } catch (e) {
          console.error('Notification fanout failed:', e);
        }
      })();

      res.status(201).json(listing);
    } catch (error) {
      console.error('Create listing error:', error);
      res.status(500).json({ error: 'Failed to create listing' });
    }
  }
);

router.patch('/:id/claim', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'CONSUMER') {
      return res.status(403).json({ error: 'Only consumers can claim listings' });
    }

    const id = req.params.id as string;
    const now = new Date();

    // Atomic claim: only succeeds if still AVAILABLE and not expired
    const result = await prisma.listing.updateMany({
      where: {
        id,
        status: 'AVAILABLE',
        pickupEnd: { gt: now }
      },
      data: {
        status: 'CLAIMED',
        consumerId: req.user!.id
      }
    });

    if (result.count === 0) {
      const existing = await prisma.listing.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Listing not found' });
      if (existing.status !== 'AVAILABLE') {
        return res.status(409).json({ error: 'Listing already claimed' });
      }
      return res.status(400).json({ error: 'Listing has expired' });
    }

    const updated = await prisma.listing.findUnique({
      where: { id },
      include: {
        provider: { select: { name: true, address: true, phone: true } }
      }
    });

    // Notify the provider
    if (updated) {
      prisma.notification.create({
        data: {
          userId: updated.providerId,
          listingId: updated.id,
          type: 'LISTING_CLAIMED',
          title: 'Your listing was claimed',
          body: `${req.user!.name} claimed "${updated.description}"`
        }
      }).catch((e) => console.error('Provider notification failed:', e));
    }

    res.json(updated);
  } catch (error) {
    console.error('Claim listing error:', error);
    res.status(500).json({ error: 'Failed to claim listing' });
  }
});

router.patch('/:id/complete', requireApproved, async (req: AuthRequest, res: Response) => {
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
        consumer: { select: { name: true, address: true, phone: true } },
        rides: {
          include: { consumer: { select: { name: true, address: true, phone: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const isOwner = listing.providerId === req.user!.id;
    const isClaimer = listing.consumerId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';

    if (!isOwner && !isClaimer && !isAdmin) {
      // Allow consumers to view a listing they haven't claimed, but redact contact info
      if (req.user!.role === 'CONSUMER' && listing.status === 'AVAILABLE') {
        const { provider, ...rest } = listing;
        return res.json({
          ...rest,
          provider: { name: provider.name }
        });
      }
      return res.status(403).json({ error: 'Not authorized to view this listing' });
    }

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Failed to get listing' });
  }
});

router.patch('/:id', requireApproved, async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { description, servings, foodType, location, lat, lng, pickupEnd } = req.body;

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
        ...(typeof lat === 'number' && { lat }),
        ...(typeof lng === 'number' && { lng }),
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
