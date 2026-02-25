# Memepix

A web-based meme picture sharing application for discovering and sharing humorous Chinese-to-English translations.

## Features

- **Image Upload**: Upload meme pictures with metadata (description, category, tags)
- **AI Analysis**: Google Gemini integration to analyze improper Chinese-to-English translations
- **Auto-generated Descriptions**: AI-powered description generation based on translation analysis
- **Location Tagging**: Extract geographical information from images
- **Public Browsing**: Browse and filter memes by category and tags

## Tech Stack

- **Frontend**: TypeScript, Tailwind CSS, Next.js
- **Backend**: Next.js API Routes
- **Database**: Google Firestore
- **File Storage**: Cloudflare R2
- **AI Services**: Google Gemini
- **Testing**: Jest, Testing Library
- **Hosting**: Google Cloud Run

## Prerequisites

- Node.js 20+
- npm or yarn
- Google Cloud account with Firestore and Gemini API enabled
- Cloudflare R2 bucket

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

Edit `.env.local` with your credentials:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your app URL (default: http://localhost:3000) |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID |
| `GOOGLE_AI_API_KEY` | Google Gemini API key |
| `R2_ENDPOINT` | R2 endpoint URL |
| `R2_ACCESS_KEY_ID` | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 secret access key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for R2 bucket |

### 4. Set up Google Cloud

1. Create a Google Cloud project
2. Enable Firestore API
3. Enable Gemini API
4. For local development, run: `gcloud auth application-default login`

### 5. Set up Cloudflare R2

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

### 6. Create Firestore Collections

The app uses these collections:
- `memes` - Meme documents with image URLs and metadata
- `categories` - Category definitions

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

## Deployment

### Google Cloud Run

The project includes a `cloudbuild.yaml` for automated deployment to Cloud Run.

1. Create secrets in Google Secret Manager:
    - `google-ai-api-key`: Gemini API key
    - `r2-access-key-id`: R2 access key ID
    - `r2-secret-access-key`: R2 secret access key
    - `r2-public-url`: R2 public URL
    - `nextauth-secret`: NextAuth.js secret
    - `github-client-id`: GitHub OAuth client ID
    - `github-client-secret`: GitHub OAuth client secret

2. Update `cloudbuild.yaml` with your R2 endpoint URL.

2. Set up a Cloud Build trigger:
   - Connect your GitHub repository
   - Trigger on push to main branch
   - Use the `cloudbuild.yaml` configuration

3. Grant the Cloud Run service account access to the secrets.

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
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated
```

### Rollback

To rollback to a previous revision:

```bash
# List revisions
gcloud run revisions list --service memepix --region us-central1

# Rollback to a specific revision
gcloud run services update-traffic memepix \
  --to-revisions REVISION_NAME=100 \
  --region us-central1
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # API endpoints
│   │   ├── analyze/        # Gemini image analysis
│   │   ├── categories/     # Category CRUD
│   │   ├── memes/          # Meme CRUD and listing
│   │   └── upload/         # R2 presigned URL generation
│   └── meme/[id]/          # Individual meme pages
├── components/             # React components
├── lib/                    # Utility functions and clients
│   ├── env.ts              # Environment variable handling
│   ├── firebase.ts         # Firebase Admin SDK
│   ├── firestore-utils.ts  # Firestore utilities
│   ├── gemini.ts           # Gemini client
│   └── meme-service.ts     # Meme CRUD service
└── types/                  # TypeScript type definitions
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Generate R2 presigned upload URL |
| `/api/analyze` | POST | Analyze image with Gemini |
| `/api/memes` | GET | List memes with optional filters |
| `/api/memes` | POST | Create a new meme |
| `/api/categories` | GET | List all categories |
| `/api/categories` | POST | Create a new category |

## License

MIT
