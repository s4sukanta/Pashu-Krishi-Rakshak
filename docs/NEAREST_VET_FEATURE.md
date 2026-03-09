# Nearest Vet Location Feature

## Overview
Pashu Krishi Rakshak now displays the nearest veterinary service to farmers whenever they receive a diagnosis, helping them quickly find professional help when needed.

## How It Works

### User Experience
1. When the app loads, it requests the user's location (one-time permission)
2. The app finds the nearest veterinary service using AWS Geo Places API
3. Every diagnosis result displays:
   - Veterinary service name
   - Full address
   - Distance in kilometers
   - Available in all 3 languages (English, Hindi, Bengali)

### Technical Implementation

**Frontend (`src/app/app/page.tsx`)**
- Fetches geolocation once on app load
- Calls `/location` endpoint with coordinates
- Caches result in component state
- Displays vet card on every diagnosis result

**Backend (`backend/src/location/index.js`)**
- Receives latitude/longitude coordinates
- Queries AWS Geo Places API for "veterinary" services
- Uses Haversine formula to calculate accurate distance
- Returns: name, address, distance in km

**Timeline Components**
- Both `AccessibleCaseTimeline` and `CaseTimeline` display vet location
- Shows in diagnosis history for follow-up tracking

## API Endpoint

```
POST /location
Authorization: Bearer {cognito-id-token}
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response:**
```json
{
  "name": "City Veterinary Hospital",
  "address": "123 Main Street, New Delhi, Delhi 110001",
  "distanceKm": "2.45"
}
```

## Design Decisions

### Why Fetch Once?
For the current implementation, location is fetched once on app load rather than per-diagnosis:
- Simpler implementation
- Reduces API calls
- Farmers typically don't move between vets during a session
- Can be enhanced to re-fetch if needed

### Error Handling
- Graceful degradation if location permission denied
- App continues to work without vet location
- No blocking errors or crashes

## Multilingual Support

| Language | Label |
|----------|-------|
| English | "Nearest Veterinary Service" |
| Hindi | "नज़दीकी पशु चिकित्सालय" |
| Bengali | "নিকটতম পশু চিকিৎসালয়" |

## Future Enhancements
- Re-fetch location for each diagnosis (mobile farmers)
- "Get Directions" button with Google Maps integration
- Show top 3 nearby vets instead of just one
- Display vet contact information
- Cache with expiry time
- Manual location override option

## AWS Services Used
- **AWS Geo Places API**: Location-based search for veterinary services
- **API Gateway**: RESTful endpoint with CORS and Cognito auth
- **Lambda**: Serverless function for location processing
