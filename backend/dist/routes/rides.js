"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.requireApproved);
const NOTIFICATION_TYPES = {
    RIDE_STARTED: 'RIDE_STARTED',
    RIDE_ARRIVED: 'RIDE_ARRIVED',
    RIDE_COMPLETED: 'RIDE_COMPLETED',
    LISTING_CLAIMED: 'LISTING_CLAIMED'
};
router.post('/start', (0, express_validator_1.body)('listingId').notEmpty().withMessage('Listing ID is required'), async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.user.role !== 'CONSUMER') {
            return res.status(403).json({ error: 'Only consumers can start rides' });
        }
        const { listingId } = req.body;
        const listing = await prisma_1.default.listing.findUnique({
            where: { id: listingId },
            include: { provider: true }
        });
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        if (listing.consumerId !== req.user.id) {
            return res.status(403).json({ error: 'You have not claimed this listing' });
        }
        if (listing.status !== 'CLAIMED') {
            return res.status(400).json({ error: 'Listing must be claimed before starting a ride' });
        }
        const existingRide = await prisma_1.default.ride.findFirst({
            where: {
                listingId,
                consumerId: req.user.id,
                status: { in: ['PENDING', 'IN_PROGRESS', 'ARRIVED'] }
            }
        });
        if (existingRide) {
            return res.json(existingRide);
        }
        const ride = await prisma_1.default.ride.create({
            data: {
                listingId,
                consumerId: req.user.id,
                status: 'IN_PROGRESS',
                startTime: new Date()
            }
        });
        prisma_1.default.notification.create({
            data: {
                userId: listing.providerId,
                listingId: listing.id,
                type: 'RIDE_STARTED',
                title: 'Pickup en route',
                body: `${req.user.name} is on the way to pick up "${listing.description}"`
            }
        }).catch((e) => console.error('Ride notification failed:', e));
        res.status(201).json(ride);
    }
    catch (error) {
        console.error('Start ride error:', error);
        res.status(500).json({ error: 'Failed to start ride' });
    }
});
router.patch('/:rideId/arrive', async (req, res) => {
    try {
        const rideId = req.params.rideId;
        const user = req.user;
        if (user.role !== 'CONSUMER') {
            return res.status(403).json({ error: 'Only consumers can mark arrival' });
        }
        const ride = await prisma_1.default.ride.findUnique({
            where: { id: rideId },
            include: { listing: true }
        });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        if (ride.consumerId !== user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const updated = await prisma_1.default.ride.update({
            where: { id: rideId },
            data: {
                status: 'ARRIVED',
                arrivalTime: new Date()
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Arrival update error:', error);
        res.status(500).json({ error: 'Failed to update arrival' });
    }
});
router.patch('/:rideId/complete', async (req, res) => {
    try {
        const rideId = req.params.rideId;
        const user = req.user;
        if (user.role !== 'CONSUMER') {
            return res.status(403).json({ error: 'Only consumers can complete rides' });
        }
        const ride = await prisma_1.default.ride.findUnique({
            where: { id: rideId }
        });
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found' });
        }
        if (ride.consumerId !== user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const updated = await prisma_1.default.ride.update({
            where: { id: rideId },
            data: {
                status: 'COMPLETED',
                endTime: new Date()
            }
        });
        await prisma_1.default.listing.update({
            where: { id: ride.listingId },
            data: { status: 'COMPLETED' }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Complete ride error:', error);
        res.status(500).json({ error: 'Failed to complete ride' });
    }
});
router.patch('/:rideId/confirm-handoff', async (req, res) => {
    try {
        const rideId = req.params.rideId;
        const user = req.user;
        if (user.role !== 'PROVIDER') {
            return res.status(403).json({ error: 'Only providers can confirm handoff' });
        }
        const ride = await prisma_1.default.ride.findUnique({
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
        const updated = await prisma_1.default.$transaction(async (tx) => {
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
        prisma_1.default.notification.create({
            data: {
                userId: ride.consumerId,
                listingId: ride.listingId,
                type: 'RIDE_COMPLETED',
                title: 'Handoff confirmed',
                body: `${user.name} confirmed pickup for "${ride.listing.description}"`
            }
        }).catch((e) => console.error('Consumer notification failed:', e));
        res.json(updated);
    }
    catch (error) {
        console.error('Confirm handoff error:', error);
        res.status(500).json({ error: 'Failed to confirm handoff' });
    }
});
router.get('/my-rides', async (req, res) => {
    try {
        const user = req.user;
        let rides;
        if (user.role === 'CONSUMER') {
            rides = await prisma_1.default.ride.findMany({
                where: { consumerId: user.id },
                include: {
                    listing: {
                        include: { provider: true }
                    }
                },
                orderBy: { startTime: 'desc' }
            });
        }
        else {
            rides = await prisma_1.default.ride.findMany({
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
    }
    catch (error) {
        console.error('Get rides error:', error);
        res.status(500).json({ error: 'Failed to get rides' });
    }
});
exports.default = router;
//# sourceMappingURL=rides.js.map