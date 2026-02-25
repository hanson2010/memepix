# MemePix Project Archive

**Archive Date:** 2026-02-25
**Archive Version:** 1.1.0

---

## Project Overview

**MemePix** is a web-based meme picture sharing application for discovering and sharing humorous Chinese-to-English translations.

### Key Features
- Image Upload with metadata (description, category, tags)
- AI Analysis via Google Gemini for improper Chinese-to-English translations
- Auto-generated Descriptions based on translation analysis
- Location Tagging from image EXIF data
- Public Browsing with filtering by category and tags
- GitHub Authentication via NextAuth.js

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16.1.6, React 19.2.3, TypeScript 5, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | Google Firestore (via firebase-admin 13.6.1) |
| File Storage | Cloudflare R2 (via @aws-sdk/client-s3) - YYYY/MM folder structure |
| AI Services | Google Gemini (@google/generative-ai 0.21) |
| Authentication | NextAuth.js 4.24.13 (GitHub OAuth) |
| Testing | Jest 30, Testing Library |
| Hosting | Google Cloud Run |

---

## Project Statistics

- **Total TypeScript Code:** ~2,193 lines
- **Source Files:** 35 TypeScript/TSX files
- **Test Files:** 5 test files
- **Project Size (excluding deps):** 1.5MB

---

## File Structure

```
memepix/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── analyze/route.ts      # Gemini image analysis
│   │   │   ├── categories/route.ts   # Category CRUD
│   │   │   ├── memes/route.ts        # Meme CRUD and listing
│   │   │   ├── upload/route.ts       # R2 presigned URL generation
│   │   │   └── auth/[...nextauth]/   # NextAuth.js handler
│   │   ├── meme/[id]/                # Individual meme pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/                   # React components
│   │   ├── AuthButton.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── CategorySelect.tsx
│   │   ├── DescriptionInput.tsx
│   │   ├── ImagePreview.tsx
│   │   ├── LocationTagSuggestion.tsx
│   │   ├── MemeDetail.tsx
│   │   ├── MemeGallery.tsx
│   │   ├── SessionProvider.tsx
│   │   ├── TagFilter.tsx
│   │   ├── TagInput.tsx
│   │   └── UploadForm.tsx
│   ├── lib/                          # Utilities
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   ├── firebase.ts
│   │   ├── firestore-utils.ts
│   │   ├── gemini.ts
│   │   ├── meme-service.ts
│   │   └── session.ts
│   ├── types/index.ts
│   └── __tests__/                    # Test files
├── public/
├── openspec/                         # OpenSpec documentation
│   ├── config.yaml
│   ├── specs/
│   └── changes/
├── .env.local.example
├── Dockerfile
├── cloudbuild.yaml
├── next.config.ts
├── tsconfig.json
├── jest.config.ts
└── package.json
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Generate R2 presigned upload URL (YYYY/MM folder) |
| `/api/analyze` | POST | Analyze image with Gemini AI |
| `/api/memes` | GET | List memes with optional filters |
| `/api/memes` | POST | Create a new meme |
| `/api/categories` | GET | List all categories |
| `/api/categories` | POST | Create a new category |
| `/api/auth/[...nextauth]` | * | NextAuth.js authentication |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | (Optional) Path to service account JSON for local dev |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `R2_ENDPOINT` | Cloudflare R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for R2 bucket |
| `NEXTAUTH_SECRET` | NextAuth.js secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

---

## Git Status at Archive Time

**Branch:** main
**Last Commit:** d250755 - "Initial commit"

### Uncommitted Changes:
- Modified: `.gitignore`, `README.md`
- New Files: All source code, configuration files, tests, Dockerfile, cloudbuild.yaml
- Recent changes: "Memepix" → "MemePix", us-west1 region, YYYY/MM folder structure, removed GOOGLE_APPLICATION_CREDENTIALS from Cloud Run

---

## Deployment Configuration

### Google Cloud Run
- Dockerfile configured for containerized deployment
- cloudbuild.yaml for CI/CD pipeline (deployed to us-west1)
- Secrets managed via Google Secret Manager
- Uses Application Default Credentials (no service account key needed)

### Required Secrets:
- `google-ai-api-key`
- `r2-access-key-id`
- `r2-secret-access-key`
- `r2-public-url`
- `nextauth-secret`
- `github-client-id`
- `github-client-secret`

---

## Dependencies

### Production Dependencies
- `@aws-sdk/client-s3`: ^3
- `@aws-sdk/s3-request-presigner`: ^3
- `@google/generative-ai`: ^0.21
- `firebase-admin`: ^13.6.1
- `next`: 16.1.6
- `next-auth`: ^4.24.13
- `react`: 19.2.3
- `react-dom`: 19.2.3

### Development Dependencies
- `@tailwindcss/postcss`: ^4
- `@testing-library/jest-dom`: ^6.9.1
- `@testing-library/react`: ^16.3.2
- `@types/jest`: ^30.0.0
- `@types/node`: ^20.19.33
- `@types/react`: ^19
- `@types/react-dom`: ^19
- `eslint`: ^9
- `eslint-config-next`: 16.1.6
- `jest`: ^30.2.0
- `jest-environment-jsdom`: ^30.2.0
- `tailwindcss`: ^4
- `ts-node`: ^10.9.2
- `typescript`: ^5

---

## Restore Instructions

1. Clone the repository
2. Run `npm install` to restore dependencies
3. Copy `.env.local.example` to `.env.local` and configure
4. Run `npm run dev` for development
5. Run `npm test` to verify tests pass

---

## Notes

- All source code is functional and tested
- All 57 tasks complete
- Project is ready for deployment to Google Cloud Run (us-west1)
- Authentication configured for GitHub OAuth
- Firestore collections required: `memes`, `categories`
- Images uploaded to R2 are stored under `YYYY/MM/` folder structure
