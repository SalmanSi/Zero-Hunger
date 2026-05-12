# ZeroHunger API

Base URL: `http://localhost:5000/api`

## Authentication

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "Organization Name",
  "email": "email@example.com",
  "password": "password123",
  "address": "Sector F-7, Islamabad",
  "phone": "+92 300 1234567",
  "role": "PROVIDER" // or CONSUMER
}
```

**Response:**
```json
{
  "message": "Registration submitted successfully. Please wait for admin approval.",
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "name": "Organization Name",
    "email": "email@example.com",
    "role": "PROVIDER",
    "status": "PENDING"
  }
}
```

### POST /api/auth/login
Login with credentials.

**Request Body:**
```json
{
  "email": "email@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "name": "Organization Name",
    "email": "email@example.com",
    "role": "PROVIDER",
    "status": "APPROVED",
    "address": "Sector F-7, Islamabad"
  }
}
```

### GET /api/auth/me
Get current user info. Requires authentication token.

**Headers:** `Authorization: Bearer <token>`

## Listings

### GET /api/listings
Get listings. Query params: `role` (PROVIDER, CONSUMER, ADMIN), `sector` (optional filter)

### POST /api/listings
Create a new listing. Requires PROVIDER role.

**Request Body:**
```json
{
  "description": "Chicken Biryani",
  "servings": 15,
  "foodType": "Hot Meals",
  "location": "Sector F-7, Islamabad",
  "lat": 33.6524,
  "lng": 73.0192,
  "pickupEnd": "2024-04-15T18:00:00Z"
}
```

### PATCH /api/listings/:id/claim
Claim a listing. Requires CONSUMER role.

### DELETE /api/listings/:id
Delete a listing. Requires PROVIDER (owner) or ADMIN role.

## Admin

### GET /api/admin/users
Get all users. Query params: `status` (PENDING, APPROVED, REJECTED), `role` (PROVIDER, CONSUMER)

### PATCH /api/admin/users/:id/approve
Approve a user.

### PATCH /api/admin/users/:id/reject
Reject a user.

### GET /api/admin/users/stats
Get system statistics.

### PATCH /api/admin/users/:id/suspend
Suspend a user (blocks all authenticated access until reinstated).

## Notifications

### GET /api/notifications
Get current user's notifications (newest first, max 100). Query: `unread=true` to filter.

### GET /api/notifications/unread-count
Returns `{ count: number }`.

### PATCH /api/notifications/:id/read
Mark a notification as read.

### PATCH /api/notifications/read-all
Mark all notifications as read.

## Rides

### POST /api/rides/start
Start a ride for a CLAIMED listing. Requires CONSUMER role.

**Request Body:**
```json
{ "listingId": "uuid" }
```

### PATCH /api/rides/:rideId/arrive
Mark arrival at pickup location.

### PATCH /api/rides/:rideId/complete
Complete the ride; marks the listing as COMPLETED.

### GET /api/rides/my-rides
List rides relevant to the current user (own rides for consumers, rides on own listings for providers).

## Geocode

### GET /api/geocode/geocode?address=...
Get coordinates for an address.

### GET /api/geocode/reverse-geocode?lat=...&lng=...
Get sector/address from coordinates.