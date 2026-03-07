# Failed Fetch Image Upload Fix - Bugfix Design

## Overview

The application experiences a "Failed to fetch" error when users upload images in production (AWS Amplify), while working correctly in local development. This bugfix addresses five root causes: CORS misconfiguration, missing environment variables, Lambda timeout issues, authentication token handling, and generic error messages. The fix ensures the `/analyze` endpoint works reliably in production while preserving all existing functionality for local development and other API endpoints.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when image upload requests fail in production with "Failed to fetch" error
- **Property (P)**: The desired behavior - successful image upload and analysis in production environment
- **Preservation**: Existing local development functionality, metadata handling, DynamoDB operations, and other API endpoints that must remain unchanged
- **handleSubmit**: The function in `src/app/app/page.tsx` (line ~540-630) that handles form submission and image upload to the `/analyze` endpoint
- **AnalyzeFunction**: The Lambda function in `backend/src/analyze/` that processes image analysis requests via Bedrock
- **CORS**: Cross-Origin Resource Sharing configuration in API Gateway that controls which domains can access the API
- **Amplify Domain**: The production domain where the Next.js app is deployed (e.g., `https://main.d1234567890.amplifyapp.com`)

## Bug Details

### Bug Condition

The bug manifests when a user uploads an image through the handleSubmit function in the deployed AWS Amplify app. The fetch request to the `/analyze` endpoint fails with a "Failed to fetch" error, preventing image analysis. The root causes include CORS blocking the Amplify domain, missing environment variables, Lambda timeout for large images, authentication token issues, or generic error messages hiding the actual problem.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { environment: string, imageSize: number, hasEnvVars: boolean, corsConfig: string, authToken: string }
  OUTPUT: boolean
  
  RETURN (input.environment == 'production' AND input.corsConfig == '*' AND NOT allowsAmplifyDomain(input.corsConfig))
         OR (input.environment == 'production' AND input.hasEnvVars == false)
         OR (input.imageSize > 5MB AND lambdaTimeout <= 30)
         OR (input.authToken != '' AND NOT validTokenFormat(input.authToken))
         OR (fetchError == 'Failed to fetch' AND actualError is hidden)
END FUNCTION
```

### Examples

- **CORS Issue**: User uploads 2MB image from `https://main.d123.amplifyapp.com`, request blocked by CORS policy because AllowOrigin: '*' doesn't work with credentials, expected: request succeeds with proper origin header
- **Missing Env Vars**: User uploads image but NEXT_PUBLIC_API_URL is undefined in Amplify, fetch fails with "Failed to fetch", expected: environment variables are configured in Amplify Console
- **Lambda Timeout**: User uploads 8MB image, Lambda times out after 30 seconds during Bedrock invocation, expected: Lambda completes with 60-120 second timeout
- **Auth Token Issue**: User uploads image with malformed Authorization header, Cognito authorizer rejects request, expected: properly formatted Bearer token is accepted
- **Generic Error**: Network error occurs but user only sees "Failed to fetch", expected: specific error message like "CORS policy blocked request" or "Environment variable missing"

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Local development environment must continue to successfully upload images and receive diagnosis responses
- All metadata (symptoms, animal name, case ID) must continue to be included in FormData payload and processed correctly
- Lambda function must continue to save diagnosis records to DynamoDB (HistoryTable and UsageLogsTable)
- Frontend must continue to parse JSON results, update UI state, trigger text-to-speech, and save to local history
- Unauthenticated or expired token requests must continue to return 401 Unauthorized errors
- Video frame extraction must continue to process multiple frames and send to Bedrock model
- Other API endpoints (/history, /location) must continue to function without being affected by /analyze changes

**Scope:**
All inputs that do NOT involve production image uploads to the /analyze endpoint should be completely unaffected by this fix. This includes:
- Local development requests (localhost:3000)
- GET requests to /history endpoint
- POST requests to /location endpoint
- DELETE requests to /history endpoint
- Video uploads with frame extraction
- Requests with valid authentication in environments where CORS is already working

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **CORS Misconfiguration**: The SAM template uses `AllowOrigin: "'*'"` which doesn't work with credentialed requests (Authorization header)
   - API Gateway requires explicit origin when credentials are included
   - Amplify domain needs to be explicitly listed in AllowOrigin
   - AllowCredentials may need to be set to true

2. **Missing Environment Variables**: The Amplify Console may not have environment variables configured
   - NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USER_POOL_ID, NEXT_PUBLIC_USER_POOL_CLIENT_ID, NEXT_PUBLIC_AWS_REGION
   - These are required at build time for Next.js to embed them in the client bundle
   - Missing variables cause `process.env.NEXT_PUBLIC_API_URL` to be undefined, leading to fetch to invalid URL

3. **Lambda Timeout Insufficient**: The global timeout is 30 seconds, which may be too short for large images
   - Bedrock model invocation can take 20-40 seconds for large images
   - AnalyzeFunction needs override to 60-120 seconds
   - Memory may also need increase from 256MB to 512MB or 1024MB for better performance

4. **Authentication Token Format**: The Authorization header may not be properly formatted or validated
   - Token extraction from Amplify session may be incorrect (accessToken vs idToken)
   - Bearer token format may not match Cognito authorizer expectations
   - Token may be expired or invalid in production but not caught with specific error

5. **Generic Error Messages**: The catch block in handleSubmit only shows "Failed to fetch" without details
   - Network errors, CORS errors, and timeout errors all show same message
   - No logging or debugging information to identify root cause
   - Need better error handling to surface specific issues

## Correctness Properties

Property 1: Bug Condition - Production Image Upload Success

_For any_ image upload request in the production environment where the user is authenticated and the image is valid, the fixed system SHALL successfully send the request to API Gateway with proper CORS headers, complete the Lambda invocation within the timeout period, and return a diagnosis response without "Failed to fetch" errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Local Development and Other Endpoints

_For any_ request that is NOT a production image upload to /analyze (including local development requests, other API endpoints like /history and /location, and video uploads), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing functionality for metadata handling, DynamoDB operations, UI updates, and authentication error handling.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `backend/template.yaml`

**Section**: API Gateway CORS Configuration

**Specific Changes**:
1. **Replace Wildcard CORS with Explicit Origin**: Change `AllowOrigin: "'*'"` to use the actual Amplify domain
   - Add `AllowCredentials: true` to support Authorization header
   - Use CloudFormation parameter or environment variable for Amplify domain URL
   - Example: `AllowOrigin: !Sub "'https://${AmplifyDomain}'"` or `AllowOrigin: "'https://main.d1234567890.amplifyapp.com'"`

2. **Increase Lambda Timeout for AnalyzeFunction**: Override the global 30-second timeout
   - Add `Timeout: 120` to AnalyzeFunction properties
   - Add `MemorySize: 1024` to AnalyzeFunction properties for better performance
   - Keep other functions at default 30 seconds

3. **Add AllowCredentials to CORS**: Enable credentialed requests
   - Add `AllowCredentials: true` to the Cors configuration
   - This is required when using Authorization headers with explicit origins

**File**: `amplify.yml`

**Section**: Build Configuration

**Specific Changes**:
4. **Document Environment Variables Requirement**: Add comment or documentation
   - Note that NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USER_POOL_ID, NEXT_PUBLIC_USER_POOL_CLIENT_ID, NEXT_PUBLIC_AWS_REGION must be configured in Amplify Console
   - These are not in the YAML but must be set in the Amplify Console UI under "Environment variables"

**File**: `src/app/app/page.tsx`

**Function**: `handleSubmit`

**Specific Changes**:
5. **Improve Error Handling**: Replace generic catch block with specific error messages
   - Check if API_URL is undefined and show specific error
   - Catch and display CORS errors separately from network errors
   - Log full error details to console for debugging
   - Show user-friendly messages based on error type

6. **Validate Environment Variables**: Add runtime check for required environment variables
   - Check if NEXT_PUBLIC_API_URL is defined before making fetch request
   - Show clear error message if environment variables are missing
   - Provide guidance to check Amplify Console configuration

7. **Add Request Timeout Handling**: Implement client-side timeout for long requests
   - Use AbortController with 90-second timeout (less than Lambda's 120s)
   - Show progress indicator for long-running requests
   - Provide user feedback if request is taking longer than expected

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code in a production-like environment, then verify the fix works correctly and preserves existing behavior in both local and production environments.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Deploy the UNFIXED code to a test Amplify environment and attempt image uploads. Monitor browser console for CORS errors, check CloudWatch logs for Lambda timeouts, verify environment variables in Amplify Console. Document all failure modes observed.

**Test Cases**:
1. **CORS Failure Test**: Upload 2MB image from Amplify domain, observe CORS policy error in browser console (will fail on unfixed code)
2. **Missing Env Var Test**: Deploy without setting NEXT_PUBLIC_API_URL in Amplify Console, observe "Failed to fetch" with undefined URL (will fail on unfixed code)
3. **Lambda Timeout Test**: Upload 8MB image, observe Lambda timeout after 30 seconds in CloudWatch logs (will fail on unfixed code)
4. **Auth Token Test**: Upload image and inspect Authorization header format, verify Cognito authorizer accepts it (may fail on unfixed code)
5. **Generic Error Test**: Trigger network error and observe only "Failed to fetch" message without details (will fail on unfixed code)

**Expected Counterexamples**:
- Browser console shows "CORS policy: No 'Access-Control-Allow-Origin' header is present"
- Fetch fails with undefined URL when environment variables are missing
- CloudWatch logs show "Task timed out after 30.00 seconds" for AnalyzeFunction
- Cognito authorizer returns 401 with malformed token
- User sees generic "Failed to fetch" without knowing actual cause

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := uploadImage_fixed(input)
  ASSERT result.success == true
  ASSERT result.diagnosis != null
  ASSERT result.error == null OR result.error contains specific message
END FOR
```

**Test Cases**:
1. **Production Upload Success**: Deploy fixed code to Amplify, upload 2MB image, verify successful diagnosis response
2. **Large Image Success**: Upload 8MB image, verify Lambda completes within 120 seconds and returns diagnosis
3. **Environment Variables Present**: Verify all NEXT_PUBLIC_* variables are set in Amplify Console and accessible at runtime
4. **CORS Headers Valid**: Inspect network response headers, verify Access-Control-Allow-Origin matches Amplify domain
5. **Specific Error Messages**: Trigger various errors (network, timeout, auth), verify user sees specific error messages

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT uploadImage_original(input) = uploadImage_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Test the UNFIXED code in local development first to document expected behavior, then verify the FIXED code produces identical results in local development. Test all non-/analyze endpoints in both unfixed and fixed versions.

**Test Cases**:
1. **Local Development Preservation**: Run fixed code on localhost:3000, upload images, verify identical behavior to unfixed code
2. **Metadata Preservation**: Upload with symptoms, animal name, case ID, verify all metadata is included in FormData and processed
3. **DynamoDB Preservation**: Verify diagnosis records are saved to HistoryTable and UsageLogsTable with same structure
4. **UI State Preservation**: Verify JSON parsing, state updates, text-to-speech, and local history saving work identically
5. **Video Upload Preservation**: Upload video file, verify frame extraction and multi-frame processing works identically
6. **History Endpoint Preservation**: Call GET /history, verify response is identical in fixed version
7. **Location Endpoint Preservation**: Call POST /location, verify response is identical in fixed version
8. **Auth Error Preservation**: Send request with expired token, verify 401 Unauthorized response is identical

### Unit Tests

- Test CORS configuration with explicit origin and credentials enabled
- Test Lambda timeout configuration for AnalyzeFunction (120s) vs other functions (30s)
- Test environment variable validation in handleSubmit function
- Test error handling for different error types (CORS, network, timeout, auth)
- Test Authorization header format with Bearer token
- Test fetch request construction with proper headers and FormData

### Property-Based Tests

- Generate random image sizes (1KB to 10MB) and verify successful upload in production
- Generate random metadata combinations (symptoms, animal name, case ID) and verify preservation
- Generate random authentication states (valid token, expired token, no token) and verify proper error handling
- Generate random network conditions (slow connection, timeout, disconnect) and verify appropriate error messages
- Test across multiple Amplify domains (main branch, feature branches) and verify CORS works for all

### Integration Tests

- Test full flow: login → upload image → receive diagnosis → save to history in production environment
- Test switching between local development and production environments
- Test video upload with frame extraction in production
- Test concurrent uploads from multiple users to verify Lambda scaling and timeout handling
- Test error recovery: trigger error → fix issue → retry upload successfully
- Test all API endpoints (/analyze, /history, /location) in production after fix
- Test browser compatibility (Chrome, Safari, Firefox) for CORS and fetch behavior
