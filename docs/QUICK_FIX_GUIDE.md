# Quick Fix Guide: "Failed to Fetch" Error

## Immediate Actions (Do These First)

### 1. Check Browser Console (30 seconds)

**Steps**:
1. Press F12 to open DevTools
2. Go to Console tab
3. Try uploading image again
4. Look for red error messages

**What you're looking for**:
- `CORS policy` → CORS issue (see Fix #1)
- `401` → Authentication issue (see Fix #2)
- `Network request failed` → API URL wrong (see Fix #3)
- `timeout` → Lambda timeout (see Fix #4)

### 2. Check Network Tab (1 minute)

**Steps**:
1. Open DevTools → Network tab
2. Try upload again
3. Click on the `/analyze` request (red)
4. Check Status code

**Status Codes**:
- **0 or (failed)** → CORS or network issue
- **401** → Not authenticated
- **403** → Permission denied
- **500** → Backend error
- **504** → Timeout

### 3. Verify Environment Variables (2 minutes)

**Steps**:
1. Go to AWS Amplify Console
2. Click your app
3. Go to "Environment variables"
4. Check if these exist:

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID
NEXT_PUBLIC_AWS_REGION
```

**If missing**: Add them and click "Save" → Redeploy

## Most Common Fixes

### Fix #1: CORS Issue (Most Common - 80% of cases)

**Symptoms**:
- Console shows: `CORS policy: No 'Access-Control-Allow-Origin' header`
- Network tab shows: Status 0 or failed

**Solution**:

1. Edit `backend/template.yaml`
2. Find the `Cors:` section under `PashuKrishiApi`
3. Change from:
```yaml
AllowOrigin: "'*'"
```

To (replace with YOUR Amplify domain):
```yaml
AllowOrigin: "'https://main.YOUR_AMPLIFY_ID.amplifyapp.com'"
```

4. Redeploy backend:
```bash
cd backend
sam build
sam deploy
```

**How to find your Amplify domain**:
- Go to Amplify Console
- Your app URL is shown at the top
- Copy it (e.g., `https://main.d1234abcd.amplifyapp.com`)

### Fix #2: Missing Environment Variables (10% of cases)

**Symptoms**:
- Console shows: `undefined` in API URL
- Network request goes to wrong URL

**Solution**:

1. Go to AWS Amplify Console
2. Select your app
3. Click "Environment variables" in left menu
4. Click "Manage variables"
5. Add these (get values from SAM outputs):

```
NEXT_PUBLIC_API_URL = https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/Prod/
NEXT_PUBLIC_USER_POOL_ID = us-east-1_XXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID = XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_AWS_REGION = us-east-1
```

6. Click "Save"
7. Go to "Deployments" tab
8. Click "Redeploy this version"

**How to get these values**:
```bash
cd backend
sam list stack-outputs --stack-name YOUR_STACK_NAME
```

### Fix #3: Authentication Token Not Sent (5% of cases)

**Symptoms**:
- Status 401 in network tab
- Console shows: `Unauthorized`

**Solution**:

Check if user is logged in:
1. Open DevTools → Console
2. Type:
```javascript
localStorage.getItem('CognitoIdentityServiceProvider.YOUR_CLIENT_ID.LastAuthUser')
```

If null → User not logged in, need to login again

If has value → Token might be expired, logout and login again

### Fix #4: Lambda Timeout (2% of cases)

**Symptoms**:
- Request takes 30+ seconds
- Status 504 Gateway Timeout
- Large images fail, small images work

**Solution**:

1. Edit `backend/template.yaml`
2. Find `Globals:` section at top
3. Change:
```yaml
Globals:
  Function:
    Timeout: 30
```

To:
```yaml
Globals:
  Function:
    Timeout: 120
    MemorySize: 512
```

4. Redeploy:
```bash
cd backend
sam build
sam deploy
```

### Fix #5: Wrong API URL (3% of cases)

**Symptoms**:
- Network tab shows request to wrong URL
- 404 Not Found

**Solution**:

1. Check your API Gateway URL:
```bash
aws apigateway get-rest-apis --query 'items[?name==`PashuKrishiApi`].[id,name]' --output table
```

2. Your URL should be:
```
https://API_ID.execute-api.REGION.amazonaws.com/Prod/
```

3. Update in Amplify environment variables
4. Redeploy

## Emergency Diagnostic Code

Add this to `src/app/app/page.tsx` in the `handleSubmit` function to get detailed errors:

```typescript
try {
  console.log('=== DIAGNOSTIC INFO ===');
  console.log('API URL:', API_URL);
  console.log('User ID:', userId);
  console.log('Token:', token ? 'Present' : 'Missing');
  console.log('File:', file ? file.name : 'No file');
  
  const response = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  console.log('Response Status:', response.status);
  console.log('Response OK:', response.ok);
  
  const responseText = await response.text();
  console.log('Response Body:', responseText);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }
  
  const data = JSON.parse(responseText);
  // ... rest of code
  
} catch (err) {
  console.error('=== ERROR DETAILS ===');
  console.error('Error:', err);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  setError(err.message || "Failed to analyze");
}
```

## Verification Steps

After applying a fix:

1. **Clear browser cache**: Ctrl+Shift+Delete → Clear cache
2. **Hard refresh**: Ctrl+Shift+R
3. **Logout and login again**: Fresh authentication
4. **Try upload again**: Test with small image first
5. **Check console**: Should see no errors

## Still Not Working?

### Get Detailed Logs:

**Frontend logs** (Browser Console):
- Press F12
- Console tab
- Try upload
- Copy all red errors

**Backend logs** (CloudWatch):
```bash
aws logs tail /aws/lambda/AnalyzeFunction --follow
```

**API Gateway logs**:
1. Go to API Gateway Console
2. Select your API
3. Stages → Prod → Logs/Tracing
4. Enable CloudWatch Logs
5. Try request again
6. Check logs

### Common Error Messages and Fixes:

| Error Message | Cause | Fix |
|--------------|-------|-----|
| `CORS policy` | CORS not configured | Fix #1 |
| `401 Unauthorized` | Not logged in | Logout/login |
| `403 Forbidden` | Wrong permissions | Check IAM |
| `404 Not Found` | Wrong URL | Fix #5 |
| `500 Internal Server Error` | Lambda crashed | Check CloudWatch |
| `504 Gateway Timeout` | Lambda timeout | Fix #4 |
| `Network request failed` | Can't reach API | Check URL |
| `Failed to fetch` | Generic network | Check all above |

## Quick Test

To test if backend is working at all:

```bash
# Test OPTIONS (CORS preflight)
curl -X OPTIONS https://YOUR_API_URL/analyze -v

# Should return 200 with CORS headers
```

If this fails → CORS issue (Fix #1)
If this works → Authentication or other issue

## Priority Order

Fix in this order:

1. ✅ Check environment variables (2 min)
2. ✅ Fix CORS if needed (5 min)
3. ✅ Verify authentication (1 min)
4. ✅ Check Lambda logs (3 min)
5. ✅ Increase timeout if needed (5 min)

Most issues are #1 or #2.
