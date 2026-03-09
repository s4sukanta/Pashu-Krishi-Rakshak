# Pashu Krishi Rakshak - Feature Overview

## Overview
AI-powered veterinary and crop diagnosis application for rural Indian farmers, providing instant analysis, treatment recommendations, and location-based services.

## Core Features

### 1. Multimodal AI Diagnosis
**Technology**: AWS Bedrock (Nova Lite + Nova Pro)

- Analyzes photos and videos of sick animals
- Supports multiple animal types: cows, sheep, lambs, dogs, crops
- Confidence scoring (0-100%) for diagnosis reliability
- Detailed disease descriptions and symptom analysis
- Media quality validation with user guidance

### 2. Multilingual Interface
**Languages**: English, Hindi (हिंदी), Bengali (বাংলা)

- Complete UI translation
- AI responses in user's selected language
- Voice output support
- Culturally appropriate terminology

### 3. Location-Based Services
**Technology**: AWS Geo Places API

- Automatic geolocation on app load
- Finds nearest veterinary services
- Displays name, address, and distance
- Integrated into diagnosis results

**Documentation**: [NEAREST_VET_FEATURE.md](./NEAREST_VET_FEATURE.md)

### 4. Treatment Recommendations
**Rural-Focused Prescriptions**:

- Medicine names (generic and brand)
- Dosages, frequency, and duration
- Price estimates in INR
- Direct purchase links
- Home care instructions

### 5. Case Management
**Health Tracking**:

- Unique case IDs per animal
- Follow-up diagnosis support
- Progression tracking (improving/worsening/stable)
- Complete visit timeline
- Historical comparison

### 6. Authentication & Security
**Technology**: AWS Cognito

- Email-based user accounts
- JWT token authentication
- Protected API endpoints
- User-specific data isolation

### 7. Mobile-First Design
**Responsive Interface**:

- Installable on mobile devices (Web App Manifest)
- Camera integration
- Video recording support
- Responsive design
- Large touch targets for rural users

### 8. Knowledge Base Integration
**Technology**: AWS Bedrock Knowledge Bases

- Retrieval-Augmented Generation (RAG)
- Veterinary knowledge corpus
- Evidence-based recommendations
- Anti-hallucination grounding

## Technical Architecture

### Frontend
- Next.js 16 (App Router)
- React 19, TypeScript
- Tailwind CSS v4
- shadcn/ui components
- AWS Amplify UI

### Backend
- AWS Lambda (Node.js 20)
- API Gateway with Cognito authorizer
- Amazon Bedrock (Nova models)
- Amazon DynamoDB
- AWS Geo Places API
- AWS SAM (Infrastructure as Code)

### AI Pipeline
```
Input → Nova Lite Triage → Knowledge Retrieval → Grounding → Nova Pro Synthesis → Output
```

## Key Capabilities

### Media Analysis
- Image formats: JPEG, PNG, WebP, GIF
- Video formats: MP4, WebM, MOV
- Quality validation
- Thumbnail generation

### Diagnosis Output
- Disease identification
- Confidence score
- Symptom analysis
- Treatment plan
- Medicine prescriptions with pricing
- Home care steps
- Veterinary consultation recommendation
- Nearest vet location

### Follow-Up Analysis
- Historical context integration
- Visual and textual comparison
- Progression assessment
- Treatment adjustment recommendations

## Design Principles

1. **Accessibility**: High contrast, screen reader support, voice output
2. **Simplicity**: Large buttons, clear icons, minimal text
3. **Mobile-Optimized**: Touch-friendly, camera-first interface
4. **Culturally Aware**: Local languages, INR pricing, rural context

## AWS Services

- Amazon Bedrock (AI/ML)
- Bedrock Knowledge Bases (RAG)
- AWS Lambda (Compute)
- API Gateway (REST API)
- DynamoDB (Database)
- Cognito (Authentication)
- Amplify (Hosting)
- Geo Places (Location Services)
- CloudWatch (Monitoring)
- IAM (Security)

## Performance

- Serverless auto-scaling (Lambda + API Gateway)
- Pay-per-use pricing
- CloudFront CDN for frontend assets
- Lambda timeout: 120s (handles complex multi-step AI pipeline)

## Security

- HTTPS everywhere
- CORS configuration
- JWT token validation
- IAM least-privilege policies
- No sensitive data in frontend
- Secure credential management

## Future Enhancements

- SMS/WhatsApp integration
- Offline AI model
- Crop disease expansion
- Veterinarian marketplace
- Community forum
- Government scheme integration
- Additional language support
