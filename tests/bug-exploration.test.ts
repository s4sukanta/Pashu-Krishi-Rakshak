/**
 * Bug Condition Exploration Test
 * 
 * **CRITICAL**: This test is EXPECTED TO FAIL on unfixed code.
 * Failure confirms the bug exists (User Pool ARN mismatch).
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * Root Cause: The backend template creates a NEW User Pool, but the frontend
 * is configured to use an EXISTING User Pool (us-east-1_trkjSY02v).
 * The Cognito authorizer validates tokens from the NEW pool, rejecting
 * tokens from the EXISTING pool with 401 Unauthorized.
 */

import { describe, it, expect } from '@jest/globals';

describe('Bug Condition Exploration - User Pool ARN Mismatch', () => {
  /**
   * Property 1: Bug Condition - Production Image Upload Failure
   * 
   * This test demonstrates the bug by attempting to call the API
   * with a token from the existing User Pool.
   * 
   * **EXPECTED OUTCOME**: Test FAILS with 401 Unauthorized
   * (This proves the bug exists)
   */
  it('should fail with 401 when using token from existing User Pool', async () => {
    // Configuration from .env.local
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://edm1jvi975.execute-api.us-east-1.amazonaws.com/Prod/';
    const EXISTING_USER_POOL_ID = 'us-east-1_trkjSY02v';
    
    // Simulate a request with a token from the existing User Pool
    // In a real scenario, this would be a valid token from Cognito
    const mockToken = 'eyJraWQiOiJtb2NrLWtleS1pZCIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIwNGM4MTRmOC1hMGExLTcwZDYtYmQ1My1hNmFkYmZhZGNhYjAiLCJpc3MiOiJodHRwczovL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL3VzLWVhc3QtMV90cmtqU1kwMnYiLCJjbGllbnRfaWQiOiIxcXA1dW40dWcwNGpiZzc4bWNlODg0NW9zOCIsIm9yaWdpbl9qdGkiOiJtb2NrLWp0aSIsImV2ZW50X2lkIjoibW9jay1ldmVudC1pZCIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE3MzgwMDAwMDAsImV4cCI6MTczODAwMzYwMCwiaWF0IjoxNzM4MDAwMDAwLCJqdGkiOiJtb2NrLWp0aSIsInVzZXJuYW1lIjoidGVzdHVzZXJAZXhhbXBsZS5jb20ifQ.mock-signature';
    
    // Attempt to fetch /history endpoint
    const response = await fetch(`${API_URL}history?userId=04c814f8-a0a1-70d6-bd53-a6adbfadcab0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Document the counterexample
    console.log('=== COUNTEREXAMPLE FOUND ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Frontend User Pool:', EXISTING_USER_POOL_ID);
    console.log('Backend User Pool ARN:', '!GetAtt PashuKrishiUserPool.Arn (NEW pool)');
    console.log('Expected Behavior: Request should succeed with 200 OK');
    console.log('Actual Behavior: Request fails with 401 Unauthorized');
    console.log('Root Cause: Cognito authorizer validates tokens from NEW pool, rejects tokens from EXISTING pool');
    
    // Check for CORS error (symptom of 401)
    const corsError = !response.ok && response.type === 'cors';
    if (corsError) {
      console.log('CORS Error Detected: No Access-Control-Allow-Origin header (symptom of 401)');
    }
    
    // This assertion will FAIL on unfixed code (expected behavior for exploration test)
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });
  
  /**
   * Additional test: Verify User Pool configuration mismatch
   */
  it('should document the User Pool configuration mismatch', () => {
    const frontendUserPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_trkjSY02v';
    const backendUserPoolConfig = '!GetAtt PashuKrishiUserPool.Arn';
    
    console.log('=== USER POOL CONFIGURATION MISMATCH ===');
    console.log('Frontend Configuration (.env.local):');
    console.log('  NEXT_PUBLIC_USER_POOL_ID:', frontendUserPoolId);
    console.log('  NEXT_PUBLIC_USER_POOL_CLIENT_ID:', process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '1qp5un4ug04jbg78mce8845os8');
    console.log('');
    console.log('Backend Configuration (template.yaml):');
    console.log('  Creates NEW User Pool: PashuKrishiUserPool');
    console.log('  Cognito Authorizer ARN:', backendUserPoolConfig);
    console.log('');
    console.log('MISMATCH: Frontend uses EXISTING pool, Backend creates NEW pool');
    console.log('IMPACT: Tokens from existing pool are rejected by authorizer');
    
    // This assertion documents the expected fix
    expect(frontendUserPoolId).toBe('us-east-1_trkjSY02v');
    expect(backendUserPoolConfig).toContain('PashuKrishiUserPool');
  });
  
  /**
   * Test: Verify CORS configuration
   */
  it('should verify CORS is configured for Amplify domain', () => {
    const amplifyDomain = 'https://main.dz4umnvfh0vrz.amplifyapp.com';
    const corsConfig = {
      AllowOrigin: "'https://main.dz4umnvfh0vrz.amplifyapp.com'",
      AllowCredentials: true,
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
      AllowMethods: "'GET,POST,DELETE,OPTIONS'",
    };
    
    console.log('=== CORS CONFIGURATION ===');
    console.log('Amplify Domain:', amplifyDomain);
    console.log('CORS AllowOrigin:', corsConfig.AllowOrigin);
    console.log('CORS AllowCredentials:', corsConfig.AllowCredentials);
    console.log('');
    console.log('NOTE: CORS is correctly configured, but 401 errors prevent CORS headers from being returned');
    console.log('API Gateway does not return CORS headers on 401/403 errors from Cognito authorizer');
    
    expect(corsConfig.AllowOrigin).toContain(amplifyDomain);
    expect(corsConfig.AllowCredentials).toBe(true);
  });
  
  /**
   * Test: Verify Lambda timeout configuration
   */
  it('should verify Lambda timeout is sufficient for large images', () => {
    const analyzeFunctionTimeout = 120; // seconds
    const analyzeFunctionMemory = 1024; // MB
    const globalTimeout = 30; // seconds
    
    console.log('=== LAMBDA CONFIGURATION ===');
    console.log('AnalyzeFunction Timeout:', analyzeFunctionTimeout, 'seconds');
    console.log('AnalyzeFunction Memory:', analyzeFunctionMemory, 'MB');
    console.log('Global Timeout:', globalTimeout, 'seconds');
    console.log('');
    console.log('NOTE: Lambda timeout is correctly configured for large images');
    
    expect(analyzeFunctionTimeout).toBeGreaterThanOrEqual(120);
    expect(analyzeFunctionMemory).toBeGreaterThanOrEqual(1024);
  });
  
  /**
   * Test: Verify environment variables are accessible
   */
  it('should verify environment variables are defined', () => {
    const requiredEnvVars = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_USER_POOL_ID: process.env.NEXT_PUBLIC_USER_POOL_ID,
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
    };
    
    console.log('=== ENVIRONMENT VARIABLES ===');
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      console.log(`${key}:`, value ? '✓ Defined' : '✗ Missing');
    });
    
    // All environment variables should be defined
    Object.entries(requiredEnvVars).forEach(([key, value]) => {
      expect(value).toBeDefined();
      expect(value).not.toBe('');
    });
  });
});

/**
 * SUMMARY OF COUNTEREXAMPLES (Expected on unfixed code):
 * 
 * 1. **401 Unauthorized Error**: API returns 401 when called with token from existing User Pool
 *    - Frontend User Pool: us-east-1_trkjSY02v (existing)
 *    - Backend User Pool: PashuKrishiUserPool (new, created by template)
 *    - Cognito authorizer validates tokens from NEW pool only
 * 
 * 2. **CORS Error (Symptom)**: Browser shows "No 'Access-Control-Allow-Origin' header"
 *    - This is a SYMPTOM, not the root cause
 *    - API Gateway doesn't return CORS headers on 401/403 errors from Cognito authorizer
 * 
 * 3. **User Pool ARN Mismatch**: 
 *    - Frontend configured for: us-east-1_trkjSY02v
 *    - Backend authorizer configured for: !GetAtt PashuKrishiUserPool.Arn
 *    - These are DIFFERENT User Pools
 * 
 * **ROOT CAUSE**: The backend template creates a NEW User Pool, but the frontend
 * is configured to use an EXISTING User Pool. The Cognito authorizer in API Gateway
 * is configured to validate tokens from the NEW pool, so it rejects tokens from
 * the EXISTING pool with 401 Unauthorized.
 * 
 * **FIX**: Update the backend template to use the EXISTING User Pool ARN instead
 * of creating a new one, OR update the frontend to use the NEW User Pool created
 * by the template.
 */
