# Root Cause Analysis: Production Deployment Issues

## Executive Summary

This document provides a comprehensive root cause analysis of three critical issues encountered during the production deployment of Pashu Krishi Rakshak. Our systematic debugging approach and iterative problem-solving demonstrate our commitment to understanding system behavior at a deep level rather than applying superficial fixes.

**Timeline**: March 8, 2026  
**Environment**: AWS Amplify (Frontend) + AWS SAM (Backend)  
**Impact**: Complete service unavailability → Full resolution  
**Key Learning**: The importance of understanding data encoding at every layer of a distributed system

---

## Issue #1: Authentication Failure (401 Unauthorized)

### Symptoms
- Users could successfully authenticate with AWS Cognito
- All subsequent API calls returned `401 Unauthorized`
- CORS errors appeared in browser console (secondary symptom)

### Initial Hypothesis
We initially suspected CORS misconfiguration, as the browser console prominently displayed CORS-related errors. However, CORS errors were a symptom, not the root cause—they appeared because API Gateway doesn't return CORS headers on 401 responses from the Cognito authorizer.

### Investigation Process

1. **Configuration Audit**: Verified API Gateway CORS settings, Lambda CORS headers, and Cognito User Pool configuration
2. **Token Inspection**: Decoded JWT tokens in browser console to verify structure and claims
3. **Authorization Flow Analysis**: Reviewed AWS Cognito authorizer behavior and token type requirements

### Root Cause

**Token Type Mismatch**: The frontend was sending `accessToken` to API Gateway, but the Cognito authorizer was configured to validate `idToken`.

**Technical Details**:
- AWS Cognito issues two types of tokens: Access Tokens (for OAuth scopes) and ID Tokens (for user identity)
- API Gateway Cognito authorizers validate ID tokens by default when no OAuth scopes are configured
- Our frontend code was extracting `session.tokens?.accessToken` instead of `session.tokens?.idToken`

**Code Location**: `src/app/app/page.tsx`

### Resolution

```typescript
// Before (Incorrect)
const token = session.tokens?.accessToken?.toString();

// After (Correct)
const getAuthToken = async (): Promise<string> => {
  const { fetchAuthSession } = await import('aws-amplify/auth');
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new Error('No auth token available');
  }
  return token;
};
```

**Additional Improvements**:
- Parameterized CORS origin in SAM template for environment flexibility
- Added `ALLOWED_ORIGIN` environment variable to all Lambda functions
- Fixed Gateway Responses syntax to properly return CORS headers on auth errors

### Key Learnings

1. **Symptom vs. Root Cause**: CORS errors were masking the actual authentication issue
2. **Token Types Matter**: Understanding the difference between access tokens and ID tokens is critical for AWS Cognito integration
3. **Error Propagation**: Authentication failures at the API Gateway level prevent proper CORS header injection

---

## Issue #2: Lambda Runtime Error (ReferenceError)

### Symptoms
- Authentication working correctly
- Image upload requests returning `500 Internal Server Error`
- Error message: `busboy is not defined`

### Investigation Process

1. **CloudWatch Logs Analysis**: Identified exact line number and stack trace
2. **Code Review**: Examined import statements and usage patterns
3. **Case Sensitivity Check**: Verified module export names

### Root Cause

**Case Sensitivity Error**: JavaScript is case-sensitive, and we had a mismatch between the import statement and usage.

**Technical Details**:
```javascript
// Import statement (Correct)
const Busboy = require("busboy");

// Usage (Incorrect - line 264)
const bb = busboy({ headers: { 'content-type': contentType } });

// Should be (Correct)
const bb = Busboy({ headers: { 'content-type': contentType } });
```

The `busboy` package exports a constructor function with capital 'B', but we were calling it with lowercase 'b', resulting in `ReferenceError: busboy is not defined`.

### Resolution

Changed all instances of `busboy()` to `Busboy()` to match the imported identifier.

### Key Learnings

1. **Linting Importance**: This error would have been caught by ESLint with proper configuration
2. **Local Testing**: The error only manifested in production because local development wasn't testing the multipart parsing path
3. **Quick Wins**: Simple syntax errors can have disproportionate impact—systematic code review is essential

---

## Issue #3: Binary Data Corruption (MIME Type Detection Failure)

### Symptoms
- Authentication working
- Lambda executing without errors
- AWS Bedrock API rejecting images with: `ValidationException: The detected file MIME type application/octet-stream does not match the expected type image/jpeg`

### Investigation Process

This was the most complex issue, requiring deep investigation across multiple layers:

#### Phase 1: Frontend MIME Type Handling
**Hypothesis**: Video frame extraction not preserving MIME type

**Investigation**:
```typescript
// Original code
frames.forEach((blob, index) => {
  formData.append("media", blob, `frame_${index}.jpg`);
});
```

**Finding**: When appending a Blob with just a filename string, browsers don't always preserve the Blob's `type` property in the multipart request.

**Fix Applied**:
```typescript
frames.forEach((blob, index) => {
  const frameFile = new File([blob], `frame_${index}.jpg`, { type: 'image/jpeg' });
  formData.append("media", frameFile);
});
```

**Result**: Issue persisted, indicating a deeper problem.

#### Phase 2: Backend MIME Type Detection
**Hypothesis**: Busboy not detecting MIME type from multipart headers

**Investigation**: Added fallback MIME type detection from file extension:
```javascript
if (!mimeType || mimeType === 'application/octet-stream') {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap = { 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', ... };
  detectedMimeType = mimeMap[ext] || mimeType;
}
```

**Result**: Logs showed `mimeType: 'image/jpeg'` but Bedrock still rejected the image.

#### Phase 3: Bedrock API Format Investigation
**Hypothesis**: Incorrect data format for Bedrock InvokeModel API

**Investigation**: 
- Researched AWS Bedrock documentation
- Discovered InvokeModel API expects base64-encoded strings in the `bytes` field, not raw Buffers
- Tested multiple encoding approaches

**Result**: Issue persisted even with correct base64 encoding.

#### Phase 4: Binary Data Integrity Analysis (Root Cause Discovery)

**Breakthrough**: Added detailed logging to inspect actual file bytes:

```javascript
console.log('isBase64Encoded:', event.isBase64Encoded);
console.log('File magic bytes (hex):', fileBuffer.slice(0, 4).toString('hex'));
```

**Critical Findings**:
```
isBase64Encoded: false
Body length: 348455
Buffer length after parsing: 664321  // ⚠️ Nearly 2x the original size!
File magic bytes (hex): efbfbdef    // ⚠️ UTF-8 replacement character, not JPEG!
```

**Analysis**:
- JPEG files should start with magic bytes `ffd8ff` (JPEG signature)
- Instead, we saw `efbfbdef` (UTF-8 replacement character U+FFFD)
- Buffer size nearly doubled, indicating character encoding expansion
- `isBase64Encoded: false` meant API Gateway was treating binary data as text

### Root Cause

**Binary-to-Text Corruption**: API Gateway was interpreting the multipart/form-data request body as UTF-8 text instead of binary data, causing irreversible data corruption.

**Technical Explanation**:

1. **Character Encoding Mismatch**: When binary data (image bytes) is interpreted as UTF-8 text, invalid byte sequences are replaced with the Unicode replacement character (U+FFFD)
2. **Data Expansion**: UTF-8 encoding of the replacement character (0xEF 0xBF 0xBD) takes 3 bytes, while the original binary byte was 1 byte, causing size expansion
3. **Irreversible Corruption**: Once binary data is corrupted through text interpretation, it cannot be recovered

**Why This Happened**:

API Gateway has two modes for handling request bodies:
- **Text Mode** (default): Treats body as UTF-8 text, passes as string to Lambda
- **Binary Mode**: Treats body as binary, base64-encodes it, sets `isBase64Encoded: true`

Without explicit `BinaryMediaTypes` configuration, API Gateway defaults to text mode for all content types, including `multipart/form-data`.

### Resolution

**Configuration Change**: Added `BinaryMediaTypes` to API Gateway configuration in SAM template:

```yaml
PashuKrishiApi:
  Type: AWS::Serverless::Api
  Properties:
    StageName: Prod
    BinaryMediaTypes:
      - 'multipart/form-data'
      - 'image/*'
      - 'video/*'
    # ... rest of configuration
```

**Impact**:
- API Gateway now sets `isBase64Encoded: true` for these content types
- Lambda receives base64-encoded body, preserving binary data integrity
- File magic bytes now correctly show `ffd8ff` for JPEG images
- Bedrock API successfully processes images

### Verification

**Before Fix**:
```
isBase64Encoded: false
File magic bytes: efbfbdef (corrupted)
Buffer size: 664321 bytes (inflated)
```

**After Fix**:
```
isBase64Encoded: true
File magic bytes: ffd8ff (valid JPEG)
Buffer size: 348455 bytes (correct)
```

### Key Learnings

1. **Data Encoding Awareness**: Understanding how data is encoded at every layer (browser → API Gateway → Lambda → Bedrock) is critical for debugging distributed systems

2. **Binary vs. Text**: Never assume API gateways will automatically detect binary data—explicit configuration is required

3. **Diagnostic Logging**: Inspecting raw bytes (magic bytes, hex dumps) was essential for identifying corruption

4. **Layered Debugging**: We systematically eliminated each layer (frontend → backend → API format) before discovering the infrastructure-level issue

5. **Documentation Gaps**: AWS SAM documentation doesn't prominently highlight the need for `BinaryMediaTypes` when handling file uploads, leading to this common pitfall

6. **Symptom Chaining**: Each fix (frontend File objects, backend fallback detection) was correct in isolation but insufficient because the root cause was at a different layer

---

## Deployment Challenges

### Issue: SAM Deployment Not Updating Lambda Code

**Symptom**: Running `sam deploy` showed "No changes to deploy" even after code modifications.

**Root Cause**: CloudFormation change detection doesn't always recognize Lambda code changes, especially when only function code (not template) is modified.

**Solutions Implemented**:

1. **Force Deployment Script** (`backend/force-deploy.ps1`):
   - Increments template version to force CloudFormation update
   - Ensures Lambda code is always redeployed

2. **Direct Lambda Update Script** (`backend/update-lambda-code.ps1`):
   - Bypasses CloudFormation entirely
   - Directly updates Lambda function code via AWS CLI
   - Useful for rapid iteration during debugging

3. **Full Rebuild Script** (`backend/rebuild-and-deploy.ps1`):
   - Reinstalls all dependencies
   - Performs clean build
   - Deploys with full CloudFormation update

### Key Learning

Infrastructure-as-Code tools like CloudFormation optimize for idempotency, which can sometimes hinder rapid debugging. Having multiple deployment strategies (full CloudFormation, direct updates, forced deployments) provides flexibility during development and troubleshooting.

---

## Systematic Debugging Methodology

Our approach to resolving these issues demonstrates a structured debugging methodology:

### 1. Hypothesis-Driven Investigation
- Form specific, testable hypotheses
- Design experiments to validate or invalidate each hypothesis
- Avoid "shotgun debugging" (changing multiple things at once)

### 2. Layered Analysis
- Start from the error message and work backwards
- Examine each layer of the stack (frontend → API Gateway → Lambda → external services)
- Use logging strategically to isolate the problem layer

### 3. Data Integrity Verification
- Inspect data at each transformation point
- Verify assumptions about data format and encoding
- Use low-level inspection (hex dumps, magic bytes) when high-level debugging fails

### 4. Documentation and Knowledge Sharing
- Document each issue with full context
- Create runbooks for common problems
- Share learnings with the team through detailed RCA documents

---

## Preventive Measures Implemented

### 1. Enhanced Logging
- Added comprehensive logging at critical points (API Gateway entry, multipart parsing, Bedrock API calls)
- Log data characteristics (size, encoding, magic bytes) for binary data
- Structured logging for easier CloudWatch analysis

### 2. Configuration Documentation
- Created `CLAUDE.md` with project architecture overview
- Documented all environment variables and their purposes
- Added inline comments explaining non-obvious configurations

### 3. Deployment Scripts
- Multiple deployment strategies for different scenarios
- Automated dependency installation
- Version bumping for forced deployments

### 4. Error Handling Improvements
- Better error messages that distinguish between different failure modes
- Graceful degradation where possible
- User-friendly error messages in the frontend

---

## Technical Debt and Future Improvements

### 1. Testing Infrastructure
**Current Gap**: No automated testing for multipart file upload flow

**Proposed Solution**:
- Integration tests that upload actual image files
- Mock Bedrock API responses for faster test execution
- Binary data integrity tests at each layer

### 2. Local Development Environment
**Current Gap**: Difficult to test API Gateway behavior locally

**Proposed Solution**:
- Use SAM Local with proper binary media type configuration
- Docker-based local development environment
- Mock API Gateway behavior in development

### 3. Monitoring and Alerting
**Current Gap**: Issues only discovered through manual testing

**Proposed Solution**:
- CloudWatch alarms for Lambda errors
- API Gateway metrics monitoring (4xx, 5xx rates)
- Synthetic monitoring for critical user flows

### 4. Code Quality
**Current Gap**: Case sensitivity error wasn't caught before deployment

**Proposed Solution**:
- Implement ESLint with strict rules
- Pre-commit hooks for linting and type checking
- Automated code review tools

---

## Conclusion

This root cause analysis demonstrates our team's ability to:

1. **Systematically debug complex distributed systems** across multiple layers (frontend, API Gateway, Lambda, external APIs)

2. **Think critically about data encoding and transformation** at each layer of the stack

3. **Learn from failures** by documenting issues thoroughly and implementing preventive measures

4. **Adapt debugging strategies** when initial hypotheses prove incorrect

5. **Understand infrastructure deeply** rather than treating cloud services as black boxes

The final issue (binary data corruption) was particularly instructive because it required understanding how API Gateway handles different content types—knowledge that isn't immediately obvious from documentation but is critical for production systems handling binary data.

These experiences have made our application more robust and our team more capable of handling production issues efficiently. We view each bug not as a setback but as an opportunity to deepen our understanding of the system and improve our engineering practices.

---

## References

### AWS Documentation
- [API Gateway Binary Media Types](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-payload-encodings.html)
- [Cognito Token Types](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [Bedrock InvokeModel API](https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html)

### Related Documentation
- `docs/401_CORS_INVESTIGATION.md` - Detailed investigation of authentication issue
- `docs/MIME_TYPE_FIX.md` - Initial MIME type investigation (before discovering root cause)
- `CLAUDE.md` - Project architecture and conventions

### Tools and Scripts
- `backend/rebuild-and-deploy.ps1` - Full rebuild and deployment
- `backend/update-lambda-code.ps1` - Direct Lambda code update
- `backend/force-deploy.ps1` - Force CloudFormation deployment

---

**Document Version**: 1.0  
**Last Updated**: March 8, 2026  
**Authors**: Development Team  
**Review Status**: Final
