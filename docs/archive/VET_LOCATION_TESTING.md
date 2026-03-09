# Nearest Vet Feature - Testing Checklist

## Pre-Demo Testing (Do This Now!)

### 1. Browser Permissions
- [ ] Open app in browser
- [ ] Check if geolocation permission prompt appears
- [ ] Grant location access
- [ ] Verify no console errors

### 2. Location Fetch
- [ ] Open browser DevTools → Network tab
- [ ] Look for POST request to `/location` endpoint
- [ ] Verify response contains: `name`, `address`, `distanceKm`
- [ ] Check response status is 200

### 3. New Diagnosis Flow
- [ ] Take/upload a photo of an animal
- [ ] Submit for diagnosis
- [ ] Wait for result screen
- [ ] Scroll down to see "Nearest Veterinary Service" card
- [ ] Verify: name, address, distance displayed correctly

### 4. Follow-Up Diagnosis Flow
- [ ] Go to History/Cases
- [ ] Open an existing case
- [ ] Click "Upload Follow Up"
- [ ] Submit new media
- [ ] Check if vet location shows in timeline

### 5. Multilingual Test
- [ ] Switch to Hindi → Check vet card shows "नज़दीकी पशु चिकित्सालय"
- [ ] Switch to Bengali → Check vet card shows "নিকটতম পশু চিকিৎসালয়"
- [ ] Switch back to English

### 6. Error Scenarios
- [ ] Deny location permission → App should still work, just no vet shown
- [ ] Check console for graceful error handling
- [ ] No blocking errors or crashes

## Quick Fixes If Issues Found

### Location Not Showing
1. Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
2. Verify backend is deployed with location endpoint
3. Check browser console for errors
4. Verify AWS Geo Places permissions in IAM

### CORS Errors
1. Check `AllowedOrigin` parameter in `backend/template.yaml`
2. Redeploy backend if origin changed
3. Clear browser cache

### Wrong Location
1. Check if browser is using accurate location
2. Test with different device/location
3. Verify Haversine calculation in backend

## Demo Day Talking Points
- "We fetch your location once when you open the app"
- "Every diagnosis shows the nearest vet automatically"
- "No need to search - we do it for you"
- "Works in all 3 languages"
- "Distance calculated accurately in kilometers"

## Backup Plan
If location feature fails during demo:
1. Have screenshots ready showing it working
2. Explain the feature conceptually
3. Show the backend code and AWS Geo Places integration
4. Mention it's a prototype feature being refined
