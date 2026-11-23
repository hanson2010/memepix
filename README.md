# Memepix

A web app for sharing meme pictures, especially improper or humorous Chinese-to-English translations. Built with Next.js 16, it stores data in Google Firestore and images in Cloudflare R2, and runs on Google Cloud Run.

## Features

- Sign in with GitHub to upload; anyone can browse. You can edit or delete only your own memes.
- Uploads are converted to JPEG, resized to at most 1920px and stored in R2 under `YYYY/MM/<hash>.jpg`.
- Gemini analyzes each upload and suggests a description, category and tags, including the city when it can tell the location.
- Browse and filter by category and tags; a tag cloud lists all tags.
- After 10 uploads in 30 minutes, Cloudflare Turnstile asks for a captcha.

## Run Locally

Requires Node.js 22+, a Google Cloud project with a Firestore database, a Google OAuth client, a GitHub OAuth app, an R2 bucket and a Gemini API key. Turnstile is optional.

```bash
npm install
cp .env.local.example .env.local   # fill in the values; each is described in the file
npm run dev                        # http://localhost:3000
npm test
```

**Firestore:** run `gcloud auth application-default login`, or set `GOOGLE_APPLICATION_CREDENTIALS` to a service account key.

**Google OAuth:** in Google Cloud Console → APIs & Services → Credentials, create an OAuth client ID of type "Web application" with the redirect URI `<NEXTAUTH_URL>/api/auth/callback/google`. One client can hold both the local and the production URI.

**GitHub OAuth:** in GitHub → Settings → Developer settings → OAuth Apps, create an app with the callback URL `<NEXTAUTH_URL>/api/auth/callback/github`. GitHub allows one callback URL per app, so use separate apps for local and production.

**Behind an HTTP proxy:** sign-in and Gemini requests use Node's `fetch`, which ignores `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1` is also set when Node starts (not in `.env.local`), e.g. `NODE_USE_ENV_PROXY=1 NO_PROXY=localhost,127.0.0.1,::1 npm run dev`.

**R2:** create an API token with read and write access to the bucket, and allow uploads from the app's origins in the bucket's CORS policy:

```json
[{ "AllowedOrigins": ["http://localhost:3000", "https://memepix.pythoner.work"], "AllowedMethods": ["PUT", "GET"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
```

## Deploy

On each push to `main`, Cloud Build builds the app and deploys it to Cloud Run using [cloudbuild.yaml](cloudbuild.yaml). Settings (client and key IDs, bucket, URLs) are set there; secrets come from one JSON secret. One-time setup:

1. Enable the APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com secretmanager.googleapis.com
   ```
2. Store the six secrets as one JSON secret named `memepix-app-secrets` (if it already exists, use `gcloud secrets versions add memepix-app-secrets --data-file=-` instead):
   ```bash
   echo -n '{"NEXTAUTH_SECRET":"...","GOOGLE_CLIENT_SECRET":"...","GITHUB_CLIENT_SECRET":"...","GOOGLE_AI_API_KEY":"...","R2_SECRET_ACCESS_KEY":"...","TURNSTILE_SECRET_KEY":"..."}' \
     | gcloud secrets create memepix-app-secrets --data-file=-
   ```
3. Grant the Cloud Build service account its roles, and the Cloud Run service account access to the secret:
   ```bash
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
   CLOUD_BUILD_SA="$PROJECT_NUMBER@cloudbuild.gserviceaccount.com"

   for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/secretmanager.secretAccessor; do
     gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$CLOUD_BUILD_SA" --role="$ROLE"
   done

   gcloud secrets add-iam-policy-binding memepix-app-secrets \
     --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```
4. Connect the GitHub repository and create a trigger on `^main$` with `cloudbuild.yaml` (Cloud Console → Cloud Build → Triggers).
5. Check the settings in `--set-env-vars` in `cloudbuild.yaml`, including `GOOGLE_CLIENT_ID`. Add `<NEXTAUTH_URL>/api/auth/callback/google` to the Google OAuth client and `<NEXTAUTH_URL>/api/auth/callback/github` to the production GitHub OAuth app.
6. Let Firestore delete unused tags, expired upload records and unconfirmed account merges (usually within 24 hours of `expiresAt`):
   ```bash
   gcloud firestore fields ttls update expiresAt --collection-group=tags --enable-ttl
   gcloud firestore fields ttls update expiresAt --collection-group=uploads --enable-ttl
   gcloud firestore fields ttls update expiresAt --collection-group=pendingMerges --enable-ttl
   ```
7. Create the index for per-account upload counting:
   ```bash
   gcloud firestore indexes composite create --collection-group=uploads \
     --field-config=field-path=ownerId,order=ascending --field-config=field-path=timestamp,order=ascending
   ```
8. Before the first deploy with Google sign-in, lowercase the uploader emails on existing memes so their owners can claim them (safe to rerun):
   ```bash
   node scripts/lowercase-uploaded-by.mjs --dry-run   # list the changes
   node scripts/lowercase-uploaded-by.mjs
   ```
9. Create gallery thumbnails (`thumbs/480/YYYY/MM/<hash>.webp`) for memes uploaded before thumbnails existed (safe to rerun; behind a proxy add `NODE_USE_ENV_PROXY=1`):
   ```bash
   node scripts/create-thumbnails.mjs --dry-run   # list the thumbnails to create
   node scripts/create-thumbnails.mjs
   ```

To roll back, send traffic to an earlier revision:

```bash
gcloud run services update-traffic memepix --to-revisions=REVISION_NAME=100 --region=us-west1
```

## License

MIT. See [LICENSE](LICENSE).
