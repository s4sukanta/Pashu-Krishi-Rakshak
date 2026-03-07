# Bug Exploration Test Findings

## Test Execution Summary

**Date**: 2026-03-07
**Test File**: `tests/bug-exploration.test.ts`
**Status**: ✅ Bug Successfully Detected (Test Failed as Expected)

## Counterexamples Found

### 1. 401 Unauthorized Error on API Requests

**Test**: `should fail with 401 when using token from existing User Pool`
**Result**: FAILED (Expected - proves bug exists)

```
Status: 401 Unauthorized
Expected: 200 OK
Actual: 401 Unauthorized
```

**Details**:
- Frontend User Pool: `us-east-1_trkjSY02v` (existing pool)
- Backend User Pool: `PashuKrishiUserPool` (new pool created by template)
- Backend Authorizer ARN: `!GetAtt PashuKrishiUserPool.Arn`

### 2. User Pool Configuration Mismatch

**Frontend Configuration** (`.env.local`):
```
NEXT_PUBLIC_USER_POOL_ID=us-east-1_trkjSY02v
NEXT_PUBLIC_USER_POOL_CLIENT_ID=1qp5un4ug04jbg78mce8845os8
```

**Backend Configuration** (`backend/template.yaml`):
```yaml
PashuKrishiUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: PashuKrishiUsers
    # ... configuration ...

# Cognito Authorizer uses the NEW pool
Auth:
  Authorizers:
    CognitoAuth:
      UserPoolArn: !GetAtt PashuKrishiUserPool.Arn
```

**Mismatch**: Frontend uses EXISTING pool, Backend creates and validates against NEW pool.

### 3. CORS Error (Symptom, Not Root Cause)

**Observation**: Browser shows "No 'Access-Control-Allow-Origin' header is present on the requested resource"

**Analysis**: 
- CORS is correctly configured in `template.yaml`:
  ```yaml
  AllowOrigin: "'https://main.dz4umnvfh0vrz.amplifyapp.com'"
  AllowCredentials: true
  ```
- However, API Gateway does NOT return CORS headers on 401/403 errors from Cognito authorizer
- This is a **symptom** of the 401 error, not the root cause
- The CORS error message misleads developers into thinking CORS is misconfigured

## Root Cause Analysis

**Primary Root Cause**: User Pool ARN Mismatch

The backend SAM template creates a **NEW** Cognito User Pool (`PashuKrishiUserPool`) and configures the API Gateway Cognito authorizer to validate tokens from this new pool. However, the frontend application is configured to authenticate users against an **EXISTING** User Pool (`us-east-1_trkjSY02v`).

When a user authenticates:
1. User logs in via frontend → receives token from EXISTING pool (`us-east-1_trkjSY02v`)
2. Frontend sends API request with token from EXISTING pool
3. API Gateway Cognito authorizer validates token against NEW pool (`PashuKrishiUserPool`)
4. Token validation fails (wrong pool) → 401 Unauthorized
5. API Gateway doesn't return CORS headers on 401 from authorizer → Browser shows CORS error

**Impact**: All authenticated API requests fail immediately after login, preventing users from accessing any protected endpoints (`/history`, `/analyze`, `/location`).

## Configuration Verification

### ✅ CORS Configuration
- AllowOrigin: Correctly set to Amplify domain
- AllowCredentials: Correctly set to true
- AllowHeaders: Includes Authorization header
- Gateway Responses: Configured for 401 and 403 errors

### ✅ Lambda Configuration
- AnalyzeFunction Timeout: 120 seconds (sufficient for large images)
- AnalyzeFunction Memory: 1024 MB (sufficient)
- Global Timeout: 30 seconds (appropriate for other functions)

### ✅ Environment Variables
- NEXT_PUBLIC_API_URL: ✓ Defined
- NEXT_PUBLIC_USER_POOL_ID: ✓ Defined
- NEXT_PUBLIC_USER_POOL_CLIENT_ID: ✓ Defined
- NEXT_PUBLIC_AWS_REGION: ✓ Defined

## Recommended Fix

**Option 1: Use Existing User Pool (Recommended)**

Update `backend/template.yaml` to use the existing User Pool instead of creating a new one:

```yaml
Parameters:
  ExistingUserPoolArn:
    Type: String
    Default: "arn:aws:cognito-idp:us-east-1:ACCOUNT_ID:userpool/us-east-1_trkjSY02v"
    Description: ARN of the existing Cognito User Pool

Resources:
  PashuKrishiApi:
    Type: AWS::Serverless::Api
    Properties:
      # ... other properties ...
      Auth:
        DefaultAuthorizer: CognitoAuth
        Authorizers:
          CognitoAuth:
            UserPoolArn: !Ref ExistingUserPoolArn  # Use existing pool
```

**Option 2: Use New User Pool**

Update frontend configuration to use the new User Pool created by the template:
1. Deploy the SAM template
2. Get the new User Pool ID and Client ID from CloudFormation outputs
3. Update `.env.local` and Amplify Console environment variables
4. Migrate existing users to the new pool (if needed)

**Recommendation**: Option 1 is preferred because:
- No user migration required
- Existing users can continue to authenticate
- Less disruptive to production environment
- Maintains existing authentication setup

## Test Results

```
Test Suites: 1 failed, 1 total
Tests:       1 failed, 4 passed, 5 total

✗ should fail with 401 when using token from existing User Pool (EXPECTED FAILURE)
✓ should document the User Pool configuration mismatch
✓ should verify CORS is configured for Amplify domain
✓ should verify Lambda timeout is sufficient for large images
✓ should verify environment variables are defined
```

**Conclusion**: Bug successfully detected and root cause identified. The test failure confirms the User Pool ARN mismatch issue exists in the current deployment.
