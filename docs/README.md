# Getting Started Guide

This guide covers installation, configuration, and usage of Pashu-Krishi Rakshak.

## Prerequisites

Before you begin, ensure you have:

1. **Node.js 18+** installed on your machine
2. **AWS Account** with the following:
   - IAM user with `AmazonBedrockFullAccess` permissions
   - Access to **Amazon Nova Lite** and **Amazon Nova Pro** models (request in Bedrock Console)
   - A Cognito User Pool configured (or use the SAM template to create one)
3. **Backend deployed** (see [DEPLOYMENT.md](./DEPLOYMENT.md))

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | AWS Lambda (Node.js 20), API Gateway |
| AI/ML | AWS Bedrock (Nova Lite + Nova Pro), Bedrock Knowledge Bases |
| Auth | AWS Cognito + @aws-amplify/ui-react |
| Database | Amazon DynamoDB |
| Infrastructure | AWS SAM |

## Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd Pashu-Krishi-Rakshak
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# AWS Credentials (for local development)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# API Gateway URL (from backend deployment)
NEXT_PUBLIC_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/Prod

# Cognito Configuration (from backend deployment)
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
```

> **Important**: The `NEXT_PUBLIC_*` variables are required for the frontend to connect to the backend API and Cognito authentication.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### User Flow

1. **Landing Page** (`/landing`) — Marketing page with feature overview
2. **Login** (`/login`) — Create account or sign in with AWS Cognito
3. **Main App** (`/app`) — Upload media and get AI diagnosis

### Getting a Diagnosis

1. **Select Language** — Choose English, Hindi (हिंदी), or Bengali (বাংলা)
2. **Upload Media** — Take a photo or upload an image/video of the sick animal or crop
3. **Add Context** (optional) — Describe symptoms you've observed
4. **Get Diagnosis** — AI analyzes the media and returns:
   - Disease identification with confidence score
   - Detailed description and typical symptoms
   - Prescription with medicine names, dosages, and prices
   - Home care steps
   - Recommendation to see a vet (if needed)

### Managing Cases

- **New Animal**: Each diagnosis creates a new case with a unique ID
- **Follow-up**: Select an existing case to track health progression over time
- **History**: View all past diagnoses grouped by animal
- **Timeline**: See health status changes (improving/worsening/stable)

## Available Commands

```bash
npm run dev        # Start development server (port 3000)
npm run build      # Create production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm test           # Run Jest tests
npm run test:watch # Run tests in watch mode
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout with Noto Sans font
│   ├── page.tsx          # Redirects to /landing
│   ├── landing/          # Public marketing page
│   ├── login/            # Cognito authentication
│   └── app/              # Main diagnosis interface (protected)
├── components/
│   ├── AuthProvider.tsx  # Cognito auth context
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Feature components
├── lib/
│   └── utils.ts          # Utility functions (cn helper)
└── aws-exports.ts        # Amplify configuration
```

## Troubleshooting

### "Failed to fetch" Error

1. Check browser console (F12) for specific error
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Ensure backend is deployed and accessible
4. Check CORS configuration in API Gateway

### 401 Unauthorized

1. Ensure you're logged in (check for valid session)
2. Verify Cognito User Pool ID and Client ID are correct
3. Token should be `idToken` not `accessToken`

### Media Upload Fails

1. Supported image formats: JPEG, PNG, WebP, GIF
2. Supported video formats: MP4, WebM, MOV
3. Ensure media is clear and shows the issue visibly

## Next Steps

- [Deployment Guide](./DEPLOYMENT.md) — Deploy to AWS Amplify
- [Design Document](./design.md) — System architecture details
- [Requirements](./requirements.md) — Formal acceptance criteria
