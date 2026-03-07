# Pashu-Krishi Rakshak (পশু-কৃষি রক্ষক / पशु-कृषि रक्षक)

An AI-powered web application that acts as an expert field veterinary doctor and agricultural advisor for rural farmers in India.

## Documentation

All project documentation has been moved to the `docs/` folder:

- **[Getting Started Guide](docs/README.md)** - Installation and usage instructions
- **[Deployment Guide](docs/DEPLOYMENT.md)** - How to deploy to AWS Amplify
- **[Requirements Document](docs/requirements.md)** - Detailed requirements specification
- **[Design Document](docs/design.md)** - System architecture and design
- **[Logout Implementation](docs/LOGOUT_IMPLEMENTATION.md)** - Authentication feature details
- **[Device ID Removal](docs/DEVICE_ID_REMOVAL.md)** - UI simplification changes

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see docs/README.md)
cp .env.example .env.local

# Run development server
npm run dev
```

## Features

- 🐄 Instant visual diagnosis for livestock and crops
- 🌍 Multilingual support (English, Hindi, Bengali)
- 📱 Mobile-first responsive design
- 🔐 Secure AWS Cognito authentication
- ☁️ Powered by AWS Bedrock Nova Pro AI model

## Tech Stack

- Next.js 15 + React 19
- AWS Amplify + Cognito
- AWS Bedrock (Nova Pro)
- Tailwind CSS + shadcn/ui

## License

See LICENSE file for details.
