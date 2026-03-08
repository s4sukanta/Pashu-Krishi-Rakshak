# 401 Unauthorized + CORS Error Investigation [RESOLVED]

## ✅ Issue Resolved

**Resolution Date**: March 8, 2026

**Root Cause**: Frontend was sending `accessToken` instead of `idToken` to API Gateway Cognito authorizer.

**Solution**: 
1. Changed frontend to use `session.tokens?.idToken` instead of `accessToken`
2. Added `ALLOWED_ORIGIN` environment variable to all Lambda functions for proper CORS handling
3. Fixed Gateway Responses configuration in SAM template to use correct syntax

**Key Changes**:
- `src/app/app/page.tsx`: Created `getAuthToken()` helper that returns `idToken`
- `backend/template.yaml`: Added `AllowedOrigin` parameter and `ALLOWED_ORIGIN` env var to Lambdas
- `backend/template.yaml`: Fixed `GatewayResponses` syntax (moved from separate resources to API property)
- All Lambda functions: Added CORS headers using `process.env.ALLOWED_ORIGIN`

**Status**: Users can now successfully authenticate and make API calls.

---

## Original Investigation (For Historical Reference)

**Problem**: After login, all API requests failed with 401 Unauthorized errors, followed by CORS errors in the browser console.

**Error Pattern**:
```
Access to fetch at 'https://edm1jvi975.execute-api.us-east-1.amazonaws.com/Prod/history?userId=...' 
from origin 'https://main.dz4umnvfh0vrz.amplifyapp.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.

GET https://edm1jvi975.execute-api.us-east-1.amazonaws.com/Prod/history?userId=... 
net::ERR_FAILED 401 (Unauthorized)
```

**Additional Error**: 
```
POST https://cognito-idp.us-east-1.amazonaws.com/ 400 (Bad Request)
```

## Resolution Summary

### What Fixed It

**Primary Fix**: Token Type Change
- **Before**: Frontend sent `session.tokens?.accessToken`
- **After**: Frontend sends `session.tokens?.idToken`
- **Why**: API Gateway Cognito authorizer expects ID tokens by default when no OAuth scopes are configured

**Secondary Fixes**:

1. **Lambda CORS Handling**:
   - Added `ALLOWED_ORIGIN` environment variable to all Lambda functions
   - Lambdas now return proper CORS headers using `process.env.ALLOWED_ORIGIN`
   - Parameterized origin in SAM template for easy updates

2. **Gateway Responses**:
   - Fixed syntax: moved from separate `AWS::ApiGateway::GatewayResponse` resources
   - To: `GatewayResponses` property under `AWS::Serverless::Api`
   - Now properly returns CORS headers on 401/403/4xx errors

### Code Changes

**Frontend (`src/app/app/page.tsx`)**:
```typescript
// NEW: Helper function to get ID token
const getAuthToken = async (): Promise<string> => {
  const { fetchAuthSession } = await import('aws-amplify/auth');
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString(); // Changed from accessToken
  if (!token) {
    throw new Error('No auth token available');
  }
  return token;
};

// Usage in API calls
const token = await getAuthToken();
```

**Backend (`backend/template.yaml`)**:
```yaml
Parameters:
  AllowedOrigin:
    Type: String
    Default: "https://main.dz4umnvfh0vrz.amplifyapp.com"

Globals:
  Function:
    Environment:
      Variables:
        ALLOWED_ORIGIN: !Ref AllowedOrigin

Resources:
  PashuKrishiApi:
    Type: AWS::Serverless::Api
    Properties:
      Cors:
        AllowOrigin: !Sub "'${AllowedOrigin}'"
      GatewayResponses:  # Fixed syntax
        UNAUTHORIZED:
          StatusCode: "401"
          ResponseParameters:
            Headers:
              Access-Control-Allow-Origin: !Sub "'${AllowedOrigin}'"
```

**Lambda Functions** (all three):
```javascript
// Added CORS headers using environment variable
return {
  statusCode: 200,
  headers: {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
};
```

### Why This Worked

1. **ID Token vs Access Token**: 
   - API Gateway Cognito authorizers validate ID tokens by default
   - Access tokens are for OAuth scopes (which we don't use)
   - ID token contains user identity claims needed for authorization

2. **Proper CORS Configuration**:
   - Lambda functions now explicitly return CORS headers
   - Gateway Responses ensure CORS headers on error responses
   - Parameterized origin makes it easy to update for different environments

3. **Consistent Configuration**:
   - All components (API Gateway, Lambdas, Gateway Responses) use same origin
   - No hardcoded values, everything references `AllowedOrigin` parameter

---

## Original Investigation Timeline (For Historical Reference)

### Phase 1: Initial Diagnosis (User Pool ARN Mismatch Theory)

**Initial Hypothesis**: Frontend was configured to use an existing User Pool (`us-east-1_trkjSY02v`), but backend was creating a NEW User Pool. Tokens from the existing pool were being rejected by the authorizer.

**Evidence**:
- Frontend `.env.local` had `NEXT_PUBLIC_USER_POOL_ID=us-east-1_trkjSY02v`
- Backend `template.yaml` was creating `PashuKrishiUserPool` resource
- API Gateway Cognito authorizer was configured with `!GetAtt PashuKrishiUserPool.Arn`

**Actions Taken**:
1. Created bug exploration tests to document the mismatch
2. Updated `backend/template.yaml` to reference existing User Pool using parameters
3. Added `AwsAccountId` parameter to construct User Pool ARN

**Result**: User discovered the "existing" User Pool didn't actually exist in AWS Cognito.

### Phase 2: Fresh User Pool Creation

**Discovery**: No User Pools existed in AWS Cognito. The User Pool ID in configuration was from a deleted/previous deployment.

**Actions Taken**:
1. Reverted template back to creating a NEW User Pool
2. Deployed backend with `sam build && sam deploy`
3. Got new User Pool ID and Client ID from CloudFormation outputs
4. Updated `.env.local` with new credentials
5. Updated Amplify Console environment variables
6. Redeployed frontend

**Result**: Still getting 401 Unauthorized errors after login.

### Phase 3: CORS Configuration Investigation

**Hypothesis**: CORS headers not being returned on 401 errors from Cognito authorizer.

**Evidence**:
- CORS error appears AFTER 401 error (symptom, not cause)
- API Gateway doesn't return CORS headers on 401/403 errors from Cognito authorizer by default

**Actions Taken**:
1. Added `ApiGatewayResponse401` and `ApiGatewayResponse403` resources to template
2. Configured Gateway Responses to return CORS headers on auth errors
3. Redeployed backend

**Result**: Gateway Responses may not work correctly with `AWS::Serverless::Api` (they're designed for `AWS::ApiGateway::RestApi`). Still getting 401 errors.

### Phase 4: Token Type Investigation

**Hypothesis**: Frontend might be sending wrong token type (accessToken vs idToken).

**Research Findings**:
- AWS Cognito authorizers accept BOTH ID tokens and Access tokens by default
- When OAuth Scopes are configured on the method, ONLY Access tokens are accepted
- Our template doesn't configure OAuth Scopes, so both token types should work

**Current Code**:
```typescript
const token = session.tokens?.accessToken?.toString() || '';
```

**Status**: Using accessToken, which should be valid.

## Current Theories

### Theory 1: Configuration Mismatch (Most Likely)

**Hypothesis**: The User Pool ID and Client ID in Amplify Console environment variables don't match the deployed CloudFormation stack.

**Why This Could Be The Issue**:
- Frontend is built with environment variables at build time
- If Amplify Console has old/wrong values, the built app will use wrong credentials
- Even after updating env vars, frontend needs to be redeployed

**How to Verify**:
1. Run `check-deployment.ps1` to compare CloudFormation outputs with `.env.local`
2. Check Amplify Console environment variables match CloudFormation outputs
3. Verify frontend was redeployed AFTER updating env vars

**Next Steps**:
- Get CloudFormation outputs: `UserPoolId`, `UserPoolClientId`, `ApiUrl`
- Compare with Amplify Console environment variables
- If mismatch, update and redeploy

### Theory 2: Cognito 400 Bad Request

**Observation**: Console shows `POST https://cognito-idp.us-east-1.amazonaws.com/ 400 (Bad Request)` during login.

**Possible Causes**:
- Invalid User Pool Client configuration
- Missing required authentication flows
- User Pool Client doesn't exist or was deleted

**How to Verify**:
1. Check if User Pool Client exists in Cognito Console
2. Verify Client ID matches CloudFormation output
3. Check Client configuration has required auth flows enabled

### Theory 3: Token Expiration or Invalid Format

**Hypothesis**: Token is being generated but is invalid or expired.

**Possible Causes**:
- Token generated from wrong User Pool
- Token expired before API call
- Token format doesn't match what authorizer expects

**How to Verify**:
1. Decode the JWT token in browser console
2. Check `iss` (issuer) claim matches User Pool
3. Check `exp` (expiration) claim
4. Verify token is being sent in Authorization header

### Theory 4: API Gateway Authorizer Misconfiguration

**Hypothesis**: Cognito authorizer in API Gateway is misconfigured.

**Possible Causes**:
- Authorizer pointing to wrong User Pool ARN
- Authorizer not properly attached to API methods
- Token source not configured correctly

**How to Verify**:
1. Check API Gateway console → Authorizers
2. Verify User Pool ARN matches deployed User Pool
3. Check authorizer is attached to all protected methods

## What We've Ruled Out

### ✗ CORS Misconfiguration (Primary Cause)

**Why Ruled Out**: 
- CORS is correctly configured in template with Amplify domain
- CORS error is a SYMPTOM of 401, not the root cause
- API Gateway doesn't return CORS headers on 401 from authorizer (expected behavior)

**Evidence**:
```yaml
Cors:
  AllowOrigin: "'https://main.dz4umnvfh0vrz.amplifyapp.com'"
  AllowCredentials: true
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
```

### ✗ Wrong Token Type

**Why Ruled Out**:
- Using `accessToken` which is valid for Cognito authorizers
- No OAuth Scopes configured, so both ID and Access tokens should work
- Research confirms Cognito authorizers accept both token types by default

### ✗ Lambda Timeout Issues

**Why Ruled Out**:
- 401 error happens immediately (not after timeout)
- Lambda timeout is 120s for AnalyzeFunction, 30s for others
- Error occurs on `/history` GET request (fast operation)

### ✗ Missing Environment Variables

**Why Ruled Out**:
- Diagnostic logs show: "API URL: Present", "Token: Present"
- Environment variables are defined in Amplify Console
- Frontend builds successfully

## Diagnostic Tools Created

### 1. Bug Exploration Tests
- **Location**: `tests/bug-exploration.test.ts`
- **Purpose**: Document User Pool ARN mismatch
- **Status**: Completed, identified original issue

### 2. Deployment Checker Script
- **Location**: `check-deployment.ps1`
- **Purpose**: Compare CloudFormation outputs with local/Amplify configuration
- **Usage**: `.\check-deployment.ps1`

### 3. Documentation
- **Location**: `docs/FRESH_DEPLOYMENT.md`
- **Purpose**: Step-by-step guide for fresh User Pool deployment

## Current Configuration

### Backend (CloudFormation Stack)
- **Stack Name**: `pashu-krishi-rakshak-app`
- **Region**: `us-east-1`
- **API Gateway**: `edm1jvi975.execute-api.us-east-1.amazonaws.com`
- **User Pool**: Created by template (ID from CloudFormation outputs)
- **User Pool Client**: Created by template (ID from CloudFormation outputs)

### Frontend (Amplify Hosting)
- **App ID**: `dz4umnvfh0vrz`
- **Domain**: `https://main.dz4umnvfh0vrz.amplifyapp.com`
- **Branch**: `main`
- **Environment Variables**: Should match CloudFormation outputs

### Required Environment Variables
```
NEXT_PUBLIC_API_URL=<from CloudFormation ApiUrl output>
NEXT_PUBLIC_USER_POOL_ID=<from CloudFormation UserPoolId output>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<from CloudFormation UserPoolClientId output>
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Next Steps to Resolve

### Step 1: Verify Configuration Match
```powershell
.\check-deployment.ps1
```

This will show if there's a mismatch between CloudFormation and local/Amplify config.

### Step 2: Update Configuration (If Mismatch Found)

1. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_USER_POOL_ID=<correct value from CloudFormation>
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=<correct value from CloudFormation>
   NEXT_PUBLIC_API_URL=<correct value from CloudFormation>
   ```

2. **Update Amplify Console**:
   - Go to: https://console.aws.amazon.com/amplify/
   - Select app: `dz4umnvfh0vrz`
   - Go to "Environment variables"
   - Update all `NEXT_PUBLIC_*` variables
   - Save changes

3. **Redeploy Frontend**:
   - Trigger manual redeploy in Amplify Console
   - OR push to GitHub to trigger automatic deployment

### Step 3: Test After Redeployment

1. Clear browser cache and cookies
2. Go to app: `https://main.dz4umnvfh0vrz.amplifyapp.com`
3. Register a new user (fresh User Pool has no users)
4. Verify email
5. Login
6. Check browser console for errors
7. Try uploading an image

### Step 4: Debug Token Issues (If Still Failing)

Add this to browser console after login to inspect token:
```javascript
// Get token from session
const session = await fetchAuthSession();
const token = session.tokens?.accessToken?.toString();

// Decode JWT (without verification)
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));

console.log('Token Payload:', payload);
console.log('Issuer (iss):', payload.iss);
console.log('Client ID (client_id):', payload.client_id);
console.log('Expiration:', new Date(payload.exp * 1000));
```

Verify:
- `iss` matches your User Pool: `https://cognito-idp.us-east-1.amazonaws.com/<UserPoolId>`
- `client_id` matches your User Pool Client ID
- Token is not expired

## Related Files

- `backend/template.yaml` - SAM template with User Pool and API Gateway
- `backend/samconfig.toml` - Deployment configuration
- `.env.local` - Local environment variables
- `src/aws-exports.ts` - Amplify configuration
- `src/app/app/page.tsx` - Frontend code with API calls
- `tests/bug-exploration.test.ts` - Bug exploration tests
- `tests/BUG_EXPLORATION_FINDINGS.md` - Detailed findings
- `check-deployment.ps1` - Configuration verification script

## References

- [AWS API Gateway CORS with Cognito Authorizer](https://repost.aws/questions/QUm9R91K96RtaJUfeS7Kk8Vw/found-bug-api-gateway-cognito-authorizer)
- [ID Token vs Access Token with API Gateway](https://theburningmonk.com/2024/09/is-it-safe-to-use-id-tokens-with-cognito-authorizers/)
- [Gateway Responses for CORS on Auth Errors](https://docs.aws.amazon.com/apigateway/latest/developerguide/supported-gateway-response-types.html)
