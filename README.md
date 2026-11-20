# Memepix

A web-based meme picture sharing application for discovering and sharing humorous Chinese-to-English translations.

## Features

- **Image Upload**: Upload meme pictures with metadata (description, category, tags)
- **AI Analysis**: Google Gemini integration to analyze improper Chinese-to-English translations
- **Auto-generated Descriptions**: AI-powered description generation based on translation analysis
- **Location Tagging**: Extract geographical information from images
- **Public Browsing**: Browse and filter memes by category and tags
- **Tag System**: Organize memes with tags, view tag cloud
- **User Authentication**: GitHub OAuth sign-in
- **Bot Protection**: Cloudflare Turnstile integration
- **Meme Management**: View, update, and delete own memes

## Tech Stack

- **Frontend**: React 19.2.3, Tailwind CSS v4, Next.js 16.1.6
- **Backend**: Next.js API Routes
- **Database**: Google Firestore (via Firebase Admin)
- **File Storage**: Cloudflare R2 (via AWS S3 SDK)
- **AI Services**: Google Gemini
- **Authentication**: NextAuth.js 4.24.13 with GitHub OAuth
- **Bot Protection**: Cloudflare Turnstile
- **Image Processing**: Sharp, piexifjs
- **Testing**: Jest 30, Testing Library
- **Deployment**: Google Cloud Run, Docker

## Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud account with Firestore and Gemini API enabled
- GitHub OAuth app
- Cloudflare R2 bucket with API tokens
- Cloudflare Turnstile site

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/memepix.git
cd memepix
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Non-sensitive settings are committed in `src/lib/env.ts` (`PUBLIC_CONFIG`). Any of them can be overridden with an environment variable of the same name:

| Setting | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Your app URL (default: http://localhost:3000) |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID |
| `R2_ENDPOINT` | R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | R2 access key ID |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for R2 bucket |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

Put the secrets in `.env.local`, either as individual variables or as one `APP_SECRETS` JSON object:

| Secret | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | NextAuth.js secret |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |

### 4. Set up Google Cloud

1. Create a Google Cloud project
2. Enable Firestore API
3. Enable Gemini API
4. For local development, run: `gcloud auth application-default login`

### 5. Create Firestore Collections

The app uses these collections:
- `memes` - Meme documents with image URLs and metadata
- `uploads` - Upload tracking documents
- `tags` - Tag definitions with counts

### 6. Set up GitHub OAuth

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Homepage URL to your app URL
4. Set Authorization callback URL to `{NEXTAUTH_URL}/api/auth/callback/github`
5. Copy the Client ID and generate a Client Secret

### 7. Set up Cloudflare R2

1. Create an R2 bucket
2. Generate API tokens (access key ID and secret access key)
3. Configure CORS to allow uploads from your domain:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 8. Set up Cloudflare Turnstile

1. Go to Cloudflare Turnstile dashboard
2. Create a new site
3. Copy the Site Key and Secret Key

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run linting:

```bash
npm run lint
```

## Deployment

### Google Cloud Run

The project includes a `cloudbuild.yaml` for automated deployment to Cloud Run.

1. Create a single JSON secret named `memepix-secrets` in Google Secret Manager:

    ```bash
    cat > /tmp/memepix-secrets.json <<'JSON'
    {
      "NEXTAUTH_SECRET": "...",
      "GITHUB_CLIENT_SECRET": "...",
      "GOOGLE_AI_API_KEY": "...",
      "R2_SECRET_ACCESS_KEY": "...",
      "TURNSTILE_SECRET_KEY": "..."
    }
    JSON
    gcloud secrets create memepix-secrets --data-file=/tmp/memepix-secrets.json
    rm /tmp/memepix-secrets.json
    ```

    To rotate a value, add a new version with `gcloud secrets versions add memepix-secrets --data-file=...` and disable the old version.

2. Update `NEXTAUTH_URL` in `cloudbuild.yaml` and the values in `PUBLIC_CONFIG` (`src/lib/env.ts`) for your deployment.

3. Set up a Cloud Build trigger:
   - Connect your GitHub repository
   - Trigger on push to main branch
   - Use the `cloudbuild.yaml` configuration

4. Grant the Cloud Run service account `roles/secretmanager.secretAccessor` on `memepix-secrets`.

### Manual Deployment

Build and deploy manually:

```bash
# Build the Docker image
docker build -t gcr.io/PROJECT_ID/memepix .

# Push to Google Container Registry
docker push gcr.io/PROJECT_ID/memepix

# Deploy to Cloud Run
gcloud run deploy memepix \
  --image gcr.io/PROJECT_ID/memepix \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated
```

### Rollback

To rollback to a previous revision:

```bash
# List revisions
gcloud run revisions list --service memepix --region us-west1

# Rollback to a specific revision
gcloud run services update-traffic memepix \
  --to-revisions REVISION_NAME=100 \
  --region us-west1
```

## Project Structure

```
src/
├── __tests__/                  # Test files
│   ├── components/             # Component tests
│   ├── image-utils.test.ts
│   ├── hash-utils.test.ts
│   ├── gemini.test.ts
│   ├── meme-service.test.ts
│   └── upload.test.ts
├── app/                        # Next.js App Router pages and API routes
│   ├── api/                    # API endpoints
│   │   ├── analyze/            # Gemini image analysis
│   │   ├── auth/               # NextAuth.js handler
│   │   ├── categories/         # Category CRUD
│   │   ├── config/             # Public configuration
│   │   ├── jobs/               # Background jobs
│   │   │   └── cleanup-tags/   # Tag cleanup job
│   │   ├── memes/              # Meme CRUD and listing
│   │   ├── tags/               # Tags listing
│   │   ├── upload/             # R2 presigned URL generation
│   │   └── upload-proxy/       # Upload proxy
│   ├── meme/[id]/              # Individual meme pages
│   │   └── client-page.tsx
│   ├── tags/                   # Tags list page
│   │   └── [tag]/              # Individual tag pages
│   │       └── client-page.tsx
│   ├── upload/                 # Upload page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                 # React components
│   ├── AuthButton.tsx
│   ├── CategoryFilter.tsx
│   ├── CategorySelect.tsx
│   ├── DescriptionInput.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── ImagePreview.tsx
│   ├── LocationTagSuggestion.tsx
│   ├── MemeDetail.tsx
│   ├── MemeGallery.tsx
│   ├── SessionProvider.tsx
│   ├── TagFilter.tsx
│   ├── TagInput.tsx
│   ├── Turnstile.tsx
│   └── UploadForm.tsx
├── jobs/                       # Background job utilities
│   └── cleanup-tags.ts
├── lib/                        # Utility functions and clients
│   ├── auth.ts                 # Authentication utilities
│   ├── env.ts                  # Environment variable handling
│   ├── firebase.ts             # Firebase Admin SDK
│   ├── firestore-utils.ts      # Firestore utilities
│   ├── gemini.ts               # Gemini client
│   ├── hash-utils.ts           # Hash utilities
│   ├── image-utils.ts          # Image processing utilities
│   ├── meme-service.ts         # Meme CRUD service
│   └── session.ts              # Session utilities
└── types/                      # TypeScript type definitions
    └── index.ts

Dockerfile                      # Docker image for Cloud Run deployment
openspec/                      # OpenSpec change artifacts
├── archive/                    # Archived completed changes
├── changes/                    # Active changes
└── config.yaml                # OpenSpec configuration
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Generate R2 presigned upload URL |
| `/api/upload-proxy` | POST | Proxy upload to R2 |
| `/api/analyze` | POST | Analyze image with Gemini |
| `/api/memes` | GET | List memes with optional filters |
| `/api/memes` | POST | Create a new meme |
| `/api/memes/[id]` | GET | Get a single meme |
| `/api/memes/[id]` | PATCH | Update a meme |
| `/api/memes/[id]` | DELETE | Delete a meme |
| `/api/categories` | GET | List all categories |
| `/api/categories` | POST | Create a new category |
| `/api/tags` | GET | List all tags with counts |
| `/api/config` | GET | Get public configuration |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js handler |
| `/api/jobs/cleanup-tags` | POST | Run tag cleanup job (admin) |

## License

MIT
