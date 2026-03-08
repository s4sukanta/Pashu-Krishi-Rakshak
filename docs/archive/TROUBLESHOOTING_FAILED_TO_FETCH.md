# Troubleshooting: "Failed to Fetch" Error

## Problem

After uploading an image in the deployed app, you're getting a "Failed to fetch" error. This indicates the frontend cannot communicate with the backend API.

## Common Causes

1. **CORS Issues** - API Gateway blocking requests from your Amplify domain
2. **Authentication Issues** - JWT token not being sent or invalid
3. **API Gateway URL Mismatch** - Wrong API URL in environment variables
4. **Lambda Function Errors** - Backend function crashing
5. **Network/Timeout Issues** - Request taking too long
6. **Missing Environment Variables** - API URL not set in Amplify

## Step-by-Step Diagnosis

### Step 1: Check Browser Console

**Action**: Open browser DevTools (F12) → Console tab

**Look for**:
```
Failed to fetch
CORS error
401 Unauthorized
403 Forbidden
Network error
```

**What to check**:
- Exact error message
- Request URL (is it correct?)
- Request headers (is Authorization header present?)
- Response status code

### Step 2: Check Network Tab

**Action**: Open DevTools → Network tab → Try upload again

**Look for**:
- Request to `/analyze` endpoint
- Status code (200, 401, 403, 500, etc.)
- Response body (error details)
- Request headers (Authorization token present?)
- Request payload (image data sent?)

**Common Issues**:
- **Status 0**: CORS issue or network blocked
- **Status 401**: Authentication failed
- **Status 403**: Forbidden (wrong permissions)
- **Status 500**: Backend error
- **Status 504**: Timeout

### Step 3: Verify Environment Variables in Amplify

**Action**: Go to AWS Amplify Console → Your App → Environment variables

**Required Variables**:
```
NEXT_PUBLIC_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/Prod/
NEXT_PUBLIC_USER_POOL_ID=YOUR_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=YOUR_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=YOUR_REGION
```

**Check**:
- [ ] All variables are set
- [ ] API_URL ends with `/Prod/` (with trailing slash)
- [ ] No typos in variable names
- [ ] Values match your actual AWS resources

**If missing**: Add them and redeploy

### Step 4: Check CORS Configuration

**Action**: Check API Gateway CORS settings

**File**: `backend/template.yaml`

**Current CORS**:
```yaml
Cors:
  AllowMethods: "'GET,POST,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  AllowOrigin: "'*'"
```

**Issue**: `AllowOrigin: "'*'"` should work, but might need specific domain

**Fix**: Update to your Amplify domain:
```yaml
Cors:
  AllowMethods: "'GET,POST,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  AllowOrigin: "'https://main.YOUR_AMPLIFY_ID.amplifyapp.com'"
```

**Then redeploy backend**:
```bash
cd backend
sam build
sam deploy
```

### Step 5: Check Lambda Function Logs

**Action**: Go to AWS CloudWatch → Log groups → `/aws/lambda/AnalyzeFunction`

**Look for**:
- Recent error logs
- Stack traces
- "Task timed out" messages
- Permission errors

**Common Errors**:
```
Error: Cannot find module
Error: Access Denied (Bedrock permissions)
Error: Table does not exist (DynamoDB)
Timeout after 30 seconds
```

### Step 6: Test API Directly

**Action**: Test API Gateway endpoint with curl/Postman

**Get Auth Token**:
1. Login to your app
2. Open DevTools → Application → Local Storage
3. Find Cognito tokens
4. Copy `accessToken`

**Test Request**:
```bash
curl -X POST https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/Prod/analyze \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "media=@test-image.jpg" \
  -F "language=english" \
  -F "userId=test-user-id"
```

**Expected**: 200 OK with diagnosis JSON
**If fails**: Check error message for clues

### Step 7: Verify Cognito Authentication

**Action**: Check if user is properly authenticated

**In Browser Console**:
```javascript
// Check if user is logged in
const session = await fetchAuthSession();
console.log('User:', session.userSub);
console.log('Token:', session.tokens?.accessToken);
```

**Issues**:
- No token → User not logged in
- Expired token → Need to refresh
- Invalid token → Re-login required

## Common Fixes

### Fix 1: Update CORS in API Gateway

**Problem**: CORS blocking requests from Amplify domain

**Solution**:
1. Edit `backend/template.yaml`
2. Update `AllowOrigin` to your Amplify domain
3. Redeploy backend

**Code**:
```yaml
Cors:
  AllowOrigin: "'https://main.YOUR_AMPLIFY_ID.amplifyapp.com'"
```

### Fix 2: Add Environment Variables

**Problem**: Missing API URL in Amplify

**Solution**:
1. Go to Amplify Console → Environment variables
2. Add `NEXT_PUBLIC_API_URL`
3. Trigger new deployment

### Fix 3: Fix Lambda Permissions

**Problem**: Lambda can't access Bedrock/DynamoDB

**Solution**:
1. Check `backend/template.yaml` IAM policies
2. Ensure Lambda has:
   - `bedrock:InvokeModel`
   - `dynamodb:PutItem`
   - `dynamodb:Query`

**Code**:
```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action:
          - bedrock:InvokeModel
          - bedrock:Retrieve
        Resource: "*"
      - Effect: Allow
        Action:
          - dynamodb:PutItem
          - dynamodb:Query
        Resource: 
          - !GetAtt HistoryTable.Arn
```

### Fix 4: Increase Lambda Timeout

**Problem**: Request timing out (large images)

**Solution**:
1. Edit `backend/template.yaml`
2. Increase timeout from 30s to 60s or 120s

**Code**:
```yaml
Globals:
  Function:
    Timeout: 120  # Increase from 30
    MemorySize: 512  # Increase if needed
```

### Fix 5: Check API Gateway Authorizer

**Problem**: Cognito authorizer rejecting requests

**Solution**:
1. Verify User Pool ARN in `backend/template.yaml`
2. Check if it matches your actual User Pool
3. Ensure token is being sent in Authorization header

### Fix 6: Add Error Handling in Frontend

**Problem**: Generic "Failed to fetch" doesn't show real error

**Solution**: Update error handling in `src/app/app/page.tsx`

**Current**:
```typescript
catch (err: unknown) {
  setError(err instanceof Error ? err.message : "Failed to analyze the image.");
}
```

**Better**:
```typescript
catch (err: unknown) {
  console.error('Full error:', err);
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError("Failed to analyze the image. Check console for details.");
  }
}
```

## Debugging Checklist

Run through this checklist:

- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Verify environment variables in Amplify
- [ ] Check CORS configuration in API Gateway
- [ ] Review Lambda logs in CloudWatch
- [ ] Test API endpoint directly with curl
- [ ] Verify user is authenticated
- [ ] Check Lambda has correct permissions
- [ ] Verify API Gateway URL is correct
- [ ] Check if Lambda timeout is sufficient

## Quick Diagnostic Commands

### Check if API is reachable:
```bash
curl -I https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/Prod/analyze
```

### Check Lambda logs:
```bash
aws logs tail /aws/lambda/AnalyzeFunction --follow
```

### Check API Gateway:
```bash
aws apigateway get-rest-apis
```

### Check Cognito User Pool:
```bash
aws cognito-idp describe-user-pool --user-pool-id YOUR_USER_POOL_ID
```

## Most Likely Causes (In Order)

1. **CORS Issue** (80% of cases)
   - Fix: Update AllowOrigin in backend/template.yaml
   
2. **Missing Environment Variables** (10% of cases)
   - Fix: Add NEXT_PUBLIC_API_URL in Amplify Console

3. **Authentication Issue** (5% of cases)
   - Fix: Check token is being sent, verify Cognito config

4. **Lambda Permissions** (3% of cases)
   - Fix: Add Bedrock/DynamoDB permissions

5. **Lambda Timeout** (2% of cases)
   - Fix: Increase timeout in template.yaml

## Next Steps

1. **Immediate**: Check browser console and network tab
2. **Quick Fix**: Verify environment variables in Amplify
3. **If CORS**: Update backend/template.yaml and redeploy
4. **If Auth**: Check Cognito configuration
5. **If Backend**: Check Lambda logs in CloudWatch

## Getting More Information

To get detailed error information, temporarily add this to your frontend:

```typescript
// In src/app/app/page.tsx, in handleSubmit function
try {
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  // Add detailed logging
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  
  const data = await response.json();
  console.log('Response data:', data);

  if (!response.ok) {
    console.error('Error response:', data);
    throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  // ... rest of code
} catch (err) {
  console.error('Fetch error details:', {
    message: err.message,
    stack: err.stack,
    type: err.constructor.name
  });
  setError(err instanceof Error ? err.message : "Failed to analyze");
}
```

This will give you much more detailed error information in the console.

## Contact Points for Help

If still stuck, check:
1. Browser console (F12)
2. Network tab (detailed request/response)
3. CloudWatch logs (Lambda errors)
4. API Gateway logs (request tracing)
5. Amplify build logs (deployment issues)

The error message and status code will tell you exactly where the problem is.
