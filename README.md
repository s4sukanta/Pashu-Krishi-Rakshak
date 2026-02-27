# Pashu-Krishi Rakshak (পশু-কৃষি রক্ষক / पशु-कृषि रक्षक)

An AI-powered web application that acts as an expert field veterinary doctor and agricultural advisor. Built with Next.js and powered by AWS Bedrock's state-of-the-art Amazon Nova Pro vision model.

## Features

- **Instant Visual Diagnosis**: Upload photos of animals or crops to receive immediate, professional-grade diagnoses.
- **Multilingual Support**: Get diagnosis and treatment plans in English, Hindi (हिंदी), or Bengali (বাংলা).
- **Practical Treatments**: Built to provide highly confident, actionable solutions for farmers in the field without generic advice.
- **Modern UI**: Clean, responsive interface built with shadcn/ui and Tailwind CSS.
- **Rich Formatting**: Beautiful markdown formatting for prescriptions.
- **Secure**: Direct, secure server-side integration with AWS Bedrock.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Frontend Toolkit:** React 19, Tailwind CSS v4, shadcn/ui, Radix UI
- **AI Integrations:** AWS Bedrock Runtime (`@aws-sdk/client-bedrock-runtime`)
- **Foundation Model:** Amazon Nova Pro (`amazon.nova-pro-v1:0` via `us-east-1` cross-region inference)
- **Markdown Handling:** `react-markdown`, `remark-gfm`, `@tailwindcss/typography`

## Getting Started

### Prerequisites

You must have Node.js installed on your machine and access to an AWS Account with Bedrock permissions.

1. **IAM Permissions**: Your AWS user must have `AmazonBedrockFullAccess` or equivalent permissions to invoke models.
2. **Model Access**: You must explicitly request access to the **Amazon Nova Pro** model within the AWS Bedrock Console.

### 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root of the project:

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```
> **Note**: Amazon Nova Pro requires `us-east-1` (or equivalent region where the model is hosted) for cross-region inference.

### 3. Run the Development Server

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the application.

## Usage

1. Select a language from the dropdown menu (English, Hindi, Bengali).
2. Drag and drop or click to upload a clear picture of the agricultural issue.
3. Click **Get Veterinary Diagnosis** and the AI will analyze the image and generate a response.
