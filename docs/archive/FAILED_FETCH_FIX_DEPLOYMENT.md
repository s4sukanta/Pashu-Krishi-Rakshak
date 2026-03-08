# Failed Fetch Fix - Deployment Guide

## Issue Confirmed

Based on AWS logs and configuration analysis, the "Failed to fetch" error is caused by **CORS misconfiguration**.

### Root Cause
The `backend/template.yaml` was using `AllowOrigin: '*'` which doesn't work with credentialed requests (Authorization header). Browsers block such requests due to CORS security policy.

### Your Configuration
- **Amplify Domain**: `https://dz4umnvfh0vrz.amplifyapp.com`
- **API Gateway**: `https://edm1jvi975.execute-api.us-east-1.amazonaws.com/Prod/`
- **Environment Variables**: ✅ Already configured in Amplify Console

## Changes Made

### 1. Fixed CORS Configuration (`backend/template.yaml`)
```yaml
# BEFORE (Broken)
AllowOrigin: "'*'"

# AFTER (Fixed)
AllowOrigin: "'https://dz4umnvfh0vrz.amplifyapp.com'"
AllowCredentials: true
```

### 2. Increased Lambda Timeout (`backend/template.yaml`)
```yaml
# Added to AnalyzeFunction
Timeout: 120        # Increased from 30 seconds
MemorySize: 1024    # Increased from 256 MB
```

### 3. Improved Error Handling (`src/app/app/page.tsx`)
- Added environment variable validation
- Added detailed console logging for debugging
- Added specific error messages for different failure types (CORS, auth, timeout)
- Better error reporting to users

## Deployment Steps

### Step 1: Deploy Backend Changes

```bash
cd backend
sam build
sam deploy --region us-east-1
```

**Expected Output:**
```
Successfully created/updated stack - pashu-krishi-rakshak-app in us-east-1
```

### Step 2: Verify Backend Deployment

```bash
aws cloudformation describe-stacks --stack-name pashu-krishi-rakshak-app --region us-east-1 --query 'Stacks[0].Outputs'
```

**Verify:**
- API URL is still: `https://edm1jvi975.execute-api.us-east-1.amazonaws.com/Prod/`
- User Pool ID is still: `us-east-1_trkjSY02v`
- User Pool Client ID is still: `1qp5un4ug04jbg78mce8845os8`

### Step 3: Deploy Frontend Changes

```bash
# Commit and push changes
git add .
git commit -m "fix: resolve CORS issue for production image uploads"
git push origin main
```

**Amplify will automatically:**
1. Detect the push
2. Build the frontend
3. Deploy to `https://dz4umnvfh0vrz.amplifyapp.com`

### Step 4: Monitor Deployment

Go to AWS Amplify Console:
- https://console.aws.amazon.com/amplify/home?region=us-east-1#/dz4umnvfh0vrz

Watch the build progress and ensure it succeeds.

### Step 5: Test the Fix

1. Open your app: `https://dz4umnvfh0vrz.amplifyapp.com`
2. Login with your credentials
3. Upload a test image (start with a small one, ~2MB)
4. Open browser DevTools (F12) → Console tab
5. Check for diagnostic logs:
   ```
   === DIAGNOSTIC INFO ===
   API URL: https://edm1jvi975.execute-api.us-east-1.amazonaws.com/Prod/
   User ID: <your-user-id>
   Token: Present
   File: test-image.jpg (2048576 bytes)
   Response Status: 200
   Response OK: true
   ```

6. Verify the image analysis completes successfully

### Step 6: Test with Large Images

1. Upload a larger image (~8MB)
2. Verify it completes within 120 seconds (previously would timeout at 30s)
3. Check CloudWatch logs if needed:
   ```bash
   aws logs tail /aws/lambda/pashu-krishi-rakshak-app-AnalyzeFunction-XXXXX --follow --region us-east-1
   ```

## Verification Checklist

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Small image upload works (2MB)
- [ ] Large image upload works (8MB)
- [ ] No CORS errors in browser console
- [ ] Diagnosis results display correctly
- [ ] History saves correctly
- [ ] No "Failed to fetch" errors

## Troubleshooting

### If CORS errors still appear:

1. Check browser console for exact error message
2. Verify the request is going to the correct API URL
3. Check Network tab → Headers → Response Headers for `Access-Control-Allow-Origin`
4. Should see: `Access-Control-Allow-Origin: https://dz4umnvfh0vrz.amplifyapp.com`

### If Lambda times out:

1. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/pashu-krishi-rakshak-app-AnalyzeFunction-XXXXX --since 10m --region us-east-1
   ```
2. Look for "Task timed out" messages
3. If still timing out, increase timeout further to 180 seconds

### If environment variables are missing:

1. Check Amplify Console → Environment variables
2. Verify all NEXT_PUBLIC_* variables are set
3. Trigger a new deployment if variables were just added

## Rollback Plan

If the fix causes issues:

```bash
# Rollback backend
cd backend
git checkout HEAD~1 template.yaml
sam build
sam deploy --region us-east-1

# Rollback frontend
git revert HEAD
git push origin main
```

## Success Criteria

✅ Users can upload images from production Amplify domain
✅ No CORS errors in browser console
✅ Large images (up to 10MB) complete successfully
✅ Specific error messages guide users when issues occur
✅ Local development continues to work
✅ All other API endpoints (/history, /location) work correctly

## Next Steps

After successful deployment:
1. Monitor CloudWatch logs for any errors
2. Test with multiple users
3. Test with various image sizes and formats
4. Consider adding rate limiting if needed
5. Update documentation with new deployment process

## Support

If issues persist after deployment:
1. Check browser console (F12) for detailed error logs
2. Check CloudWatch logs for Lambda errors
3. Verify CORS headers in Network tab
4. Contact AWS support if infrastructure issues
