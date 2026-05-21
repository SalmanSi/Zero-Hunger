"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const geo_1 = require("../utils/geo");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
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
router.get('/', async (req, res) => {
    try {
        const role = req.query.role;
        if (role === 'PROVIDER') {
            const listings = await prisma_1.default.listing.findMany({
                where: { providerId: req.user.id },
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
            const me = await prisma_1.default.user.findUnique({
                where: { id: req.user.id },
                select: { lat: true, lng: true, radius: true }
            });
            const where = {
                OR: [
                    { status: 'AVAILABLE', pickupEnd: { gt: new Date() } },
                    { consumerId: req.user.id }
                ]
            };
            if (req.query.sector) {
                where.AND = [{ location: { contains: req.query.sector } }];
            }
            const rows = await prisma_1.default.listing.findMany({
                where,
                select: publicListingSelect,
                orderBy: { createdAt: 'desc' }
            });
            let filtered = rows;
            if (me?.lat != null && me?.lng != null) {
                const radius = me.radius ?? 10;
                filtered = rows.filter((l) => {
                    if (l.lat == null || l.lng == null)
                        return true;
                    return (0, geo_1.haversineKm)(me.lat, me.lng, l.lat, l.lng) <= radius;
                });
            }
            return res.json(filtered);
        }
        if (role === 'ADMIN') {
            const listings = await prisma_1.default.listing.findMany({
                include: {
                    provider: { select: { name: true, address: true } },
                    consumer: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(listings);
        }
        res.json([]);
    }
    catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ error: 'Failed to get listings' });
    }
});
router.post('/', auth_1.requireApproved, (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'), (0, express_validator_1.body)('servings').isInt({ min: 1 }).withMessage('Servings must be at least 1'), (0, express_validator_1.body)('foodType').notEmpty().withMessage('Food type is required'), (0, express_validator_1.body)('location').notEmpty().withMessage('Location is required'), (0, express_validator_1.body)('pickupEnd').isISO8601().withMessage('Valid pickup end time is required'), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.user.role !== 'PROVIDER') {
            return res.status(403).json({ error: 'Only providers can create listings' });
        }
        const { description, servings, foodType, location, lat, lng, pickupEnd } = req.body;
        const listing = await prisma_1.default.listing.create({
            data: {
                providerId: req.user.id,
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
                const consumers = await prisma_1.default.user.findMany({
                    where: { role: 'CONSUMER', status: 'APPROVED' },
                    select: { id: true, lat: true, lng: true, radius: true }
                });
                const matched = consumers.filter((c) => {
                    if (listing.lat == null || listing.lng == null)
                        return true;
                    if (c.lat == null || c.lng == null)
                        return true;
                    const r = c.radius ?? 10;
                    return (0, geo_1.haversineKm)(listing.lat, listing.lng, c.lat, c.lng) <= r;
                });
                if (matched.length > 0) {
                    await prisma_1.default.notification.createMany({
                        data: matched.map((c) => ({
                            userId: c.id,
                            listingId: listing.id,
                            type: 'LISTING_AVAILABLE',
                            title: 'New surplus food available',
                            body: `${listing.description} (${listing.servings} servings) at ${listing.location}`
                        }))
                    });
                }
            }
            catch (e) {
                console.error('Notification fanout failed:', e);
            }
        })();
        res.status(201).json(listing);
    }
    catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ error: 'Failed to create listing' });
    }
});
router.patch('/:id/claim', auth_1.requireApproved, async (req, res) => {
    try {
        if (req.user.role !== 'CONSUMER') {
            return res.status(403).json({ error: 'Only consumers can claim listings' });
        }
        const id = req.params.id;
        const now = new Date();
        // Atomic claim: only succeeds if still AVAILABLE and not expired
        const result = await prisma_1.default.listing.updateMany({
            where: {
                id,
                status: 'AVAILABLE',
                pickupEnd: { gt: now }
            },
            data: {
                status: 'CLAIMED',
                consumerId: req.user.id
            }
        });
        if (result.count === 0) {
            const existing = await prisma_1.default.listing.findUnique({ where: { id } });
            if (!existing)
                return res.status(404).json({ error: 'Listing not found' });
            if (existing.status !== 'AVAILABLE') {
                return res.status(409).json({ error: 'Listing already claimed' });
            }
            return res.status(400).json({ error: 'Listing has expired' });
        }
        const updated = await prisma_1.default.listing.findUnique({
            where: { id },
            include: {
                provider: { select: { name: true, address: true, phone: true } }
            }
        });
        // Notify the provider
        if (updated) {
            prisma_1.default.notification.create({
                data: {
                    userId: updated.providerId,
                    listingId: updated.id,
                    type: 'LISTING_CLAIMED',
                    title: 'Your listing was claimed',
                    body: `${req.user.name} claimed "${updated.description}"`
                }
            }).catch((e) => console.error('Provider notification failed:', e));
        }
        res.json(updated);
    }
    catch (error) {
        console.error('Claim listing error:', error);
        res.status(500).json({ error: 'Failed to claim listing' });
    }
});
router.patch('/:id/complete', auth_1.requireApproved, async (req, res) => {
    try {
        const id = req.params.id;
        const listing = await prisma_1.default.listing.findUnique({
            where: { id }
        });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        if (listing.providerId !== req.user.id && listing.consumerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to complete this listing' });
        }
        const updated = await prisma_1.default.listing.update({
            where: { id },
            data: { status: 'COMPLETED' }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Complete listing error:', error);
        res.status(500).json({ error: 'Failed to complete listing' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const listing = await prisma_1.default.listing.findUnique({
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
        const isOwner = listing.providerId === req.user.id;
        const isClaimer = listing.consumerId === req.user.id;
        const isAdmin = req.user.role === 'ADMIN';
        if (!isOwner && !isClaimer && !isAdmin) {
            // Allow consumers to view a listing they haven't claimed, but redact contact info
            if (req.user.role === 'CONSUMER' && listing.status === 'AVAILABLE') {
                const { provider, ...rest } = listing;
                return res.json({
                    ...rest,
                    provider: { name: provider.name }
                });
            }
            return res.status(403).json({ error: 'Not authorized to view this listing' });
        }
        res.json(listing);
    }
    catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ error: 'Failed to get listing' });
    }
});
router.patch('/:id', auth_1.requireApproved, async (req, res) => {
    try {
        const id = req.params.id;
        const { description, servings, foodType, location, lat, lng, pickupEnd } = req.body;
        const listing = await prisma_1.default.listing.findUnique({
            where: { id }
        });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        if (listing.providerId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this listing' });
        }
        if (listing.status !== 'AVAILABLE') {
            return res.status(400).json({ error: 'Can only update available listings' });
        }
        const updated = await prisma_1.default.listing.update({
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
    }
    catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ error: 'Failed to update listing' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const listing = await prisma_1.default.listing.findUnique({
            where: { id }
        });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        if (listing.providerId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not authorized to delete this listing' });
        }
        await prisma_1.default.listing.delete({
            where: { id }
        });
        res.json({ message: 'Listing deleted' });
    }
    catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
});
exports.default = router;
//# sourceMappingURL=listings.js.map