# Fresh Deployment Guide - Creating New User Pool

## Situation

The User Pool `us-east-1_trkjSY02v` referenced in the frontend configuration doesn't exist in AWS Cognito. We need to create a fresh User Pool and update the frontend configuration.

## Deployment Steps

### Step 1: Deploy Backend (Creates New User Pool)

```bash
cd backend
sam build
sam deploy
```

This will create:
- New Cognito User Pool
- New User Pool Client
- API Gateway with Cognito authorizer
- Lambda functions
- DynamoDB tables

### Step 2: Get the New Credentials

After deployment completes, get the outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name pashu-krishi-rakshak-app \
  --query "Stacks[0].Outputs" \
  --region us-east-1
```

Or check in AWS Console:
- CloudFormation → Stacks → `pashu-krishi-rakshak-app` → Outputs tab

You'll see:
- `ApiUrl`: API Gateway endpoint
- `UserPoolId`: New Cognito User Pool ID
- `UserPoolClientId`: New App Client ID

### Step 3: Update Frontend Configuration

Update `.env.local` with the new values:

```bash
NEXT_PUBLIC_API_URL=<ApiUrl from outputs>
NEXT_PUBLIC_USER_POOL_ID=<UserPoolId from outputs>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<UserPoolClientId from outputs>
NEXT_PUBLIC_AWS_REGION=us-east-1
```

### Step 4: Update Amplify Console Environment Variables

1. Go to: https://console.aws.amazon.com/amplify/
2. Select your app: `dz4umnvfh0vrz`
3. Go to "Environment variables" (left sidebar)
4. Update these variables with the new values from Step 2:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_USER_POOL_ID`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID`
   - `NEXT_PUBLIC_AWS_REGION` (should be `us-east-1`)
5. Save changes

### Step 5: Redeploy Frontend

The frontend will auto-redeploy when you push to GitHub, or you can trigger a manual redeploy in Amplify Console.

### Step 6: Create Your First User

Since this is a fresh User Pool, you'll need to register a new user:

1. Go to your deployed app: `https://main.dz4umnvfh0vrz.amplifyapp.com`
2. Click "Register" or "Sign Up"
3. Enter email and password
4. Verify your email (check inbox for verification code)
5. Login with your new credentials

## What Changed

### Before (Incorrect Configuration)
- Frontend referenced non-existent User Pool: `us-east-1_trkjSY02v`
- Backend was trying to create a new pool but frontend wasn't using it
- Result: 401 Unauthorized errors

### After (Correct Configuration)
- Backend creates a NEW User Pool
- Frontend is configured to use the NEW User Pool
- API Gateway authorizer validates tokens from the NEW User Pool
- Result: Authentication works correctly

## Verification Checklist

After deployment and configuration:

- [ ] Backend deployed successfully
- [ ] Got User Pool ID and Client ID from CloudFormation outputs
- [ ] Updated `.env.local` with new credentials
- [ ] Updated Amplify Console environment variables
- [ ] Frontend redeployed
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] `/history` endpoint returns 200 OK (not 401)
- [ ] Can upload images without errors
- [ ] No CORS errors in browser console

## Troubleshooting

### Still getting 401 errors?

1. Verify environment variables in Amplify Console match CloudFormation outputs
2. Clear browser cache and cookies
3. Try registering a new user
4. Check CloudWatch logs for API Gateway and Lambda

### Can't register users?

1. Check Cognito User Pool settings in AWS Console
2. Verify email verification is working
3. Check password policy requirements

### CORS errors?

1. Verify CORS configuration in `backend/template.yaml` has correct Amplify domain
2. Check API Gateway CORS settings in AWS Console
3. Verify Gateway Response resources are deployed

## Related Files

- `backend/template.yaml` - SAM template (creates User Pool)
- `backend/samconfig.toml` - Deployment configuration
- `.env.local` - Local environment variables (update after deployment)
- `src/aws-exports.ts` - Amplify configuration (reads from env vars)
- `amplify.yml` - Amplify build configuration
