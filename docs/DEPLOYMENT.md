# Deployment Guide - Pashu Krishi Rakshak

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS AMPLIFY HOSTING                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js Frontend + CloudFront CDN (automatic)         │ │
│  │  - User Interface                                      │ │
│  │  - Cognito Auth Integration                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COGNITO USER POOL                         │
│  - User Authentication                                       │
│  - JWT Token Generation                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ JWT Token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (REST)                        │
│  - Cognito Authorizer                                        │
│  - CORS Configuration                                        │
│  - /analyze, /history, /location endpoints                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTIONS                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Analyze    │  │   History    │  │   Location   │      │
│  │   Function   │  │   Function   │  │   Function   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│  AWS BEDROCK    │  │  DYNAMODB   │  │  GEO PLACES     │
│  - Nova Pro     │  │  - History  │  │  - Location     │
│  - Knowledge    │  │  - Usage    │  │    Search       │
│    Base         │  │    Logs     │  │                 │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

## Deployment Steps

### 1. Deploy Backend (SAM)

Your backend is already deployed! The SAM stack includes:
- ✅ Cognito User Pool
- ✅ API Gateway with Cognito Authorizer
- ✅ Lambda Functions (analyze, history, location)
- ✅ DynamoDB Tables

**Current API Endpoint**: `https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/Prod/`

If you need to redeploy backend:
```bash
cd backend
sam build
sam deploy --guided
```

### 2. Deploy Frontend to AWS Amplify Hosting

#### Option A: Using AWS Console (Recommended)

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Choose your Git provider (GitHub, GitLab, Bitbucket, etc.)
   - Authorize AWS Amplify to access your repository
   - Select your repository and branch (usually `main` or `master`)

3. **Configure Build Settings**
   - Amplify will auto-detect `amplify.yml` (already created)
   - Build settings are pre-configured for Next.js

4. **Add Environment Variables**
   In the Amplify Console, add these environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/Prod/
   NEXT_PUBLIC_USER_POOL_ID=YOUR_USER_POOL_ID
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=YOUR_CLIENT_ID
   NEXT_PUBLIC_AWS_REGION=YOUR_REGION
   ```
   
   **⚠️ IMPORTANT**: Do NOT add `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` to Amplify.
   These are only for local development. Lambda functions use IAM roles.

5. **Deploy**
   - Click "Save and deploy"
   - Amplify will automatically:
     - Build your Next.js app
     - Deploy to CloudFront CDN
     - Provide HTTPS domain
     - Enable continuous deployment

#### Option B: Using Amplify CLI

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize Amplify in your project
amplify init

# Add hosting
amplify add hosting
# Choose: "Hosting with Amplify Console"
# Choose: "Manual deployment"

# Publish
amplify publish
```

### 3. Update CORS (if needed)

If you get CORS errors after deployment, update your API Gateway CORS settings in `backend/template.yaml`:

```yaml
Cors:
  AllowMethods: "'GET,POST,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  AllowOrigin: "'https://your-amplify-domain.amplifyapp.com'"  # Update this
```

Then redeploy backend:
```bash
cd backend
sam build && sam deploy
```

## Post-Deployment

### Your App URLs

After deployment, you'll get:
- **Frontend**: `https://main.xxxxxx.amplifyapp.com` (Amplify provides this)
- **Backend API**: `https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/Prod/` (from SAM deployment)

### CloudFront CDN

**You don't need to configure CloudFront separately!** 

AWS Amplify Hosting automatically:
- ✅ Creates a CloudFront distribution
- ✅ Configures SSL/TLS certificates
- ✅ Enables global CDN caching
- ✅ Provides DDoS protection
- ✅ Handles cache invalidation on new deployments

### Testing

1. **Create a test user**:
   ```bash
   aws cognito-idp sign-up \
     --client-id YOUR_CLIENT_ID \
     --username test@example.com \
     --password TestPassword123! \
     --user-attributes Name=email,Value=test@example.com
   ```

2. **Verify user** (if auto-verification is off):
   ```bash
   aws cognito-idp admin-confirm-sign-up \
     --user-pool-id YOUR_USER_POOL_ID \
     --username test@example.com
   ```

3. **Test the app**:
   - Visit your Amplify URL
   - Sign up / Sign in
   - Upload an image
   - Check diagnosis results

## Monitoring

### Amplify Console
- Build logs: Amplify Console → Your App → Build history
- Access logs: Amplify Console → Your App → Monitoring

### Backend Monitoring
- Lambda logs: CloudWatch → Log groups → `/aws/lambda/AnalyzeFunction`
- API Gateway: CloudWatch → API Gateway metrics
- DynamoDB: DynamoDB Console → Tables → Metrics

## Cost Optimization

### Amplify Hosting
- Free tier: 1000 build minutes/month, 15 GB served/month
- After free tier: ~$0.01/build minute, ~$0.15/GB served

### Backend (Already Deployed)
- Lambda: Pay per request (~$0.20 per 1M requests)
- API Gateway: ~$3.50 per 1M requests
- DynamoDB: Pay per request (on-demand pricing)
- Bedrock: Pay per token (Nova Pro pricing)

## Troubleshooting

### Build Fails on Amplify
- Check build logs in Amplify Console
- Verify all environment variables are set
- Ensure `amplify.yml` is in root directory

### Authentication Errors
- Verify Cognito User Pool ID and Client ID
- Check CORS settings in API Gateway
- Ensure JWT tokens are being sent correctly

### API Errors
- Check Lambda function logs in CloudWatch
- Verify IAM permissions for Lambda functions
- Test API endpoints directly with Postman/curl

## Security Notes

1. **Never commit credentials**: `.env.local` is in `.gitignore`
2. **Use IAM roles**: Lambda functions use IAM roles, not access keys
3. **Enable MFA**: Consider enabling MFA for Cognito users
4. **API rate limiting**: Consider adding rate limiting to API Gateway
5. **WAF**: Consider adding AWS WAF for additional security

## Next Steps

1. ✅ Backend deployed (SAM)
2. ✅ Deploy frontend to Amplify Hosting
3. ✅ Test end-to-end flow
4. ⏳ Set up custom domain (optional)
5. ⏳ Configure monitoring and alerts
6. ⏳ Set up CI/CD pipeline (automatic with Amplify)
