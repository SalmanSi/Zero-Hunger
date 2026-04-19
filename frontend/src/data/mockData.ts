export interface User {
    id: string;
    name: string;
    role: 'PROVIDER' | 'CONSUMER' | 'ADMIN';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    email: string;
    address: string;
    phone: string;
}

export interface Listing {
    id: string;
    providerId: string;
    description: string;
    servings: number;
    pickupStart: string;
    pickupEnd: string;
    status: 'AVAILABLE' | 'CLAIMED' | 'EXPIRED';
    consumerId?: string | null;
    foodType: string;
    location: string;
}

export const mockUsers: User[] = [
    {
        id: '1',
        name: 'Grand Bistro',
        role: 'PROVIDER',
        status: 'APPROVED',
        email: 'bistro@example.com',
        address: 'Sector F-7, Islamabad',
        phone: '+92 300 1234567'
    },
    {
        id: '2',
        name: 'Edhi Foundation',
        role: 'CONSUMER',
        status: 'APPROVED',
        email: 'edhi@example.com',
        address: 'Sector G-8, Islamabad',
        phone: '+92 300 7654321'
    },
    {
        id: '3',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'APPROVED',
        email: 'admin@zerohunger.org',
        address: 'HQ Islamabad',
        phone: '+92 321 0000000'
    },
    {
        id: '4',
        name: 'Street Flavors',
        role: 'PROVIDER',
        status: 'PENDING',
        email: 'street@example.com',
        address: 'Sector F-10, Islamabad',
        phone: '+92 311 2223334'
    }
];

export const mockListings: Listing[] = [
    {
        id: '101',
        providerId: '1',
        description: 'Chicken Biryani Trays',
        servings: 15,
        pickupStart: '2026-04-14T16:00:00',
        pickupEnd: '2026-04-14T18:00:00',
        status: 'AVAILABLE',
        foodType: 'Hot Meals',
        location: 'G-9 Islamabad'
    },
    {
        id: '102',
        providerId: '1',
        description: 'Pasta Alfredo (Large)',
        servings: 10,
        pickupStart: '2026-04-14T12:00:00',
        pickupEnd: '2026-04-14T14:00:00',
        status: 'CLAIMED',
        consumerId: '2',
        foodType: 'Italian',
        location: 'NUST C2'
    },
    {
        id: '103',
        providerId: '1',
        description: 'Mixed Vegetable Curry',
        servings: 20,
        pickupStart: '2026-04-14T19:00:00',
        pickupEnd: '2026-04-14T21:00:00',
        status: 'AVAILABLE',
        foodType: 'Vegetarian',
        location: 'Gate 2'
    }
];

// Simple state management simulation
export const getPersistentData = () => {
    const users = JSON.parse(localStorage.getItem('zh_users') || JSON.stringify(mockUsers));
    const listings = JSON.parse(localStorage.getItem('zh_listings') || JSON.stringify(mockListings));
    return { users, listings };
};

export const savePersistentData = (users: User[], listings: Listing[]) => {
    localStorage.setItem('zh_users', JSON.stringify(users));
    localStorage.setItem('zh_listings', JSON.stringify(listings));
};
