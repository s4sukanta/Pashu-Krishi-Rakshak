# Bugfix Requirements Document

## Introduction

The application experiences a "Failed to fetch" error when users upload images in the production environment (AWS Amplify deployment), while the same functionality works correctly in the local development environment. This bug prevents users from analyzing animal health images through the `/analyze` endpoint, rendering the core functionality unusable in production. The issue manifests specifically during the POST request to the API Gateway endpoint when submitting image data with authentication tokens.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user uploads an image through the handleSubmit function in the deployed AWS Amplify app THEN the system returns a "Failed to fetch" error and the analysis request fails

1.2 WHEN the frontend makes a POST request to the `/analyze` endpoint with multipart/form-data from the Amplify domain THEN the request is blocked or fails due to CORS misconfiguration (AllowOrigin: '*' not working as expected in production)

1.3 WHEN the application attempts to use environment variables (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USER_POOL_ID, etc.) in the Amplify deployment THEN the variables may be undefined or missing, causing API calls to fail

1.4 WHEN the Lambda function receives a request with a large image payload THEN the function may timeout after 30 seconds before completing the Bedrock model invocation

1.5 WHEN the frontend sends an Authorization header with a JWT token to API Gateway THEN the Cognito authorizer may reject the token or the header may not be properly formatted for the production environment

### Expected Behavior (Correct)

2.1 WHEN a user uploads an image through the handleSubmit function in the deployed AWS Amplify app THEN the system SHALL successfully send the request to the API Gateway and receive a diagnosis response without "Failed to fetch" errors

2.2 WHEN the frontend makes a POST request to the `/analyze` endpoint with multipart/form-data from the Amplify domain THEN the API Gateway SHALL accept the request with proper CORS headers configured for the specific Amplify domain origin

2.3 WHEN the application attempts to use environment variables in the Amplify deployment THEN all required environment variables (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_USER_POOL_ID, NEXT_PUBLIC_USER_POOL_CLIENT_ID, NEXT_PUBLIC_AWS_REGION) SHALL be properly configured in the Amplify Console and accessible to the application

2.4 WHEN the Lambda function receives a request with a large image payload THEN the function SHALL have sufficient timeout duration (60-120 seconds) and memory allocation to complete the Bedrock model invocation and return results

2.5 WHEN the frontend sends an Authorization header with a JWT token to API Gateway THEN the Cognito authorizer SHALL validate the token correctly and allow authenticated requests to proceed to the Lambda function

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the application runs in the local development environment THEN the system SHALL CONTINUE TO successfully upload images and receive diagnosis responses as it currently does

3.2 WHEN a user uploads an image with valid symptoms, animal name, and case ID metadata THEN the system SHALL CONTINUE TO include all metadata in the FormData payload and process it correctly

3.3 WHEN the Lambda function successfully processes a request THEN the system SHALL CONTINUE TO save diagnosis records to DynamoDB (HistoryTable and UsageLogsTable) as it currently does

3.4 WHEN the API returns a successful response with diagnosis data THEN the frontend SHALL CONTINUE TO parse the JSON result, update the UI state, trigger text-to-speech, and save to local history as it currently does

3.5 WHEN a user is not authenticated or has an expired token THEN the system SHALL CONTINUE TO return appropriate 401 Unauthorized errors rather than generic "Failed to fetch" messages

3.6 WHEN the Lambda function extracts video frames (for video uploads) THEN the system SHALL CONTINUE TO process multiple frames and send them to the Bedrock model as it currently does

3.7 WHEN other API endpoints (/history, /location) are called THEN the system SHALL CONTINUE TO function correctly without being affected by changes to the /analyze endpoint configuration
