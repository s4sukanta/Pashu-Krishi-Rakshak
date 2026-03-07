# Implementation Plan

## Phase 1: Exploratory Bug Condition Checking (BEFORE Fix)

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Production Image Upload Failure
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists in production environment
  - **Scoped PBT Approach**: Scope the property to concrete failing cases in production-like environment
  - Deploy UNFIXED code to test Amplify environment
  - Test that image upload from Amplify domain succeeds with proper CORS headers (from Bug Condition: environment == 'production' AND corsConfig == '*')
  - Test that large images (>5MB) complete within Lambda timeout (from Bug Condition: imageSize > 5MB AND lambdaTimeout <= 30)
  - Test that environment variables are accessible (from Bug Condition: hasEnvVars == false)
  - Test that Authorization header is properly formatted (from Bug Condition: authToken != '' AND NOT validTokenFormat)
  - Test that specific error messages are shown instead of generic "Failed to fetch" (from Bug Condition: fetchError == 'Failed to fetch' AND actualError is hidden)
  - Run test on UNFIXED code in production-like environment
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - CORS policy errors in browser console
    - Lambda timeout errors in CloudWatch logs
    - Undefined environment variables
    - Malformed Authorization headers
    - Generic error messages hiding actual issues
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

## Phase 2: Preservation Property Tests (BEFORE Fix)

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Local Development and Other Endpoints
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (local development, other endpoints)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - Local development image uploads succeed (localhost:3000)
    - Metadata (symptoms, animal name, case ID) is included in FormData and processed
    - DynamoDB records are saved to HistoryTable and UsageLogsTable
    - Frontend parses JSON, updates UI state, triggers text-to-speech, saves to local history
    - Unauthenticated requests return 401 Unauthorized errors
    - Video frame extraction processes multiple frames
    - Other API endpoints (/history, /location) function correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code in local development environment
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Phase 3: Implementation

- [ ] 3. Fix for "Failed to fetch" error in production image uploads

  - [x] 3.1 Update CORS configuration in backend/template.yaml
    - Replace `AllowOrigin: "'*'"` with explicit Amplify domain origin
    - Add `AllowCredentials: true` to support Authorization header
    - Use CloudFormation parameter or hardcode Amplify domain URL
    - Example: `AllowOrigin: "'https://main.d1234567890.amplifyapp.com'"`
    - _Bug_Condition: (environment == 'production' AND corsConfig == '*' AND NOT allowsAmplifyDomain)_
    - _Expected_Behavior: Request succeeds with proper CORS headers for Amplify domain_
    - _Preservation: Local development requests continue to work_
    - _Requirements: 1.2, 2.2_

  - [x] 3.2 Increase Lambda timeout and memory for AnalyzeFunction
    - Add `Timeout: 120` to AnalyzeFunction properties in backend/template.yaml
    - Add `MemorySize: 1024` to AnalyzeFunction properties
    - Keep other Lambda functions at default 30-second timeout
    - _Bug_Condition: (imageSize > 5MB AND lambdaTimeout <= 30)_
    - _Expected_Behavior: Lambda completes within 120 seconds for large images_
    - _Preservation: Other Lambda functions maintain default timeout_
    - _Requirements: 1.4, 2.4_

  - [x] 3.3 Improve error handling in src/app/app/page.tsx handleSubmit function
    - Add runtime check for NEXT_PUBLIC_API_URL before fetch request
    - Show specific error message if environment variables are missing
    - Catch and display CORS errors separately from network errors
    - Log full error details to console for debugging
    - Implement client-side timeout with AbortController (90 seconds)
    - Show progress indicator for long-running requests
    - _Bug_Condition: (hasEnvVars == false) OR (fetchError == 'Failed to fetch' AND actualError is hidden)_
    - _Expected_Behavior: Specific error messages guide user to root cause_
    - _Preservation: Existing error handling for 401 Unauthorized preserved_
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 2.3, 2.5_

  - [x] 3.4 Document environment variable requirements
    - Add comment in amplify.yml about required environment variables
    - Document that NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USER_POOL_ID, NEXT_PUBLIC_USER_POOL_CLIENT_ID, NEXT_PUBLIC_AWS_REGION must be set in Amplify Console
    - Create or update documentation file with Amplify Console configuration steps
    - _Bug_Condition: (hasEnvVars == false)_
    - _Expected_Behavior: Clear documentation guides deployment configuration_
    - _Preservation: No code changes, documentation only_
    - _Requirements: 1.3, 2.3_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Production Image Upload Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Deploy FIXED code to test Amplify environment
    - Run bug condition exploration test from step 1
    - Verify CORS headers allow Amplify domain with credentials
    - Verify large images complete within 120-second timeout
    - Verify environment variables are accessible
    - Verify specific error messages are shown
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Local Development and Other Endpoints
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify local development image uploads still work
    - Verify metadata handling is unchanged
    - Verify DynamoDB operations are unchanged
    - Verify UI state updates are unchanged
    - Verify video frame extraction is unchanged
    - Verify other API endpoints (/history, /location) are unchanged
    - Verify 401 Unauthorized errors are unchanged
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Phase 4: Validation

- [ ] 4. Checkpoint - Ensure all tests pass
  - Verify bug condition test passes in production environment
  - Verify preservation tests pass in local development
  - Test full flow: login → upload image → receive diagnosis → save to history
  - Test with various image sizes (1KB to 10MB)
  - Test with different metadata combinations
  - Test error scenarios (network issues, expired tokens)
  - Test browser compatibility (Chrome, Safari, Firefox)
  - Monitor CloudWatch logs for Lambda execution times
  - Verify CORS headers in browser network inspector
  - Ensure all tests pass, ask the user if questions arise

## Additional Testing Tasks

- [ ] 5. Unit tests for CORS configuration
  - Test explicit origin matches Amplify domain
  - Test AllowCredentials is set to true
  - Test AllowHeaders includes Authorization
  - Test AllowMethods includes POST
  - _Requirements: 2.2_

- [ ] 6. Unit tests for Lambda timeout configuration
  - Test AnalyzeFunction has 120-second timeout
  - Test AnalyzeFunction has 1024MB memory
  - Test other functions maintain 30-second timeout
  - _Requirements: 2.4_

- [ ] 7. Unit tests for error handling improvements
  - Test environment variable validation shows specific error
  - Test CORS error shows specific message
  - Test network error shows specific message
  - Test timeout error shows specific message
  - Test AbortController cancels request after 90 seconds
  - _Requirements: 2.1, 2.3, 2.5_

- [ ] 8. Integration tests for production deployment
  - Test image upload from actual Amplify domain
  - Test concurrent uploads from multiple users
  - Test video upload with frame extraction
  - Test all API endpoints after deployment
  - Test error recovery and retry scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 9. Property-based tests for edge cases
  - Generate random image sizes and verify success
  - Generate random metadata combinations and verify preservation
  - Generate random authentication states and verify error handling
  - Generate random network conditions and verify error messages
  - Test across multiple Amplify domains (branches)
  - _Requirements: All requirements_
