## Context

New greenfield application for sharing meme pictures with improper Chinese-to-English translations. No existing system to migrate from. Target users are casual browsers and meme enthusiasts looking for humorous translation content.

**Constraints:**
- Must use Google Cloud services (Run, Build, Firestore)
- Must use Cloudflare R2 for image storage
- Must use Google Gemini for AI analysis
- Public access (no authentication for MVP)

**Stakeholders:**
- End users (upload and browse memes)
- Content moderators (if needed for inappropriate content)

## Goals / Non-Goals

**Goals:**
- Simple, fast meme upload flow with AI-assisted metadata
- Public browsing with category and tag filtering
- Automated CI/CD from GitHub to Cloud Run
- Scalable image storage via R2
- AI-powered description generation and location tagging

**Non-Goals:**
- User authentication (MVP)
- Social features (comments, likes, follows)
- Content moderation system
- Mobile native apps
- Payment/billing integration

## Decisions

### 1. Image Storage: Cloudflare R2
**Rationale:** Cost-effective object storage with no egress fees. S3-compatible API allows easy migration if needed.
**Alternatives:** Google Cloud Storage (higher egress costs), Firebase Storage (tighter Firebase coupling)

### 2. Metadata Storage: Google Firestore
**Rationale:** Native Next.js integration via Firebase SDK, real-time updates, flexible schema for tags/categories, serverless scaling.
**Alternatives:** Cloud SQL (overkill for simple document model), MongoDB Atlas (additional vendor)

### 3. AI Analysis: Google Gemini Vision
**Rationale:** Strong multimodal capabilities for image understanding, text extraction (OCR), and translation analysis. Integrated with Google Cloud.
**Alternatives:** OpenAI GPT-4 Vision (separate vendor), Claude (no image support at time of design)

### 4. Architecture: Next.js API Routes
**Rationale:** Single deployment unit, serverless functions via Cloud Run, shared types between frontend and backend.
**Alternatives:** Separate Express backend (more complexity), Firebase Functions (less control)

### 5. Data Model
```
memes/{id}:
  - imageUrl: string (R2 URL)
  - description: string
  - category: string
  - tags: string[]
  - createdAt: timestamp
  - updatedAt: timestamp

categories/{id}:
  - name: string
  - slug: string
```

### 6. Upload Flow
1. Client uploads image to R2 via presigned URL
2. Server triggers Gemini analysis
3. Gemini returns description suggestion and location tag
4. User reviews/edits metadata
5. Server saves metadata to Firestore

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Gemini API rate limits or downtime | Graceful degradation: allow manual metadata entry if AI fails |
| Improper content uploads | MVP accepts this risk; add moderation in future iteration |
| R2 storage costs grow unbounded | Add image size limits, implement cleanup policy |
| Large file uploads timeout | Use presigned URLs for direct client-to-R2 upload |
| Gemini misidentifies translations | Allow user to edit AI-generated descriptions |

## Migration Plan

N/A - Greenfield deployment.

**Deployment Steps:**
1. Provision R2 bucket and configure CORS
2. Create Firestore database and collections
3. Configure Gemini API credentials
4. Set up Cloud Build trigger from GitHub
5. Deploy initial version to Cloud Run
6. Configure custom domain (if needed)

**Rollback:**
- Cloud Run: `gcloud run services update-traffic memepix --to-revisions PREVIOUS_REVISION=100`
- Firestore: Delete collections if schema incompatible
- R2: Empty bucket and re-upload if storage structure changes
