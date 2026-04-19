"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)('ADMIN'));
router.get('/', async (req, res) => {
    try {
        const { status, role } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (role)
            where.role = role;
        const users = await prisma_1.default.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                address: true,
                phone: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});
router.patch('/:id/approve', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const updated = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ error: 'Failed to approve user' });
    }
});
router.patch('/:id/reject', async (req, res) => {
    try {
        const id = req.params.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const updated = await prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('Reject user error:', error);
        res.status(500).json({ error: 'Failed to reject user' });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const [totalUsers, providers, consumers, pending, listings, availableListings, claimedListings, totalServings] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { role: 'PROVIDER' } }),
            prisma_1.default.user.count({ where: { role: 'CONSUMER' } }),
            prisma_1.default.user.count({ where: { status: 'PENDING' } }),
            prisma_1.default.listing.count(),
            prisma_1.default.listing.count({ where: { status: 'AVAILABLE' } }),
            prisma_1.default.listing.count({ where: { status: 'CLAIMED' } }),
            prisma_1.default.listing.aggregate({ _sum: { servings: true } })
        ]);
        res.json({
            totalUsers,
            providers,
            consumers,
            pending,
            listings,
            availableListings,
            claimedListings,
            totalServings: totalServings._sum.servings || 0
        });
    }
    catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map