"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const listings_1 = __importDefault(require("./routes/listings"));
const users_1 = __importDefault(require("./routes/users"));
const geocode_1 = __importDefault(require("./routes/geocode"));
const rides_1 = __importDefault(require("./routes/rides"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const prisma_1 = __importDefault(require("./utils/prisma"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: corsOrigins,
    credentials: true
}));
app.use(express_1.default.json({ limit: '10kb' }));
app.get('/api/public/stats', async (req, res) => {
    try {
        const completedStatuses = ['CLAIMED', 'COMPLETED'];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        const [providers, consumers, activeRescues, mealsSaved, rescuesToday, recentListings, weeklyRows, topLocationRows] = await Promise.all([
            prisma_1.default.user.count({ where: { role: 'PROVIDER', status: 'APPROVED' } }),
            prisma_1.default.user.count({ where: { role: 'CONSUMER', status: 'APPROVED' } }),
            prisma_1.default.listing.count({ where: { status: 'AVAILABLE', pickupEnd: { gt: new Date() } } }),
            prisma_1.default.listing.aggregate({ where: { status: { in: [...completedStatuses] } }, _sum: { servings: true } }),
            prisma_1.default.listing.count({ where: { status: { in: [...completedStatuses] }, updatedAt: { gte: startOfToday } } }),
            prisma_1.default.listing.findMany({
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
            prisma_1.default.listing.findMany({
                where: { status: { in: [...completedStatuses] }, updatedAt: { gte: weekStart } },
                select: { servings: true, updatedAt: true }
            }),
            prisma_1.default.listing.groupBy({
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
    }
    catch (error) {
        console.error('Public stats error:', error);
        res.status(500).json({ error: 'Failed to get public stats' });
    }
});
app.use('/api/auth', auth_1.default);
app.use('/api/listings', listings_1.default);
app.use('/api/admin/users', users_1.default);
app.use('/api/geocode', geocode_1.default);
app.use('/api/rides', rides_1.default);
app.use('/api/notifications', notifications_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ZeroHunger API is running' });
});
const expireListings = async () => {
    try {
        const now = new Date();
        const result = await prisma_1.default.listing.updateMany({
            where: { status: 'AVAILABLE', pickupEnd: { lt: now } },
            data: { status: 'EXPIRED' }
        });
        if (result.count > 0) {
            console.log(`[sweep] expired ${result.count} listing(s)`);
        }
    }
    catch (e) {
        console.error('[sweep] failed:', e);
    }
};
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`ZeroHunger API running on port ${PORT}`);
    expireListings();
    setInterval(expireListings, 60000);
});
exports.default = app;
//# sourceMappingURL=index.js.map