import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

const ISLAMABAD_BOUNDS = {
  minLat: 33.4,
  maxLat: 33.9,
  minLng: 72.8,
  maxLng: 73.3
};

const SECTOR_COORDS: Record<string, [number, number]> = {
  'F-6': [33.6465, 73.0113],
  'F-7': [33.6524, 73.0192],
  'F-8': [33.6581, 73.0275],
  'F-10': [33.6701, 73.0441],
  'F-11': [33.6758, 73.0518],
  'G-5': [33.5971, 72.9890],
  'G-6': [33.6023, 72.9964],
  'G-7': [33.6081, 73.0048],
  'G-8': [33.6139, 73.0123],
  'G-9': [33.6198, 73.0203],
  'G-10': [33.6256, 73.0281],
  'G-11': [33.6312, 73.0360],
  'G-12': [33.6370, 73.0439],
  'E-7': [33.6468, 72.9566],
  'E-11': [33.6683, 72.9750],
};

const getCoordinatesFromAddress = (address: string): { lat: number; lng: number } | null => {
  const upperAddress = address.toUpperCase();
  
  for (const [sector, coords] of Object.entries(SECTOR_COORDS)) {
    if (upperAddress.includes(sector)) {
      const offset = Math.random() * 0.01 - 0.005;
      return {
        lat: coords[0] + offset,
        lng: coords[1] + offset
      };
    }
  }
  
  return {
    lat: 33.6844 + (Math.random() * 0.04 - 0.02),
    lng: 73.0479 + (Math.random() * 0.04 - 0.02)
  };
};

router.get('/geocode', async (req: Request, res: Response) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const coords = getCoordinatesFromAddress(address as string);
    
    if (coords) {
      return res.json(coords);
    }

    res.json({ lat: 33.6844, lng: 73.0479 });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
});

router.get('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    if (
      latNum < ISLAMABAD_BOUNDS.minLat ||
      latNum > ISLAMABAD_BOUNDS.maxLat ||
      lngNum < ISLAMABAD_BOUNDS.minLng ||
      lngNum > ISLAMABAD_BOUNDS.maxLng
    ) {
      return res.json({ sector: 'Unknown', address: 'Outside Islamabad' });
    }

    let closestSector = 'F-7';
    let minDistance = Infinity;

    for (const [sector, coords] of Object.entries(SECTOR_COORDS)) {
      const distance = Math.sqrt(
        Math.pow(latNum - coords[0], 2) + Math.pow(lngNum - coords[1], 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestSector = sector;
      }
    }

    res.json({ sector: closestSector, address: `Sector ${closestSector}, Islamabad` });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
});

export default router;