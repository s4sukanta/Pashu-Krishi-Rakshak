# Pashu-Krishi Rakshak (पशु-कृषि रक्षक / পশু-কৃষি রক্ষক)

> **AI for Bharat Hackathon Submission**
> Problem Statement: *AI for Communities, Access & Public Impact*

An AI-powered veterinary and crop diagnosis application that brings expert agricultural healthcare to rural Indian farmers — available 24/7 in Hindi, English, and Bengali.

## The Problem

- **70% of India's rural households** depend on livestock for income
- **Critical veterinary gap**: Only 1 veterinarian per 5,177 livestock (WHO recommends 1:500)
- **Economic impact**: Animal diseases cause ~₹13,000 crore annual loss to Indian farmers
- **Access barrier**: Most farmers cannot easily reach veterinary services

## Our Solution

Pashu-Krishi Rakshak ("Livestock-Crop Protector") uses AWS Bedrock's multimodal AI to provide:

1. **Instant Visual Diagnosis** — Upload a photo/video of sick animals or crops
2. **AI-Powered Analysis** — 4-stage pipeline with RAG-based knowledge retrieval
3. **Actionable Prescriptions** — Medicine names, dosages, prices in INR, and home care steps
4. **Multilingual Support** — Full UI and diagnosis in Hindi (हिंदी), Bengali (বাংলা), and English
5. **Follow-up Tracking** — Monitor animal health progression over time

## Key Features

| Feature | Description |
|---------|-------------|
| **Multimodal AI** | Analyzes images and videos using Amazon Nova Pro |
| **Location Services** | Finds nearest veterinary services using AWS Geo Places API |
| **Knowledge Base** | RAG pipeline retrieves from veterinary manuals |
| **Anti-Hallucination** | Grounding engine filters AI responses against retrieved facts |
| **Quality Gates** | Rejects unclear media to prevent misdiagnosis |
| **Text-to-Speech** | Automatic pronunciation for low-literacy users |
| **Case Management** | Track multiple animals with health timelines |
| **Farmer-Centric** | Focuses on home treatments, shows medicine costs in ₹ |

**See**: [Complete Feature List](docs/FEATURES.md)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: AWS Lambda (Node.js 20), API Gateway, AWS SAM
- **AI/ML**: AWS Bedrock (Nova Lite + Nova Pro), Bedrock Knowledge Bases
- **Auth**: AWS Cognito with Amplify UI
- **Database**: Amazon DynamoDB
- **Hosting**: AWS Amplify (frontend), API Gateway + Lambda (backend)

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd Pashu-Krishi-Rakshak
npm install

# Configure environment
cp .env.example .env.local
# Add your AWS credentials and Cognito IDs to .env.local

# Run development server
npm run dev
```

## Environment Variables

Create a `.env.local` file with:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
NEXT_PUBLIC_API_URL=<api-gateway-url>
NEXT_PUBLIC_USER_POOL_ID=<cognito-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<cognito-client-id>
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Documentation

| Document | Description |
|----------|-------------|
| [Documentation Index](docs/INDEX.md) | Complete documentation navigation |
| [Features Overview](docs/FEATURES.md) | Feature list with technical details |
| [Getting Started](docs/README.md) | Installation and usage guide |
| [System Design](docs/design.md) | Architecture and design decisions |
| [Requirements](docs/requirements.md) | Formal acceptance criteria |
| [Deployment Guide](docs/DEPLOYMENT.md) | AWS infrastructure deployment |
| [Nearest Vet Feature](docs/NEAREST_VET_FEATURE.md) | Location services implementation |

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── landing/      # Public marketing page
│   │   ├── login/        # Cognito authentication
│   │   └── app/          # Main diagnosis interface
│   └── components/       # React components + shadcn/ui
├── backend/
│   ├── template.yaml     # AWS SAM infrastructure
│   └── src/
│       ├── analyze/      # AI diagnosis pipeline
│       ├── history/      # Case history CRUD
│       └── location/     # Nearest vet finder
└── docs/                 # Project documentation
```

## AI Pipeline Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Step 1    │────▶│   Step 2    │────▶│   Step 3    │────▶│   Step 4    │
│ Nova Lite   │     │  Knowledge  │     │  Grounding  │     │   Final     │
│   Triage    │     │  Retrieval  │     │   Engine    │     │  Synthesis  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
   Generate 3        Parallel RAG        Filter facts,       Nova Pro JSON
 search queries     from Bedrock KB      categorize         diagnosis output
```

## Impact Potential

| Metric | Value |
|--------|-------|
| Target Users | 150M+ rural farmers in India |
| Languages | 3 (expandable to 22 official Indian languages) |
| Availability | 24/7 (vs. sporadic vet access) |
| Cost | Free to use (reduces ₹13,000Cr annual disease losses) |

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run lint       # Run ESLint
npm test           # Run Jest tests
```

## Team

Built for the [AI for Bharat Hackathon](https://vision.hack2skill.com/event/ai-for-bharat/) by Uniqytech.

## License

See LICENSE file for details.
