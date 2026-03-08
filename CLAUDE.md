# CLAUDE.md

## Project Overview

Pashu-Krishi Rakshak — AI-powered veterinary & crop diagnosis app for rural Indian farmers. Users upload photos/videos of sick animals or crops and receive structured diagnoses with prescriptions in English, Hindi, or Bengali.

## Tech Stack

- **Frontend**: Next.js 16 + React 19, TypeScript, Tailwind CSS v4, shadcn/ui (new-york style)
- **Backend**: 3 AWS Lambda functions (Node.js 20, plain JavaScript), AWS SAM
- **AI**: AWS Bedrock — Nova Lite (triage), Nova Pro (grounding + final diagnosis), Bedrock Knowledge Base (RAG)
- **Auth**: AWS Cognito via @aws-amplify/ui-react Authenticator
- **Database**: DynamoDB (PashuKrishi_History_V2, PashuKrishi_UsageLogs_V2)
- **Hosting**: AWS Amplify (frontend), API Gateway + Lambda (backend)
- **UI**: lucide-react icons, react-markdown with remark-gfm

## Commands

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run lint       # ESLint (flat config, eslint.config.mjs)
npm test           # Jest tests
npm run test:watch # Jest in watch mode
```

Backend deployment uses AWS SAM CLI from `backend/` directory.

## Project Structure

```
src/
  app/
    layout.tsx          # Root layout (Noto Sans font, metadata)
    page.tsx            # Redirects to /landing
    landing/page.tsx    # Public marketing page
    login/page.tsx      # Cognito auth page, redirects to /app on success
    app/
      layout.tsx        # Wraps children in AuthProvider (requireAuth=true)
      page.tsx          # Main app — large single-file component (~1800 lines)
  components/
    AuthProvider.tsx     # Cognito auth context (useAuth hook)
    CaseDashboard.tsx    # Original case list (hardcoded colors)
    CaseTimeline.tsx     # Original timeline view (hardcoded colors)
    AccessibleCaseDashboard.tsx  # i18n-aware case list (uses design tokens)
    AccessibleCaseTimeline.tsx   # i18n-aware timeline (uses design tokens)
    ui/                 # shadcn/ui primitives (button, card, dialog, etc.)
  aws-exports.ts        # Amplify.configure() from env vars
  lib/utils.ts          # cn() helper (clsx + tailwind-merge)
backend/
  template.yaml         # SAM template (API Gateway, Lambdas, Cognito, DynamoDB)
  src/
    analyze/index.js    # POST /analyze — multi-step AI diagnosis pipeline
    history/index.js    # GET/DELETE /history — diagnosis history CRUD
    location/index.js   # POST /location — nearest vet via AWS Geo Places
tests/
  setup.ts              # Loads .env.local via dotenv
  bug-exploration.test.ts  # Documents User Pool ARN mismatch bug
docs/                   # Project documentation (core docs + archive/ for historical)
```

## Architecture

### Frontend Routes
- `/` → redirects to `/landing`
- `/landing` — public marketing page (no auth)
- `/login` — Cognito Authenticator UI, redirects to `/app` on success
- `/app` — protected main app (AuthProvider checks auth, redirects to /landing if unauthenticated)

### Backend API (API Gateway + Cognito Authorizer)
- `POST /analyze` — Accepts multipart/form-data (media files + metadata). 4-step pipeline: (1) Nova Lite triage → search queries, (2) Bedrock KB parallel retrieval, (3) Nova Pro grounding, (4) Nova Pro final JSON diagnosis. Saves to DynamoDB.
- `GET /history?userId=` — Returns user's diagnosis history + usage logs
- `DELETE /history` — Deletes records by caseId or timestamp
- `POST /location` — Finds nearest veterinary service from coordinates

### Auth Flow
Amplify configured in `src/aws-exports.ts` using NEXT_PUBLIC_ env vars. AuthProvider wraps `/app` route with `requireAuth=true`, uses Cognito `getCurrentUser()` check. Login page uses `<Authenticator>` component directly.

## Code Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **Styling**: Tailwind CSS v4 with CSS custom properties in `globals.css`. Color scheme uses oklch. Custom utilities: `.touch-target`, `.text-accessible`, `.icon-large`, `.icon-xl`
- **Components**: shadcn/ui (new-york style, RSC enabled). Import from `@/components/ui/*`. Use `cn()` from `@/lib/utils` for conditional classes.
- **"Accessible" vs original components**: AccessibleCaseDashboard/Timeline use design tokens (bg-card, text-foreground, etc.) and accept i18n translations prop. Original CaseDashboard/Timeline use hardcoded Tailwind colors (bg-white, text-gray-900). Prefer the Accessible variants.
- **Backend Lambdas**: Plain JavaScript (not TypeScript), CommonJS require. Each Lambda has its own package.json and node_modules in `backend/src/<function>/`.
- **API responses**: All Lambdas return `Access-Control-Allow-Origin: "*"` header. Diagnosis JSON has a fixed schema (diseaseIdentification, confidenceScore, prescription, etc.).
- **Font**: Noto Sans with latin + devanagari subsets

## Environment Variables

Required in `.env.local` (never commit this file):
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
NEXT_PUBLIC_API_URL=<API Gateway URL>
NEXT_PUBLIC_USER_POOL_ID=<Cognito User Pool ID>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<Cognito App Client ID>
NEXT_PUBLIC_AWS_REGION=us-east-1
```

## Testing

- Framework: Jest 30 + ts-jest
- Config: `jest.config.js` (preset ts-jest, node environment)
- Test root: `tests/` directory
- Setup: `tests/setup.ts` loads `.env.local` via dotenv
- Run: `npm test`

## Known Issues

- **Main app page size**: `src/app/app/page.tsx` is ~1800 lines — consider breaking into smaller components.

## Auth Architecture Notes

- **AuthProvider** uses `getCurrentUser()` + direct `signOut` import (NOT `<Authenticator>` wrapper) to avoid double-Authenticator session conflicts.
- **Token type**: Frontend sends `idToken` (not `accessToken`) in `Authorization: Bearer <token>` header. API Gateway COGNITO_USER_POOLS authorizer validates it.
- **configureAmplify** is a singleton — only configures once per page load. Removed unused `API.REST` config.
- **CORS**: `ALLOWED_ORIGIN` env var is injected into all Lambdas via SAM Globals. GatewayResponses on the API handle CORS for 401/403/4xx errors.
- **Origin**: Amplify domain is parameterized in `backend/template.yaml` as `AllowedOrigin` parameter — update there if domain changes.
