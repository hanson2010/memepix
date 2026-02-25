## Why

Users need a platform to upload and share meme pictures, particularly those featuring humorous or improper Chinese-to-English translations. Manual categorization and description is time-consuming. AI-powered analysis can automatically generate descriptions and extract location context, making the sharing experience seamless and discoverable.

## What Changes

- New web application for uploading and sharing meme pictures
- Image upload with metadata support (description, category, tags)
- Google Gemini integration for:
  - Detecting and analyzing improper Chinese-to-English translations in images
  - Auto-generating initial descriptions based on translation analysis
  - Extracting geographical information for location-based tagging
- Public sharing and browsing of meme content
- Automated CI/CD pipeline from GitHub to Google Cloud Run

## Capabilities

### New Capabilities

- `meme-upload`: Upload meme pictures to Cloudflare R2 with metadata (description, category, tags) stored in Firestore
- `meme-sharing`: Public browsing and sharing of uploaded meme pictures with filtering by category and tags
- `ai-image-analysis`: Google Gemini integration to analyze images for improper Chinese-English translations and auto-generate descriptions
- `location-tagging`: AI-powered geographical analysis to extract and assign location tags in lowercase English
- `deployment-pipeline`: GitHub-triggered Cloud Build pipeline deploying to Cloud Run

### Modified Capabilities

(None - this is a new application)

## Impact

**Affected Systems:**
- New Next.js application with TypeScript and Tailwind frontend
- New Firestore collections for memes, tags, categories
- New R2 bucket for image storage
- New Gemini API integration for image analysis
- New Cloud Build configuration for CI/CD

**Dependencies:**
- Google Gemini API (image analysis)
- Cloudflare R2 (image storage)
- Google Firestore (metadata storage)
- Google Cloud Run (hosting)
- Google Cloud Build (CI/CD)

**Affected Teams:**
- Frontend team (new Next.js application)
- Backend team (API routes, Firestore, Gemini integration)
- DevOps team (CI/CD pipeline setup)

## Rollback Plan

1. Cloud Run deployments are versioned - rollback to previous revision via Cloud Run console or `gcloud run services update-traffic`
2. Firestore collections can be cleared/deleted if data model changes
3. R2 bucket can be emptied and recreated if storage structure changes
4. Remove GitHub webhook to disable automatic builds
