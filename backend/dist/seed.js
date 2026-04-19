"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const providerPassword = await bcryptjs_1.default.hash('provider123', 10);
    const consumerPassword = await bcryptjs_1.default.hash('consumer123', 10);
    await prisma.user.upsert({
        where: { email: 'admin@zerohunger.org' },
        update: {},
        create: {
            name: 'ZeroHunger Admin',
            email: 'admin@zerohunger.org',
            password: adminPassword,
            role: 'ADMIN',
            status: 'APPROVED',
            address: 'HQ Islamabad',
            phone: '+92 321 0000000'
        }
    });
    await prisma.user.upsert({
        where: { email: 'bistro@example.com' },
        update: {},
        create: {
            name: 'Grand Bistro',
            email: 'bistro@example.com',
            password: providerPassword,
            role: 'PROVIDER',
            status: 'APPROVED',
            address: 'Sector F-7, Islamabad',
            phone: '+92 300 1234567'
        }
    });
    await prisma.user.upsert({
        where: { email: 'edhi@example.com' },
        update: {},
        create: {
            name: 'Edhi Foundation',
            email: 'edhi@example.com',
            password: consumerPassword,
            role: 'CONSUMER',
            status: 'APPROVED',
            address: 'Sector G-8, Islamabad',
            phone: '+92 300 7654321'
        }
    });
    const provider = await prisma.user.findUnique({ where: { email: 'bistro@example.com' } });
    if (provider) {
        await prisma.listing.upsert({
            where: { id: 'seed-listing-1' },
            update: {},
            create: {
                id: 'seed-listing-1',
                providerId: provider.id,
                description: 'Chicken Biryani Trays',
                servings: 15,
                foodType: 'Hot Meals',
                location: 'Sector F-7, Islamabad',
                lat: 33.6524,
                lng: 73.0192,
                pickupStart: new Date(),
                pickupEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
                status: 'AVAILABLE'
            }
        });
    }
    console.log('Database seeded successfully!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map